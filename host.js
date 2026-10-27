import { e, uid, request } from './open-circle.js';

let sid = new URLSearchParams(location.search).get('s'), state = null, polling = false, pending = false, codes = [], signature = '', includes = new Set();
const api = (route, body) => request('host/' + route, { sid, body });
const status = message => { document.querySelector('#status').textContent = message; };
const error = message => { document.querySelector('#error').textContent = message; };
const pendingKey = () => 'open-circle-release:' + sid;
async function work(fn) {
  if (pending) return; pending = true; error(''); document.querySelectorAll('#controls button').forEach(b => b.disabled = true);
  try { await fn(); } catch (err) { error(err.message); }
  finally { pending = false; signature = ''; await refresh(); }
}
function choose(id) { sid = id; codes = []; includes.clear(); signature = ''; history.replaceState(null, '', '/host?s=' + encodeURIComponent(sid)); refresh(); }
async function listSessions() {
  const data = await api('sessions');
  document.querySelector('#sessions').innerHTML = `<h2>Your workshop sessions</h2><div class="session-list">${data.sessions.map(s => `<button class="secondary ${s.id === sid ? 'current' : ''}" data-session="${e(s.id)}">${e(s.label)} · ${e(s.kind)} · ${e(s.phase)}</button>`).join('') || '<p>No sessions yet. Create a rehearsal below.</p>'}</div><details><summary>Create a separate session</summary><form id="create-session"><label for="label">Session label</label><input id="label" required maxlength="80" placeholder="Workshop 2 rehearsal"><label for="kind">Session type</label><select id="kind"><option value="rehearsal">Rehearsal (can be reset)</option><option value="live">Live (protected from reset)</option></select><label for="hours">Delete session data after this many hours</label><input id="hours" type="number" min="1" max="168" value="24" required><p class="muted">Expiry blocks access immediately. Expired data is removed on the next session read or host session listing. Use Clear data to delete immediately.</p><button>Create session</button></form></details>`;
  document.querySelectorAll('[data-session]').forEach(b => b.onclick = () => choose(b.dataset.session));
  const form = document.querySelector('#create-session');
  let creationId = uid().slice(0, 16);
  form.onsubmit = ev => {
    ev.preventDefault(); const button = ev.submitter; if (button.disabled) return; button.disabled = true;
    work(async () => {
      const result = await api('sessions', { id: creationId, label: document.querySelector('#label').value, kind: document.querySelector('#kind').value, expiresAt: Date.now() + Number(document.querySelector('#hours').value) * 3600000 });
      sid = result.session.id; codes = result.codes; includes.clear(); creationId = uid().slice(0, 16); history.replaceState(null, '', '/host?s=' + sid);
      status(result.retried ? 'Session already created. Reissue unclaimed codes if the earlier response was lost.' : 'Session created. Give each team only its own code.');
      await listSessions();
    }).finally(() => { button.disabled = false; });
  };
}
function render() {
  const currentSignature = JSON.stringify([state, codes, [...includes], sessionStorage.getItem(pendingKey())]);
  if (signature === currentSignature) return; signature = currentSignature;
  const container = document.querySelector('#controls');
  const opened = new Set([...container.querySelectorAll('details[open]')].map(d => d.id));
  const focusedId = container.contains(document.activeElement) ? document.activeElement.id : null;
  const joinLink = location.origin + '/?s=' + encodeURIComponent(sid);
  container.innerHTML = `<section class="panel"><span class="eyebrow">${e(state.kind)} · PRIVATE CONTROLS</span><h2>${e(state.label)}</h2><p><strong>${e(state.phase)}${state.paused ? ' · PAUSED' : ''}</strong> · ${state.participants}/7 teams · ${state.postCount} committed posts</p><p>Deletion deadline: ${e(new Date(state.expiresAt).toLocaleString())}</p><div class="row"><a href="${e(joinLink)}" target="_blank" rel="noopener">Open participant view ↗</a><a href="${e(joinLink)}&presenter=1" target="_blank" rel="noopener">Open read-only projector ↗</a><button id="pause" class="secondary" ${state.phase === 'ended' ? 'disabled' : ''}>${state.paused ? 'Resume' : 'Pause'} next release</button><button id="refresh-host" class="secondary">Refresh state</button></div><p class="footnote">Participant link: ${e(joinLink)}</p></section>
  <details id="team-readiness" class="panel" ${state.phase === 'opening' ? 'open' : ''}><summary>Seven teams, seven existing handles</summary>${state.roles.map(r => `<div class="check-row"><strong>Card ${r.card} · @${e(r.handle)}</strong><br><small>${!r.claimed ? 'Not claimed' : r.hasPost ? 'Joined · first stance recorded' : 'Joined · NO genuine first post'}</small>${r.claimed && !r.hasPost && state.phase === 'debate' ? `<label class="check-row"><input id="include-${e(r.id)}" data-include="${e(r.id)}" type="checkbox" ${includes.has(r.id) ? 'checked' : ''}>Explicitly include this role’s assigned leaning at launch</label>` : ''}</div>`).join('')}<details id="codes"><summary>Private one-use team codes</summary><p>Distribute one code per card. Codes are shown only after creation or reissue; reissuing invalidates unclaimed codes.</p><div class="code-grid">${codes.map(c => `<div>Card ${c.card} · @${e(c.handle)}<code>${e(c.code)}</code></div>`).join('')}</div><button id="reissue" class="secondary" ${!['opening','debate'].includes(state.phase) ? 'disabled' : ''}>Reissue unclaimed codes</button></details></details>
  <section class="panel"><h2>Private release preview</h2><p>${state.targets.length} affected existing handles. Targets become fixed when takeover launches.</p>${state.phase === 'debate' && state.roles.some(r => r.claimed && !r.hasPost) ? '<p class="error">A claimed team has no first post. Open team readiness above to explicitly include its assigned leaning, or leave it out.</p>' : ''}<ul class="handles">${state.targets.map(t => `<li>@${e(t.handle)} · ${e(t.stance)} · ${e(t.source)}</li>`).join('') || '<li>No eligible target yet. Wait for posts or explicitly include a no-post role above.</li>'}</ul></section>
  ${sessionStorage.getItem(pendingKey()) ? '<section class="panel"><p>A release has not yet been confirmed in this browser. Retrying the same request is safe.</p><button id="retry-release">Retry pending release</button></section>' : ''}
  <section class="host-actions">${state.actions.map(a => `<div class="panel"><span class="eyebrow">${e(a.type)}</span><h3>${e(a.label)}</h3><p class="action-count">${a.count} new posts</p><p class="handles">${a.handles.length ? a.handles.map(h => '@' + e(h)).join(', ') : 'No affected handles yet'}</p><button id="action-${e(a.id)}" data-action="${e(a.id)}" class="${a.id === 'exposure' ? 'launch' : ''}" ${a.enabled ? '' : 'disabled'}>${e(a.label)}</button><p class="footnote">Available in ${e(a.from)}${a.id === 'exposure' ? ' with at least one eligible team' : ''}.</p></div>`).join('')}</section>
  <details id="moderation" class="panel"><summary>Moderate participant writing</summary><p>Hiding a post keeps its place and authorship record. Staged posts cannot be silently removed.</p>${state.posts.map(p => `<article class="post"><strong>@${e(p.author.handle)}</strong><p>${e(p.text)}</p><button data-hide="${e(p.id)}" class="secondary" ${p.hidden ? 'disabled' : ''}>${p.hidden ? 'Hidden' : 'Hide post'}</button></article>`).join('') || '<p>No team posts yet.</p>'}</details>
  <details id="maintenance" class="panel"><summary>Rehearsal reset, export and clear</summary><p>These actions apply only to <strong>${e(state.label)}</strong>. Live sessions cannot be reset.</p><div class="row"><button id="export" class="secondary">Export workshop content</button><button id="reset" class="secondary" ${state.kind !== 'rehearsal' ? 'disabled' : ''}>Reset this rehearsal</button><button id="clear" class="danger">Clear this session’s data</button></div></details>`;
  opened.forEach(id => { const d = document.getElementById(id); if (d) d.open = true; });
  if (focusedId) document.getElementById(focusedId)?.focus({ preventScroll: true });
  document.querySelector('#refresh-host').onclick = () => { signature = ''; refresh(); };
  document.querySelector('#pause').onclick = () => work(async () => { await api('pause', { paused: !state.paused, version: state.version }); status('Pacing updated. Published posts remain visible.'); });
  document.querySelectorAll('[data-include]').forEach(box => box.onchange = () => { if (box.checked) includes.add(box.dataset.include); else includes.delete(box.dataset.include); signature = ''; refresh(); });
  document.querySelector('#reissue').onclick = () => work(async () => { const result = await api('codes', { version: state.version }); codes = result.codes; status('New unclaimed codes issued. Earlier unclaimed codes no longer work.'); });
  document.querySelectorAll('[data-action]').forEach(button => button.onclick = () => confirmAction(button.dataset.action));
  document.querySelector('#retry-release')?.addEventListener('click', () => work(() => commit(JSON.parse(sessionStorage.getItem(pendingKey())))));
  document.querySelectorAll('[data-hide]').forEach(button => button.onclick = () => work(() => api('moderate', { version: state.version, postId: button.dataset.hide })));
  document.querySelector('#reset').onclick = () => {
    const confirmLabel = prompt('Type the exact rehearsal label to reset its teams, posts and phases: ' + state.label);
    if (confirmLabel === null) return;
    work(async () => { const result = await api('reset', { version: state.version, confirmLabel, expiresAt: Date.now() + 86400000 }); codes = result.codes; includes.clear(); sessionStorage.removeItem(pendingKey()); status('Rehearsal reset. Give teams the new codes; previous access is invalid.'); });
  };
  document.querySelector('#clear').onclick = () => {
    const confirmLabel = prompt('Permanently clear this session. Type its exact label: ' + state.label); if (confirmLabel === null) return;
    work(async () => { await api('delete', { confirmLabel }); sessionStorage.removeItem(pendingKey()); sid = null; state = null; codes = []; history.replaceState(null, '', '/host'); document.querySelector('#controls').innerHTML = ''; status('Session data cleared.'); await listSessions(); });
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
  document.querySelector('#confirm-copy').innerHTML = `<p><strong>${e(state.label)}</strong> · Current phase: ${e(state.phase)}</p><p>${e(action.type)}</p><p><strong>${action.count} new posts</strong> affecting ${state.targets.length} existing handles:</p><ul>${state.targets.map(t => `<li>@${e(t.handle)} — ${e(t.source)}</li>`).join('')}</ul><p>${id === 'reveal' ? 'Provenance will become visible and teams can correct the record.' : 'The release will be committed for every selected team at once.'}</p>`;
  dialog.returnValue = ''; dialog.showModal();
  dialog.onclose = () => { if (dialog.returnValue === 'confirm') work(() => commit(payload)); };
}
async function commit(payload) {
  sessionStorage.setItem(pendingKey(), JSON.stringify(payload));
  try {
    const result = await api('action', payload);
    sessionStorage.removeItem(pendingKey());
    status(`Released: ${result.count} posts · ${result.action} committed · current phase: ${result.phase}`);
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
