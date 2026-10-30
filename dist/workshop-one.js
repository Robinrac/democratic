import { e, uid, request } from './open-circle.js';
import { header } from './workshop-one-ui.js';
import { setupVoting } from './workshop-one-voting.js';
import { setupNews } from './workshop-one-news.js';

// The server selects this organization’s edition. No composer or member directory.
export async function startWorkshopOne(initialRoom) {
  const root = document.querySelector('#app'), sid = initialRoom.id;
  document.body.classList.add('workshop-one-mode');
  const key = 'open-circle:' + sid;
  let token = localStorage.getItem(key) || uid();
  localStorage.setItem(key, token);
  let room = initialRoom, person = null, busy = false, joining = false, expired = false;
  const api = (route, body) => request(route, { sid, token, body });
  const organizationCard = association => `<img class="organization-banner" src="${e(association.banner)}" width="1920" height="1080" alt=""><div class="organization-details"><h2>${e(association.name)}</h2><p>${association.members} members</p></div>`;
  root.innerHTML = header() + `<main id="main" class="layout social-layout workshop-one"><aside class="sidebar"><section class="panel organization-card" id="team"></section><nav class="social-nav" aria-label="Workshop navigation" hidden></nav><div class="session-note"><span class="dot"></span><span id="connection" role="status">Connecting…</span></div></aside><section class="conversation"><div class="feed-heading"><div><span class="eyebrow">WORKSHOP 1</span><h1>News feed</h1></div></div><p class="news-tagline">Local stories. Different perspectives.</p><p id="room-status" role="status"></p><section id="news" class="workshop-news" aria-label="News feed"><p class="muted">Join your organization to read your news feed.</p></section></section></main>
  <dialog id="join-dialog" class="join-dialog organization-join" aria-labelledby="join-title"><form id="join-form"><h2 id="join-title">Join your organization</h2><label for="organization-name">Organization name</label><input id="organization-name" name="name" type="text" maxlength="60" required autocomplete="off" spellcheck="false" aria-describedby="join-preview-status"><p id="join-preview-status" class="field-hint" role="status" aria-live="polite"></p><section id="join-preview" class="organization-card" aria-label="Your organization" hidden></section><p id="join-error" class="error" role="alert"></p><div class="join-actions"><button type="submit">Join workshop</button></div></form></dialog>`;
  const dialog = document.querySelector('#join-dialog'), form = document.querySelector('#join-form');
  const voting = setupVoting({ root, api, key });
  const news = setupNews({ root, api });
  const connection = document.querySelector('#connection');
  dialog.addEventListener('cancel', event => event.preventDefault());
  dialog.addEventListener('close', () => { if (!person && !expired && room.phase !== 'ended') dialog.showModal(); });
  function render() {
    const team = document.querySelector('#team');
    if (person) {
      const association = person.association;
      const markup = organizationCard(association);
      if (team.innerHTML !== markup) team.innerHTML = markup;
      if (dialog.open) dialog.close();
    } else {
      team.innerHTML = '<div class="organization-details"><p>Join with your organization’s name.</p></div>';
      if (room.phase !== 'ended' && !dialog.open) dialog.showModal();
    }
    if (room.phase === 'ended' && dialog.open) dialog.close();
    document.querySelector('#room-status').textContent = room.phase === 'ended' ? 'This workshop room has closed.' : room.paused ? 'The facilitator has paused room controls.' : '';
    form.querySelector('button').disabled = joining || room.phase === 'ended';
    voting.update(person);
    news.update(person);
  }
  async function refresh() {
    if (busy || joining || expired) return;
    busy = true;
    try {
      room = await api('projector');
      try { person = await api('me'); }
      catch (error) {
        if (error.status !== 401) throw error;
        if (person) { token = uid(); localStorage.setItem(key, token); }
        person = null;
      }
      render(); connection.textContent = 'Live updates connected';
    } catch (error) {
      connection.textContent = error.message;
      if (error.status === 410) {
        expired = true; person = null; localStorage.removeItem(key);
        if (dialog.open) dialog.close();
        document.querySelector('#team').textContent = 'This session has been cleared or expired.';
        document.querySelector('#room-status').textContent = 'Ask the facilitator for the current room link.';
        voting.update(null);
        news.update(null);
      }
    } finally { busy = false; }
  }
  const nameInput = form.elements.name, preview = form.querySelector('#join-preview'), previewStatus = form.querySelector('#join-preview-status');
  let previewTimer, previewSequence = 0;
  nameInput.addEventListener('input', () => {
    const sequence = ++previewSequence, name = nameInput.value.trim();
    clearTimeout(previewTimer);
    preview.hidden = true; preview.innerHTML = ''; previewStatus.textContent = '';
    document.querySelector('#join-error').textContent = '';
    if (!name) return;
    previewTimer = setTimeout(async () => {
      try {
        const result = await api('join-preview', { name });
        if (sequence !== previewSequence) return;
        if (result.association) {
          preview.innerHTML = organizationCard(result.association); preview.hidden = false;
          previewStatus.textContent = 'Organization found';
        } else previewStatus.textContent = result.status === 'ambiguous' ? 'Keep typing your organization’s name.' : 'Enter the organization name from your paper profile.';
      } catch (error) {
        if (sequence === previewSequence) previewStatus.textContent = error.message;
      }
    }, 120);
  });
  form.onsubmit = async event => {
    event.preventDefault(); if (joining) return;
    joining = true; form.querySelector('button').disabled = true;
    document.querySelector('#join-error').textContent = '';
    try {
      person = await api('join', { name: new FormData(form).get('name') });
      render(); document.querySelector('#announcer').textContent = 'Your association has joined.';
    } catch (error) { document.querySelector('#join-error').textContent = error.message; }
    finally { joining = false; form.querySelector('button').disabled = room.phase === 'ended'; await refresh(); }
  };
  await refresh();
  window.addEventListener('online', refresh);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  setInterval(refresh, 2000);
}
