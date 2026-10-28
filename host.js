import { e, uid, request } from './open-circle.js';

let sid = new URLSearchParams(location.search).get('s'), state = null, polling = false, pending = false, signature = '', includes = new Set(), profileSearch = '';
const api = (route, body) => request('host/' + route, { sid, body });
const status = message => { document.querySelector('#status').textContent = message; };
const error = message => { document.querySelector('#error').textContent = message; };
const pendingKey = () => 'open-circle-release:' + sid;
async function work(fn) {
  if (pending) return; pending = true; error(''); document.querySelectorAll('#controls button').forEach(b => b.disabled = true);
  try { await fn(); } catch (err) { error(err.message); }
  finally { pending = false; signature = ''; await refresh(); }
}
function choose(id) { sid = id; includes.clear(); signature = ''; history.replaceState(null, '', '/host?s=' + encodeURIComponent(sid)); refresh(); }
async function listSessions() {
  const data = await api('sessions');
  document.querySelector('#sessions').innerHTML = `<details id="session-options" ${sid ? '' : 'open'}><summary>Switch or create session</summary><div class="session-list">${data.sessions.map(s => `<button class="secondary ${s.id === sid ? 'current' : ''}" data-session="${e(s.id)}">${e(s.label)} · ${e(s.kind)} · ${e(s.phase)} · ${s.scenario === 'transport-v1' ? 'Youth transport' : 'Earlier scenario'}</button>`).join('') || '<p>No sessions yet. Create a rehearsal below.</p>'}</div><details><summary>Create a separate session</summary><form id="create-session"><label for="label">Session label</label><input id="label" required maxlength="80" placeholder="Workshop 2 rehearsal"><label for="kind">Session type</label><select id="kind"><option value="rehearsal">Rehearsal (can be reset)</option><option value="live">Live (protected from reset)</option></select><label for="hours">Delete session data after this many hours</label><input id="hours" type="number" min="1" max="168" value="24" required><p class="muted">Expiry blocks access immediately. Expired data is removed on the next session read or host session listing. Use Clear data to delete immediately.</p><button>Create session</button></form></details></details>`;
  document.querySelectorAll('[data-session]').forEach(b => b.onclick = () => choose(b.dataset.session));
  const form = document.querySelector('#create-session');
  let creationId = uid().slice(0, 16);
  form.onsubmit = ev => {
    ev.preventDefault(); const button = ev.submitter; if (button.disabled) return; button.disabled = true;
    work(async () => {
      const result = await api('sessions', { id: creationId, label: document.querySelector('#label').value, kind: document.querySelector('#kind').value, expiresAt: Date.now() + Number(document.querySelector('#hours').value) * 3600000 });
      sid = result.session.id; includes.clear(); creationId = uid().slice(0, 16); history.replaceState(null, '', '/host?s=' + sid);
      status(result.retried ? 'Session already created. Share the room link or QR.' : 'Session created. Teams join with the QR or room link and their paper profile.');
      await listSessions();
    }).finally(() => { button.disabled = false; });
  };
}
const effectCopy = {
  lockout: ['Lockout', 'Read only; earlier posts disappear'],
  forgery: ['Forged opinions', 'Opposite views posted under their name'],
  exposure: ['Identity exposed', 'Fictional name and town made public'],
  suppression: ['Hidden posts', 'Their contributions disappear for others'],
  support: ['Outside support', 'Support notice and bot animation'],
  takeover: ['Scenario waves', 'Disclosure, forgery and reactions']
};
function phaseLabel(phase) {
  return ({ opening: 'Profiles and introductions', debate: 'Debate', exposure: 'Incident running', forgery: 'Forged posts released', reactions: 'Reactions released', reflection: 'Reflection', recovery: 'Revealed and restored', discussion: 'Room discussion', closing: 'Closing', ended: 'Session ended' })[phase] || phase;
}
function nextHelp() {
  if (sessionStorage.getItem(pendingKey())) return 'Confirm the pending release below before continuing.';
  if (state.paused) return state.incidentTimeline?.pending ? 'Incident paused. Resume to continue the scheduled posts.' : 'Resume when ready. Participants can still use the forum.';
  if (state.incidentTimeline?.pending) return `${state.incidentTimeline.published}/${state.incidentTimeline.total} preset posts published · ${state.incidentTimeline.remainingSeconds}s remaining. Reflection unlocks when the sequence finishes.`;
  if (state.phase === 'opening') return 'Share the participant link and paper profiles. Open debate when the room is ready.';
  if (state.scenario === 'transport-v1' && state.phase === 'debate') {
    const ready = state.targets.filter(t => t.ready && t.matchesCard).length;
    return ready === 7 ? 'All seven have posted. Launch the incident when you are ready.' : `${ready}/7 ready for the incident. Each person must join and publish a first post for their paper role.`;
  }
  return ({ exposure: 'Let people notice the changes, then begin reflection.', reflection: 'Let teams reflect before revealing and restoring their accounts.', recovery: 'Original posts and access are restored. Move to the room discussion when ready.', discussion: 'Discuss whose voices were heard, then begin closing.', closing: 'End the session when the workshop is finished.', ended: 'Posting is closed. Use the reset controls below for another rehearsal.' })[state.phase] || 'Move to the next step when the room is ready.';
}
function roleRow(role) {
  const a = role.activity || { posts: 0, replies: 0, injected: 0, hidden: 0 };
  const planned = effectCopy[role.effect] || effectCopy.takeover;
  let outcome = 'Not triggered', detail = '';
  if (role.incidentState === 'active') {
    outcome = ({ lockout: 'Locked out', forgery: 'False opinions published', exposure: 'Name and town revealed', suppression: 'Hidden from other people', support: 'Support sent', takeover: 'Simulation released' })[role.effect];
    detail = [a.injected ? `${a.injected} simulated ${a.injected === 1 ? 'post' : 'posts'}` : '', a.hidden ? `${a.hidden} own ${a.hidden === 1 ? 'contribution' : 'contributions'} hidden` : ''].filter(Boolean).join(' · ');
  } else if (role.incidentState === 'restored') {
    outcome = 'Revealed & restored';
    detail = a.injected ? `${a.injected} simulated posts labelled` : role.effect === 'support' ? 'Outside support explained' : 'Original posts restored';
    if (a.hidden) detail += ` · ${a.hidden} still moderated`;
  }
  const access = ({ 'not-joined': 'Not joined', waiting: 'Opens with debate', open: 'Can post', locked: 'Read only', closed: 'Closed' })[role.postingAccess] || 'Not joined';
  const target = state.targets.find(t => t.roleId === role.id);
  const readiness = state.phase === 'debate' && state.scenario === 'transport-v1' && role.claimed && !(target?.ready && target?.matchesCard) ? '<small class="needs-post">Needs a first post for their role</small>' : '';
  return `<tr data-role-card="${role.card}" data-person="${e([role.name, role.town, role.username].join(' '))}"><th scope="row"><div class="host-person"><span class="join-dot ${role.claimed ? 'joined' : ''}" aria-label="${role.claimed ? 'Joined' : 'Not joined'}" role="img"></span><div><strong>${e(role.name)}</strong><small>@${e(role.username)} · Card ${role.card}</small></div></div></th><td><strong>${a.posts} ${a.posts === 1 ? 'post' : 'posts'}</strong><small>${a.replies} ${a.replies === 1 ? 'reply' : 'replies'}</small>${a.lastPostedAt ? `<small>Last ${e(new Date(a.lastPostedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}</small>` : '<small>No contributions yet</small>'}${readiness}${state.scenario !== 'transport-v1' && role.claimed && !role.hasPost && state.phase === 'debate' ? `<label><input id="include-${e(role.id)}" data-include="${e(role.id)}" type="checkbox" ${includes.has(role.id) ? 'checked' : ''}>Include assigned role</label>` : ''}</td><td><strong>${e(planned[0])}</strong><small>${e(planned[1])}</small></td><td><span class="outcome ${role.incidentState === 'active' ? 'outcome-active' : role.incidentState === 'restored' ? 'outcome-restored' : ''}">${e(outcome)}</span>${detail ? `<small>${e(detail)}</small>` : ''}</td><td><span class="access access-${e(role.postingAccess || 'not-joined')}">${e(access)}</span>${a.hidden && role.incidentState === 'active' ? '<small>Some posts are hidden</small>' : ''}</td></tr>`;
}
function render() {
  const currentSignature = JSON.stringify([state, [...includes], sessionStorage.getItem(pendingKey())]);
  if (signature === currentSignature) return; signature = currentSignature;
  const container = document.querySelector('#controls');
  const tableScroll = container.querySelector('.host-table-scroll')?.scrollLeft || 0;
  const opened = new Set([...container.querySelectorAll('details[open]')].map(d => d.id));
  const focusedId = container.contains(document.activeElement) ? document.activeElement.id : null;
  const joinLink = location.origin + '/?s=' + encodeURIComponent(sid);
  container.innerHTML = `<section class="panel host-room"><div><span class="eyebrow">PRIVATE HOST · ${e(state.kind)}</span><h2>${e(state.label)}</h2><p>${state.scenario === 'transport-v1' ? 'Bus fares for young people' : 'Earlier workshop scenario'}</p></div><div class="host-links"><a href="${e(joinLink)}" target="_blank" rel="noopener">Participant link ↗</a><a href="${e(joinLink)}&presenter=1" target="_blank" rel="noopener">Open read-only projector ↗</a></div></section>
  <section class="panel host-run"><div class="host-section-heading"><div><h2>Run the workshop</h2><p>${e(phaseLabel(state.phase))}${state.paused ? ' · Paused' : ''} · ${state.participants}/${state.capacity} joined</p></div><button id="pause" class="secondary" ${state.phase === 'ended' ? 'disabled' : ''}>${state.paused ? 'Resume' : 'Pause'} ${state.incidentTimeline?.pending ? 'incident' : 'next release'}</button></div><ol class="host-steps" aria-label="Workshop steps">${state.actions.map((a, i) => {
    const current = state.actions.findIndex(step => step.from === state.phase);
    const done = state.phase === 'ended' || (current >= 0 && i < current);
    return `<li class="${done ? 'step-done' : a.from === state.phase ? 'step-current' : ''}"><span class="step-number" aria-hidden="true">${done ? '✓' : i + 1}</span><button id="action-${e(a.id)}" data-action="${e(a.id)}" aria-label="${e(a.label)}" ${a.enabled && !sessionStorage.getItem(pendingKey()) ? '' : 'disabled'}>${e(a.label)}</button><small>${done ? 'Done' : a.from === state.phase ? 'Next step' : 'Later'}</small></li>`;
  }).join('')}</ol><p class="host-next-help">${e(nextHelp())}</p></section>
  <section id="team-readiness" class="panel host-roster"><div class="host-section-heading"><div><h2>Everyone in the circle</h2><p>Joined → participation → incident → outcome → access</p></div><div class="host-search"><label class="sr-only" for="profile-search">Find a fictional name, town or username</label><input id="profile-search" type="search" value="${e(profileSearch)}" placeholder="Find a person…"></div></div><div class="host-table-scroll" role="region" aria-label="Participant progress" tabindex="0"><table class="host-table"><caption class="sr-only">Seven profiles: joined status, genuine contributions, planned incident, actual outcome and current posting access.</caption><thead><tr><th scope="col">Person</th><th scope="col">Their posts</th><th scope="col">Planned incident</th><th scope="col">What happened</th><th scope="col">Can they post?</th></tr></thead><tbody>${state.roles.map(roleRow).join('')}</tbody></table></div><p class="host-table-key"><span class="join-dot joined" aria-hidden="true"></span>Joined <span class="join-dot" aria-hidden="true"></span>Not joined · Counts are published contributions, not typing or online status.</p><p id="no-people" hidden>No matching person.</p></section>
  ${sessionStorage.getItem(pendingKey()) ? '<section class="panel"><p>A release has not yet been confirmed in this browser. Retrying the same request is safe.</p><button id="retry-release">Retry pending release</button></section>' : ''}
  ${state.recovery ? `<section class="panel" id="recovery-summary"><h2>Team responses</h2><p>${state.recovery.count} / ${state.participants} teams responded privately.</p>${state.recovery.choices.map(choice => `<div class="check-row"><strong>${choice.count}</strong> · ${e(choice.label)}</div>`).join('')}<p class="footnote">These totals are visible only to the host. Teams can update their choice until the session ends.</p></section>` : ''}
  <details id="moderation" class="panel"><summary>Moderate participant writing</summary><p>Hiding a post keeps its place and authorship record. Staged posts cannot be silently removed.</p>${state.posts.map(p => `<article class="post"><strong>${e(p.author.username)}</strong><p>${e(p.text)}</p><button data-hide="${e(p.id)}" class="secondary" ${p.hidden ? 'disabled' : ''}>${p.hidden ? 'Hidden' : 'Hide post'}</button></article>`).join('') || '<p>No team posts yet.</p>'}</details>
  <details id="maintenance" class="panel"><summary>Rehearsal reset, export and clear</summary><p>Deletion deadline: ${e(new Date(state.expiresAt).toLocaleString())}</p><button id="refresh-host" class="secondary">Refresh state</button><p>These actions apply only to <strong>${e(state.label)}</strong>. Reset clears every profile, post, incident, flag and device token in this rehearsal; its room link stays the same and participants create profiles again. Clear data deletes the room itself. Live sessions cannot be reset: create a new live room for another run.</p><details id="profile-release"><summary>Release an individual profile</summary>${state.roles.filter(r => r.claimed).map(r => `<div class="check-row">${e(r.name)} <button class="secondary" data-clear-profile="${e(r.id)}" ${['opening','debate'].includes(state.phase) ? '' : 'disabled'}>Release this profile</button></div>`).join('') || '<p>No joined profiles.</p>'}</details><div class="row"><button id="export" class="secondary">Export workshop content</button><button id="reset" class="secondary" ${state.kind !== 'rehearsal' ? 'disabled' : ''}>Reset this rehearsal</button><button id="clear" class="danger">Clear this session’s data</button></div></details>`;
  const applySearch = () => {
    const normalise = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[øæœðþłß]/g, c => ({ø:'o',æ:'ae',œ:'oe',ð:'d',þ:'th',ł:'l',ß:'ss'}[c]));
    document.querySelectorAll('[data-person]').forEach(row => { row.hidden = !normalise(row.dataset.person).includes(normalise(profileSearch)); });
    document.querySelector('#no-people').hidden = [...document.querySelectorAll('[data-person]')].some(row => !row.hidden);
  };
  document.querySelector('#profile-search').oninput = event => { profileSearch = event.target.value; applySearch(); };
  applySearch();
  container.querySelector('.host-table-scroll').scrollLeft = tableScroll;
  opened.forEach(id => { const d = document.getElementById(id); if (d) d.open = true; });
  if (focusedId) document.getElementById(focusedId)?.focus({ preventScroll: true });
  document.querySelector('#refresh-host').onclick = () => { signature = ''; refresh(); };
  document.querySelector('#pause').onclick = () => work(async () => { await api('pause', { paused: !state.paused, version: state.version }); status('Pacing updated. Published posts remain visible.'); });
  document.querySelectorAll('[data-clear-profile]').forEach(button => button.onclick = () => {
    const role = state.roles.find(role => role.id === button.dataset.clearProfile);
    const confirmName = prompt('Release ' + role.name + '? This clears its profile, device access, posts and dependent replies. Type the exact fictional name: ' + role.name);
    if (confirmName === null) return;
    work(async () => { const result = await api('clear-profile', { version: state.version, roleId: role.id, confirmName }); status(role.name + ' can join again. Cleared ' + result.removedPosts + ' posts and old device access.'); });
  });
  document.querySelectorAll('[data-include]').forEach(box => box.onchange = () => { if (box.checked) includes.add(box.dataset.include); else includes.delete(box.dataset.include); signature = ''; refresh(); });
  document.querySelectorAll('[data-action]').forEach(button => button.onclick = () => confirmAction(button.dataset.action));
  document.querySelector('#retry-release')?.addEventListener('click', () => work(() => commit(JSON.parse(sessionStorage.getItem(pendingKey())))));
  document.querySelectorAll('[data-hide]').forEach(button => button.onclick = () => work(() => api('moderate', { version: state.version, postId: button.dataset.hide })));
  document.querySelector('#reset').onclick = () => {
    const confirmLabel = prompt('Type the exact rehearsal label to reset its teams, posts and phases: ' + state.label);
    if (confirmLabel === null) return;
    work(async () => { const result = await api('reset', { version: state.version, confirmLabel, expiresAt: Date.now() + 86400000 }); includes.clear(); sessionStorage.removeItem(pendingKey()); status('Rehearsal reset. Teams can join again with their paper profiles; previous access is invalid.'); });
  };
  document.querySelector('#clear').onclick = () => {
    const confirmLabel = prompt('Permanently clear this session. Type its exact label: ' + state.label); if (confirmLabel === null) return;
    work(async () => { await api('delete', { confirmLabel }); sessionStorage.removeItem(pendingKey()); sid = null; state = null; history.replaceState(null, '', '/host'); document.querySelector('#controls').innerHTML = ''; status('Session data cleared.'); await listSessions(); });
  };
  document.querySelector('#export').onclick = () => work(async () => {
    const content = await api('export'), blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' }), link = document.createElement('a');
    link.href = URL.createObjectURL(blob); link.download = 'open-circle-' + sid + '.json'; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    status('Content export downloaded. Keep it private and delete it after rehearsal troubleshooting.');
  });
}
async function confirmAction(id) {
  if (pending) return;
  await refresh();
  const action = state.actions.find(a => a.id === id); if (!action?.enabled) return;
  const payload = { action: id, version: state.version, requestId: uid(), includeFallback: [...includes] };
  const dialog = document.querySelector('#confirm-dialog');
  document.querySelector('#confirm-title').textContent = action.label;
  document.querySelector('#confirm-copy').innerHTML = `<p><strong>${e(state.label)}</strong></p>${action.count ? `<p>${action.count} simulated posts will be published${id === 'incident' ? ' over 2 minutes 40 seconds' : ''}.</p><ul>${state.targets.map(t => `<li>${e(t.name || t.username)} — ${e(t.source)}</li>`).join('')}</ul>` : ''}<p>${id === 'reveal' ? 'Restore access and original posts, label the simulation, and open corrections.' : id === 'debate' ? 'Open posting for everyone who has joined.' : id === 'end' ? 'Close participation for this session.' : `Move the room to ${e(phaseLabel(action.to).toLowerCase())}.`}</p>`;
  dialog.returnValue = ''; dialog.showModal();
  dialog.onclose = () => { if (dialog.returnValue === 'confirm') work(() => commit(payload)); };
}
async function commit(payload) {
  sessionStorage.setItem(pendingKey(), JSON.stringify(payload));
  try {
    const result = await api('action', payload);
    sessionStorage.removeItem(pendingKey());
    status(`${phaseLabel(result.phase)}${result.count ? ` · ${result.count} simulated posts published` : ''}.`);
  } catch (err) {
    if (err.status === 409 || err.status === 400) sessionStorage.removeItem(pendingKey());
    throw err;
  }
}
async function refresh() {
  if (!sid || polling || pending) return; polling = true;
  try {
    state = await api('state' + ([...includes].length ? '?' + [...includes].map(id => 'include=' + encodeURIComponent(id)).join('&') : ''));
    const saved = sessionStorage.getItem(pendingKey());
    if (saved) { const payload = JSON.parse(saved), event = state.events[payload.requestId]; if (event) { sessionStorage.removeItem(pendingKey()); status(`Released: ${event.count} posts · ${event.action} confirmed after reconnect.`); } }
    render();
    const selectedSession = document.querySelector(`[data-session="${sid}"]`);
    if (selectedSession) selectedSession.textContent = `${state.label} · ${state.kind} · ${state.phase}`;
  } catch (err) { error(err.message); if (err.status === 401) location.replace('/host' + location.search); if (err.status === 410) { document.querySelector('#controls').innerHTML = '<p>Session expired or cleared. Choose or create another session.</p>'; } }
  finally { polling = false; }
}
document.querySelector('#logout').onclick = () => work(async () => { await api('logout', {}); location.replace('/host'); });
window.addEventListener('pageshow', ev => { if (ev.persisted) location.reload(); });
try { await listSessions(); await refresh(); } catch (err) { error(err.message); }
setInterval(refresh, 2000);
