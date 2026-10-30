import { e, uid, request } from './open-circle.js';

let sid = new URLSearchParams(location.search).get('s'), state = null, polling = false, pending = false, signature = '', includes = new Set();
const api = (route, body) => request('host/' + route, { sid, body });
const status = message => { document.querySelector('#status').textContent = message; };
const error = message => { document.querySelector('#error').textContent = message; };
const pendingKey = () => 'open-circle-release:' + sid;
const voteLabels = { for: 'For', against: 'Against', blank: 'Blank' };
const workshopActionStatus = action => ({ 'activate-voting': 'Voting is now open.', 'close-voting': 'Voting is closed.', 'vote-exclude': 'Vote marked as does not count.', 'vote-count': 'Vote is counted again.', 'vote-delete': 'Vote deleted. The organization can vote again while voting is open.', end: 'Workshop 1 session ended.' })[action];
const workshopLabel = session => `Workshop ${session.workshopType === 'workshop-1' ? '1' : '2'} · ${session.workshopTitle}`;
async function work(fn) {
  if (pending) return; pending = true; error(''); document.querySelectorAll('#controls button').forEach(b => b.disabled = true);
  try { await fn(); } catch (err) { error(err.message); }
  finally { pending = false; signature = ''; await refresh(); }
}
function choose(id) {
  if (pending) return;
  sid = id; state = null; includes.clear(); signature = '';
  document.querySelector('#controls').textContent = 'Opening workshop room…';
  document.querySelectorAll('[data-session]').forEach(button => button.classList.toggle('current', button.dataset.session === sid));
  history.replaceState(null, '', '/host?s=' + encodeURIComponent(sid)); refresh();
}
async function listSessions() {
  const data = await api('sessions');
  document.querySelector('#sessions').innerHTML = `<h2>Your workshop sessions</h2><div class="session-list">${data.sessions.map(s => `<button class="secondary ${s.id === sid ? 'current' : ''}" data-session="${e(s.id)}">${e(s.label)} · ${e(workshopLabel(s))} · ${e(s.kind)} · ${e(s.phase)}</button>`).join('') || '<p>No sessions yet. Create a rehearsal below.</p>'}</div><details><summary>Create a separate session</summary><form id="create-session"><label for="workshop-type">Workshop</label><select id="workshop-type">${data.workshops.map(w => `<option value="${e(w.id)}">Workshop ${w.number} · ${e(w.title)}</option>`).join('')}</select><label for="label">Session label</label><input id="label" required maxlength="80" placeholder="Workshop 2 rehearsal"><label for="kind">Session type</label><select id="kind"><option value="rehearsal">Rehearsal (can be reset)</option><option value="live">Live (protected from reset)</option></select><label for="hours">Delete session data after this many hours</label><input id="hours" type="number" min="1" max="168" value="24" required><p class="muted">Expiry blocks access immediately. Expired data is removed on the next session read or host session listing. Use Clear data to delete immediately.</p><button>Create session</button></form></details>`;
  document.querySelectorAll('[data-session]').forEach(b => b.onclick = () => choose(b.dataset.session));
  const form = document.querySelector('#create-session');
  document.querySelector('#workshop-type').onchange = event => { document.querySelector('#label').placeholder = `Workshop ${event.target.value === 'workshop-1' ? '1' : '2'} rehearsal`; };
  let creationId = uid().slice(0, 16);
  form.onsubmit = ev => {
    ev.preventDefault(); const button = ev.submitter; if (button.disabled) return; button.disabled = true;
    work(async () => {
      const result = await api('sessions', { id: creationId, label: document.querySelector('#label').value, kind: document.querySelector('#kind').value, workshopType: document.querySelector('#workshop-type').value, expiresAt: Date.now() + Number(document.querySelector('#hours').value) * 3600000 });
      sid = result.session.id; includes.clear(); creationId = uid().slice(0, 16); history.replaceState(null, '', '/host?s=' + sid);
      status(result.retried ? 'Session already created. Share the room link or QR.' : `Session created. Teams join with the QR or room link and ${result.session.workshopType === 'workshop-1' ? 'their organization’s name' : 'their paper profile'}.`);
      await listSessions();
    }).finally(() => { button.disabled = false; });
  };
}
function voteRow(row, waiting) {
  return `<tr data-vote-card="${row.card}"><th scope="row">${e(row.name)}</th><td>${row.members}</td><td>${row.mandate}<small>${(row.mandate / state.voting.totalMandate * 100).toFixed(1)}% of total</small></td><td><span class="vote-badge ${row.choice ? 'vote-' + row.choice : ''}">${row.choice ? voteLabels[row.choice] : row.deleted ? 'Vote deleted' : row.joined ? 'Not voted' : 'Not joined'}</span>${row.choice ? `<small class="${row.counted ? '' : 'vote-excluded'}">${row.counted ? 'Counted' : 'Does not count'}</small>` : ''}</td><td>${row.choice ? `<div class="vote-row-actions"><button id="vote-toggle-${row.card}" data-vote-change="${row.counted ? 'vote-exclude' : 'vote-count'}" data-card="${row.card}" class="secondary" ${waiting ? 'disabled' : ''}>${row.counted ? 'Does not count' : 'Count vote'}</button><button id="vote-delete-${row.card}" data-vote-change="vote-delete" data-card="${row.card}" class="danger" ${waiting ? 'disabled' : ''}>Delete vote</button></div>` : '<span class="muted">No vote to change</span>'}</td></tr>`;
}
function voteHistory(voting) {
  if (!voting.history.length) return '';
  return `<details id="vote-history"><summary>Host vote changes (${voting.history.length})</summary><p>Changes stay in the host record and export for the debrief. Rehearsal reset clears them.</p><ol>${[...voting.history].reverse().map(change => `<li><strong>${e(voting.rows.find(row => row.card === change.card)?.name || '')}</strong> · ${voteLabels[change.choice]} · ${change.weight} members<br>${e(({ 'vote-exclude': 'Marked does not count', 'vote-count': 'Counted again', 'vote-delete': 'Deleted' })[change.action])} · <time datetime="${e(change.at)}">${e(new Date(change.at).toLocaleTimeString())}</time></li>`).join('')}</ol></details>`;
}
function votingPanel() {
  const voting = state.voting;
  const activate = state.actions.find(action => action.id === 'activate-voting');
  const close = state.actions.find(action => action.id === 'close-voting');
  const waiting = !!sessionStorage.getItem(pendingKey());
  const lead = voting.status === 'inactive' ? 'Voting not active' : voting.leader === 'none' ? 'No For or Against votes yet' : voting.leader === 'tie' ? 'For and Against are tied' : `${voteLabels[voting.leader]} leads`;
  return `<section class="panel voting-panel" aria-labelledby="voting-heading"><span class="eyebrow">WEIGHTED VOTING · ${e(voting.status)}${state.paused ? ' · PAUSED' : ''}</span><h2 id="voting-heading">Organization votes</h2><p>${e(voting.question)}</p><div class="vote-leader" role="status"><span class="eyebrow">${voting.status === 'closed' ? 'VOTING CLOSED' : 'CURRENT LEAD'}</span><strong id="vote-leader">${e(lead)}</strong><p>For ${voting.totals.for} · Against ${voting.totals.against} · Blank ${voting.totals.blank}</p></div><div class="vote-totals">${Object.entries(voteLabels).map(([key, label]) => `<div><span>${label}</span><strong id="total-${key}">${voting.totals[key]}</strong><small>weighted votes</small></div>`).join('')}</div><p id="vote-turnout">${voting.votedOrganizations} / 6 organizations voted · ${voting.castMandate} / ${voting.totalMandate} members represented · ${voting.uncastMandate} without a current vote</p><p id="vote-counting">${voting.countedMandate} voting weight counted · ${voting.excludedMandate} excluded (${voting.excludedOrganizations} organizations)</p><p class="muted">One member = one unit of voting weight. Blank votes count toward participation but do not support either side. The lead compares counted For and Against votes. Excluded votes remain visible but add no weight to the totals. Deleting clears the ballot and allows a new vote while voting is open.</p><div class="row"><button id="activate-voting" ${activate.enabled && !waiting ? '' : 'disabled'}>Activate voting</button><button id="action-close-voting" data-action="close-voting" class="secondary" ${close.enabled && !waiting ? '' : 'disabled'}>Close voting</button></div><div class="vote-table-scroll" tabindex="0" role="region" aria-label="Organization voting results"><table class="vote-table"><thead><tr><th scope="col">Organization</th><th scope="col">Members</th><th scope="col">Mandate</th><th scope="col">Vote</th><th scope="col">Host controls</th></tr></thead><tbody>${voting.rows.map(row => voteRow(row, waiting)).join('')}</tbody></table></div>${voteHistory(voting)}</section>`;
}
function newsGuide() {
  return `<details id="news-guide" class="panel"><summary>Organization news feeds · facilitator guide</summary><p>${e(state.news.fiction)}</p><p>Each team receives eight stories as soon as it joins: four tailored stories and four shared pieces. The order mixes reporting, opinion and lighter stories. The framing notes below are private.</p>${state.news.feeds.map(feed => `<details id="news-guide-${feed.card}" class="host-news-group"><summary>${e(feed.name)}</summary><p><strong>Editorial direction:</strong> ${e(feed.direction)}</p>${feed.articles.map((article, index) => `<details id="news-guide-${feed.card}-${article.id}"><summary>${index + 1}. ${e(article.title)}</summary><p><strong>${e(article.category)} · ${e(article.publisher)}</strong> · ${e(article.author)}</p><p>${e(article.summary)}</p>${article.image ? `<img class="host-news-image" src="${e(article.image.src)}" alt="${e(article.image.alt)}" loading="lazy" width="640" height="360">` : ''}${article.body.map(paragraph => `<p>${e(paragraph)}</p>`).join('')}<p class="host-news-framing"><strong>Private framing note:</strong> ${e(article.framing)}</p></details>`).join('')}</details>`).join('')}</details>`;
}
function workshopOneControls(joinLink) {
  const end = state.actions.find(action => action.id === 'end');
  return `<section class="panel"><span class="eyebrow">${e(state.kind)} · PRIVATE CONTROLS</span><h2>${e(state.label)}</h2><p>${e(workshopLabel(state))}</p><p><strong>${state.phase === 'ended' ? 'Ended' : 'Room open'}${state.paused ? ' · PAUSED' : ''}</strong> · ${state.participants}/${state.capacity} associations joined</p><p>Deletion deadline: ${e(new Date(state.expiresAt).toLocaleString())}</p><div class="row"><a href="${e(joinLink)}" target="_blank" rel="noopener">Open participant view ↗</a><a href="${e(joinLink)}&presenter=1" target="_blank" rel="noopener">Open read-only projector ↗</a><button id="pause" class="secondary" ${state.phase === 'ended' ? 'disabled' : ''}>${state.paused ? 'Resume' : 'Pause'} room controls</button><button id="refresh-host" class="secondary">Refresh state</button></div><p class="footnote">Participant link: ${e(joinLink)}</p></section>
  ${votingPanel()}
  ${newsGuide()}
  <details id="team-readiness" class="panel" open><summary>Six associations</summary><p>Give each team its association profile. They scan the room QR and enter their organization’s name on one shared device. Only their own association appears after joining.</p>${state.roles.map(role => `<div class="check-row"><strong>${role.card} · ${e(role.name)}</strong><br><small>${role.claimed ? 'Joined' : 'Not joined'}</small></div>`).join('')}</details>
  <section class="panel"><h2>Workshop 1 room</h2><p>Organization-specific news feeds are available after joining. Participants can read stories but cannot post or browse other associations.</p><button data-action="end" id="action-end" ${end.enabled && !sessionStorage.getItem(pendingKey()) ? '' : 'disabled'}>End session</button></section>
  ${sessionStorage.getItem(pendingKey()) ? '<section class="panel"><p>The last host action has not been confirmed. Retrying the same request is safe.</p><button id="retry-release">Retry pending action</button></section>' : ''}
  <details id="maintenance" class="panel"><summary>Rehearsal reset, export and clear</summary><p>These actions apply only to <strong>${e(state.label)}</strong>. Live sessions cannot be reset.</p><div class="row"><button id="export" class="secondary">Export workshop content</button><button id="reset" class="secondary" ${state.kind !== 'rehearsal' ? 'disabled' : ''}>Reset this rehearsal</button><button id="clear" class="danger">Clear this session’s data</button></div></details>`;
}
function render() {
  const currentSignature = JSON.stringify([state, [...includes], sessionStorage.getItem(pendingKey())]);
  if (signature === currentSignature) return; signature = currentSignature;
  const container = document.querySelector('#controls');
  const opened = new Set([...container.querySelectorAll('details[open]')].map(d => d.id));
  const focusedId = container.contains(document.activeElement) ? document.activeElement.id : null;
  const joinLink = location.origin + '/?s=' + encodeURIComponent(sid);
  container.innerHTML = state.workshopType === 'workshop-1' ? workshopOneControls(joinLink) : `<section class="panel"><span class="eyebrow">${e(state.kind)} · PRIVATE CONTROLS</span><h2>${e(state.label)}</h2><p>${e(workshopLabel(state))}</p><p><strong>${e(state.phase)}${state.paused ? ' · PAUSED' : ''}</strong> · ${state.participants}/${state.capacity} teams · ${state.postCount} committed posts</p><p>Deletion deadline: ${e(new Date(state.expiresAt).toLocaleString())}</p><div class="row"><a href="${e(joinLink)}" target="_blank" rel="noopener">Open participant view ↗</a><a href="${e(joinLink)}&presenter=1" target="_blank" rel="noopener">Open read-only projector ↗</a><button id="pause" class="secondary" ${state.phase === 'ended' ? 'disabled' : ''}>${state.paused ? 'Resume' : 'Pause'} next release</button><button id="refresh-host" class="secondary">Refresh state</button></div><p class="footnote">Participant link: ${e(joinLink)}</p></section>
  <details id="team-readiness" class="panel" ${state.phase === 'opening' ? 'open' : ''}><summary>Seven teams and their profiles</summary>${state.roles.map(r => `<div class="check-row"><strong>Card ${r.card}${r.claimed ? ' · ' + e(r.username) : ''}</strong><br><small>${!r.claimed ? 'Not claimed' : r.hasPost ? 'Joined · first stance recorded' : 'Joined · NO genuine first post'}</small>${r.claimed && !r.hasPost && state.phase === 'debate' ? `<label class="check-row"><input id="include-${e(r.id)}" data-include="${e(r.id)}" type="checkbox" ${includes.has(r.id) ? 'checked' : ''}>Explicitly include this role’s assigned leaning at launch</label>` : ''}</div>`).join('')}<p>Teams join through the room link or QR and enter the name on their paper profile. Their anonymous username is assigned automatically.</p></details>
  <section class="panel"><h2>Private release preview</h2><p>${state.targets.length} affected profiles. Targets become fixed when takeover launches.</p>${state.phase === 'debate' && state.roles.some(r => r.claimed && !r.hasPost) ? '<p class="error">A claimed team has no first post. Open team readiness above to explicitly include its assigned leaning, or leave it out.</p>' : ''}<ul class="handles">${state.targets.map(t => `<li>${e(t.username)} · ${e(t.stance)} · ${e(t.source)}</li>`).join('') || '<li>No eligible target yet. Wait for posts or explicitly include a no-post role above.</li>'}</ul></section>
  ${sessionStorage.getItem(pendingKey()) ? '<section class="panel"><p>A release has not yet been confirmed in this browser. Retrying the same request is safe.</p><button id="retry-release">Retry pending release</button></section>' : ''}
  <section class="host-actions">${state.actions.map(a => `<div class="panel"><span class="eyebrow">${e(a.type)}</span><h3>${e(a.label)}</h3><p class="action-count">${a.count} new posts</p><p class="handles">${a.names.length ? a.names.map(e).join(', ') : 'No affected profiles yet'}</p><button id="action-${e(a.id)}" data-action="${e(a.id)}" class="${a.id === 'exposure' ? 'launch' : ''}" ${a.enabled && !sessionStorage.getItem(pendingKey()) ? '' : 'disabled'}>${e(a.label)}</button><p class="footnote">Available in ${e(a.from)}${a.id === 'exposure' ? ' with at least one eligible team' : ''}.</p></div>`).join('')}</section>
  ${state.recovery ? `<section class="panel" id="recovery-summary"><h2>Team responses</h2><p>${state.recovery.count} / ${state.participants} teams responded privately.</p>${state.recovery.choices.map(choice => `<div class="check-row"><strong>${choice.count}</strong> · ${e(choice.label)}</div>`).join('')}<p class="footnote">These totals are visible only to the host. Teams can update their choice until the session ends.</p></section>` : ''}
  <details id="moderation" class="panel"><summary>Moderate participant writing</summary><p>Hiding a post keeps its place and authorship record. Staged posts cannot be silently removed.</p>${state.posts.map(p => `<article class="post"><strong>${e(p.author.username)}</strong><p>${e(p.text)}</p><button data-hide="${e(p.id)}" class="secondary" ${p.hidden ? 'disabled' : ''}>${p.hidden ? 'Hidden' : 'Hide post'}</button></article>`).join('') || '<p>No team posts yet.</p>'}</details>
  <details id="maintenance" class="panel"><summary>Rehearsal reset, export and clear</summary><p>These actions apply only to <strong>${e(state.label)}</strong>. Live sessions cannot be reset.</p><div class="row"><button id="export" class="secondary">Export workshop content</button><button id="reset" class="secondary" ${state.kind !== 'rehearsal' ? 'disabled' : ''}>Reset this rehearsal</button><button id="clear" class="danger">Clear this session’s data</button></div></details>`;
  opened.forEach(id => { const d = document.getElementById(id); if (d) d.open = true; });
  if (focusedId) document.getElementById(focusedId)?.focus({ preventScroll: true });
  document.querySelector('#refresh-host').onclick = () => { signature = ''; refresh(); };
  document.querySelector('#pause').onclick = () => work(async () => { await api('pause', { paused: !state.paused, version: state.version }); status(state.workshopType === 'workshop-1' ? 'Room controls updated.' : 'Pacing updated. Published posts remain visible.'); });
  document.querySelectorAll('[data-include]').forEach(box => box.onchange = () => { if (box.checked) includes.add(box.dataset.include); else includes.delete(box.dataset.include); signature = ''; refresh(); });
  document.querySelector('#activate-voting')?.addEventListener('click', () => work(async () => { const current = await api('state'); await commit({ action: 'activate-voting', version: current.version, requestId: uid() }); }));
  document.querySelectorAll('[data-vote-change]').forEach(button => button.onclick = () => changeVote(Number(button.dataset.card), button.dataset.voteChange));
  document.querySelectorAll('[data-action]').forEach(button => button.onclick = () => confirmAction(button.dataset.action));
  document.querySelector('#retry-release')?.addEventListener('click', () => work(() => commit(JSON.parse(sessionStorage.getItem(pendingKey())))));
  document.querySelectorAll('[data-hide]').forEach(button => button.onclick = () => work(() => api('moderate', { version: state.version, postId: button.dataset.hide })));
  document.querySelector('#reset').onclick = () => {
    const confirmLabel = prompt('Type the exact rehearsal label to reset this workshop room: ' + state.label);
    if (confirmLabel === null) return;
    work(async () => { const result = await api('reset', { version: state.version, confirmLabel, expiresAt: Date.now() + 86400000 }); includes.clear(); sessionStorage.removeItem(pendingKey()); status('Rehearsal reset. Teams can join again; previous access is invalid.'); });
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
function changeVote(card, action) {
  if (pending || sessionStorage.getItem(pendingKey())) return;
  const row = state.voting.rows.find(row => row.card === card);
  if (!row?.choice) return;
  const payload = { action, card, votingId: state.voting.id, ballotRequestId: row.ballotRequestId, version: state.version, requestId: uid() };
  if (action !== 'vote-delete') { work(() => commit(payload)); return; }
  const selected = sid, dialog = document.querySelector('#confirm-dialog');
  document.querySelector('#confirm-title').textContent = 'Delete organization vote';
  document.querySelector('#confirm-release').textContent = 'Delete vote';
  document.querySelector('#confirm-copy').innerHTML = `<p>Delete <strong>${e(row.name)}</strong>’s <strong>${voteLabels[row.choice]}</strong> vote representing ${row.mandate} members?</p><p>It will be removed from the results. The organization can vote again if voting is open. The host change history will retain this action for the debrief.</p>`;
  dialog.returnValue = ''; dialog.showModal();
  dialog.onclose = () => { if (dialog.returnValue === 'confirm' && sid === selected) work(() => commit(payload)); };
}
async function confirmAction(id) {
  if (pending) return;
  await refresh();
  const action = state.actions.find(a => a.id === id); if (!action?.enabled) return;
  const payload = { action: id, version: state.version, requestId: uid(), includeFallback: [...includes] };
  const dialog = document.querySelector('#confirm-dialog');
  document.querySelector('#confirm-title').textContent = action.label;
  document.querySelector('#confirm-release').textContent = 'Confirm release';
  document.querySelector('#confirm-copy').innerHTML = `<p><strong>${e(state.label)}</strong> · Current phase: ${e(state.phase)}</p><p>${e(action.type)}</p><p><strong>${action.count} new posts</strong> affecting ${state.targets.length} profiles:</p><ul>${state.targets.map(t => `<li>${e(t.username)} — ${e(t.source)}</li>`).join('')}</ul><p>${id === 'reveal' ? 'Provenance will become visible and teams can correct the record.' : 'The release will be committed for every selected team at once.'}</p>`;
  if (state.workshopType === 'workshop-1') document.querySelector('#confirm-copy').innerHTML = `<p>${e(action.label)} for <strong>${e(state.label)}</strong>?</p><p>${id === 'close-voting' ? 'No new ballots will be accepted. Recorded votes and the weighted results will remain available.' : 'Joining and voting will close. Existing teams can still see their association and recorded vote until the deletion deadline.'}</p>`;
  dialog.returnValue = ''; dialog.showModal();
  dialog.onclose = () => { if (dialog.returnValue === 'confirm') work(() => commit(payload)); };
}
async function commit(payload) {
  sessionStorage.setItem(pendingKey(), JSON.stringify(payload));
  try {
    const result = await api('action', payload);
    sessionStorage.removeItem(pendingKey());
    status(state.workshopType === 'workshop-1' ? workshopActionStatus(result.action) : `Released: ${result.count} posts · ${result.action} committed · current phase: ${result.phase}`);
  } catch (err) {
    if (err.status === 409 || err.status === 400) sessionStorage.removeItem(pendingKey());
    throw err;
  }
}
async function refresh() {
  if (!sid || polling || pending) return; polling = true;
  const requestedSession = sid;
  try {
    const next = await api('state' + ([...includes].length ? '?' + [...includes].map(id => 'include=' + encodeURIComponent(id)).join('&') : ''));
    if (sid !== requestedSession) return;
    state = next;
    const saved = sessionStorage.getItem(pendingKey());
    if (saved) { const payload = JSON.parse(saved), event = state.events[payload.requestId]; if (event) { sessionStorage.removeItem(pendingKey()); status(state.workshopType === 'workshop-1' ? workshopActionStatus(event.action) + ' Confirmed after reconnect.' : `Released: ${event.count} posts · ${event.action} confirmed after reconnect.`); } }
    render();
    const selectedSession = document.querySelector(`[data-session="${sid}"]`);
    if (selectedSession) selectedSession.textContent = `${state.label} · ${workshopLabel(state)} · ${state.kind} · ${state.phase}`;
  } catch (err) { if (sid !== requestedSession) return; error(err.message); if (err.status === 401) location.replace('/host' + location.search); if (err.status === 410) { document.querySelector('#controls').innerHTML = '<p>Session expired or cleared. Choose or create another session.</p>'; } }
  finally { polling = false; if (sid && sid !== requestedSession) void refresh(); }
}
document.querySelector('#logout').onclick = () => work(async () => { await api('logout', {}); location.replace('/host'); });
window.addEventListener('pageshow', ev => { if (ev.persisted) location.reload(); });
try { await listSessions(); await refresh(); } catch (err) { error(err.message); }
setInterval(refresh, 2000);
