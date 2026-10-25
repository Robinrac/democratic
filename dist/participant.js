import { escape, avatar, handle, menu, profileHeader } from './social-ui.js';
import { PROFILE_THEMES } from './profile-themes.js';

const root = document.querySelector('#app');
const key = 'nyc-shared-feed-token';
let token = localStorage.getItem(key) || '';
let me = null;
let view = 'feed';
let selectedId = '';
let section = 'posts';
let profiles = [];
let posts = [];
let ownPosts = [];
let postCount = 0;
let draft = '';
let requestId = '';
let sending = false;
let polling = false;
let entered = false;
let joining = false;
const begunKey = key + '-begun';
let headerSignature = '';
let contentSignature = '';
const announce = text => { document.querySelector('#announcer').textContent = text; };

async function api(route, body) {
  const response = await fetch('/api/' + route, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(10000)
  });
  const result = await response.json();
  if (!response.ok) throw Object.assign(new Error(result.error || 'Please try again.'), { status: response.status });
  return result;
}
function route() {
  const hash = location.hash.slice(1);
  view = hash === 'discover' ? 'discover' : hash.startsWith('profile') ? 'profile' : 'feed';
  selectedId = hash.startsWith('profile/') ? hash.slice(8) : me?.id || '';
}
function selectedProfile() { return profiles.find(person => person.id === selectedId) || (selectedId === me?.id ? me : null); }
function shell() {
  if (!entered) { welcome(); return; }
  headerSignature = ''; contentSignature = '';
  root.innerHTML = `<header class="topbar"><a class="brand" href="#feed" aria-label="Workshop home"><span class="brand-mark">hacked<span>●</span></span></a><span class="conference">Nordic Youth Conference <span class="year">2026</span></span><a class="host-entry" href="/?presenter=1" aria-label="Host access"><span>Host access</span></a></header>
  <main id="main" class="layout social-layout"><aside class="sidebar"><div id="navigation">${menu(view, me)}</div><div class="session-note"><span class="dot"></span><span id="connection" role="status">Connecting…</span></div></aside>
  <section class="conversation"><div id="profile-header"></div><div class="feed-heading" ${view === 'profile' ? 'hidden' : ''}><div><span class="eyebrow">${view === 'discover' ? 'PEOPLE IN THE ROOM' : 'THE CONVERSATION'}</span><h1>${view === 'discover' ? 'Discover your community.' : 'Your workshop feed.'}</h1></div><span class="people" id="people">${profiles.length} joined</span></div>
  ${view === 'feed' ? '<div class="prompt"><span class="prompt-icon" aria-hidden="true">↗</span><div><span class="eyebrow">TODAY’S CONVERSATION</span><p>What would help you feel safe sharing your opinion online?</p><span>One small idea is enough. You can also follow your facilitator’s prompt.</span></div></div>' : ''}
  <div id="participation"></div><div id="content"></div><p class="end-note">Fictional identities. Everyone with this workshop link can read your profile and posts.</p></section></main>
  <dialog id="profile-dialog" aria-labelledby="edit-title"></dialog>`;
  composer(); paint();
}
function composer(message = '') {
  const container = document.querySelector('#participation');
  const canCompose = view === 'feed' || (view === 'profile' && selectedId === me?.id && section === 'posts');
  if (!me || !canCompose) { container.innerHTML = ''; return; }
  container.innerHTML = `<form class="composer" id="composer"><div class="composer-person">${avatar(me)}<a class="author-link" href="#profile"><strong>${escape(me.name)}</strong><span>@${escape(handle(me))}</span></a><span class="you-tag">YOU</span></div><label class="sr-only" for="post">Your post</label><textarea id="post" maxlength="500" rows="2" placeholder="What’s on your mind?" required ${sending ? 'disabled' : ''}>${escape(draft)}</textarea><div class="composer-bottom"><span id="counter">${draft.length} / 500</span><button class="primary" id="publish" ${sending || !draft.trim() ? 'disabled' : ''}>${sending ? 'Posting…' : 'Post to everyone ↑'}</button></div><p class="error" id="post-error" role="alert"></p></form>`;
  document.querySelector('#post').oninput = event => { draft = event.target.value; requestId = ''; document.querySelector('#counter').textContent = draft.length + ' / 500'; document.querySelector('#publish').disabled = !draft.trim(); };
  document.querySelector('#composer').onsubmit = publish;
}
function welcome() {
  document.querySelector('#welcome-dialog')?.close();
  root.innerHTML = `<main id="main" class="welcome-stage"><span class="brand-mark">hacked<span>●</span></span><div class="welcome-shape shape-blue" aria-hidden="true"></div><div class="welcome-shape shape-pink" aria-hidden="true"></div></main>
  <dialog id="welcome-dialog" aria-labelledby="welcome-title" aria-describedby="welcome-description">
    <div class="welcome-progress" aria-label="Step ${me ? '2' : '1'} of 2"><span class="complete"></span><span class="${me ? 'complete' : ''}"></span></div>
    ${me ? `<div class="identity-reveal"><div class="identity-cover cover-${me.cover || 0}"><span class="cover-orbit" aria-hidden="true"></span><span>YOUR VOICE.<br>YOUR SPACE.</span></div><div class="identity-portrait">${avatar(me)}</div><div class="welcome-copy"><span class="eyebrow">YOUR WORKSHOP IDENTITY</span><h1 id="welcome-title" tabindex="-1">You are ${escape(me.name)}.</h1><span class="identity-handle">@${escape(handle(me))}</span><p id="welcome-description">This is how others will see you. Your posts will appear under this fictional name.</p><p class="identity-bio">${escape(me.bio)}</p><button class="primary" id="begin">Begin <span aria-hidden="true">→</span></button><small>Your identity stays with you in this browser.</small></div></div>` : `<div class="welcome-intro-art" aria-hidden="true"><span>“</span><i>”</i></div><div class="welcome-copy"><span class="eyebrow">YOUR SEAT AT THE TABLE</span><h1 id="welcome-title">A new name.<br>Your own voice.</h1><p id="welcome-description">Step into the workshop with a fictional name and a profile of your own.</p><button class="primary" id="join">Reveal my identity <span aria-hidden="true">→</span></button><small>No real name, email or password needed.</small></div>`}
    <p id="join-error" class="error" role="alert"></p><a class="host-entry welcome-host" href="/?presenter=1" aria-label="Host access"><span>Host access</span></a>
  </dialog>`;
  const dialog = document.querySelector('#welcome-dialog');
  dialog.addEventListener('cancel', event => event.preventDefault());
  dialog.showModal();
  if (me) {
    document.querySelector('#begin').onclick = begin;
    document.querySelector('#welcome-title').focus();
  } else document.querySelector('#join').onclick = join;
}
function begin() {
  if (!me || entered) return;
  entered = true;
  try { localStorage.setItem(begunKey, me.id); } catch {}
  document.querySelector('#welcome-dialog')?.close();
  history.replaceState(null, '', '#feed');
  route(); shell(); refresh();
  const heading = document.querySelector('.feed-heading h1'); heading.tabIndex = -1; heading.focus();
  announce('Welcome, ' + me.name + '. Your workshop feed is ready.');
}
async function join() {
  if (joining) return;
  joining = true;
  const button = document.querySelector('#join'); button.disabled = true; button.textContent = 'Preparing your identity…';
  document.querySelector('#join-error').textContent = '';
  try {
    const data = await api('join', {}); me = data.participant; token = data.token;
    try { localStorage.setItem(key, token); } catch {}
    if (!profiles.some(person => person.id === me.id)) profiles.push(me);
    welcome();
  } catch (error) {
    document.querySelector('#join-error').textContent = error.status ? error.message : 'Could not connect. Please try again.';
    button.disabled = false; button.textContent = 'Reveal my identity →';
  } finally { joining = false; }
}
async function publish(event) {
  event.preventDefault();
  if (sending || !draft.trim()) return;
  sending = true; requestId ||= Date.now().toString(36) + '-' + Math.random().toString(36).slice(2); composer();
  try {
    await api('posts', { text: draft.trim(), requestId }); draft = ''; requestId = '';
    announce('Your post has been shared with the workshop.');
    await refresh();
  } catch (error) {
    if (error.status === 401) { token = ''; me = null; entered = false; localStorage.removeItem(key); localStorage.removeItem(begunKey); route(); shell(); }
    const target = document.querySelector('#post-error') || document.querySelector('#join-error');
    if (target) target.textContent = error.status ? error.message : 'Could not confirm your post. Your draft is kept here; try again.';
    sending = false;
    const input = document.querySelector('#post'); const button = document.querySelector('#publish');
    if (input) input.disabled = false;
    if (button) { button.disabled = false; button.textContent = 'Post to everyone ↑'; }
    return;
  }
  sending = false; composer(); document.querySelector('#post')?.focus();
}
function postCards(items) {
  if (!items.length) return `<div class="empty"><span class="empty-icon" aria-hidden="true">“</span><h3>${view === 'profile' ? 'A fresh page, ready for a voice.' : 'The conversation starts with you.'}</h3><p>${view === 'profile' ? 'Posts shared by this profile will appear here.' : 'Share the first thought with the workshop.'}</p></div>`;
  return items.map(post => `<article class="post"><header><a href="#profile/${post.author.id}" aria-label="View ${escape(post.author.name)}'s profile">${avatar(post.author)}</a><div><a class="author-link" href="#profile/${post.author.id}"><strong>${escape(post.author.name)}</strong></a><time datetime="${escape(post.createdAt)}">${new Date(post.createdAt).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })} · @${escape(handle(post.author))}</time></div>${post.author.id === me?.id ? '<span class="you-tag">YOU</span>' : ''}</header><p>${escape(post.text)}</p></article>`).join('');
}
function paint() {
  const profile = selectedProfile();
  const header = view === 'profile' && profile ? profileHeader(profile, profile.id === me?.id, postCount, profiles.length, section) : '';
  if (header !== headerSignature) {
    const focusedTab = document.activeElement?.dataset.profileTab;
    document.querySelector('#profile-header').innerHTML = header; headerSignature = header;
    document.querySelectorAll('[data-edit-profile]').forEach(button => { button.onclick = editProfile; });
    document.querySelectorAll('[data-profile-tab]').forEach(button => { button.onclick = () => { section = button.dataset.profileTab; composer(); paint(); }; });
    if (focusedTab) document.querySelector(`[data-profile-tab="${focusedTab}"]`)?.focus({ preventScroll: true });
  }
  let content;
  if (view === 'discover') content = profiles.length ? `<div class="directory">${profiles.map(person => `<a class="person-card" href="#profile/${person.id}"><div class="person-cover cover-${person.cover || 0}"></div>${avatar(person)}<h2>${escape(person.name)}</h2><span>@${escape(handle(person))}</span><p>${escape(person.bio)}</p><strong>View profile ↗</strong></a>`).join('')}</div>` : '<div class="empty"><h3>Your community is about to arrive.</h3><p>Profiles appear here when people join.</p></div>';
  else if (view === 'profile' && !profile) content = !me && !selectedId ? '' : '<div class="empty"><h3>Profile unavailable.</h3><p>This workshop may have restarted.</p><a href="#discover">Find current participants</a></div>';
  else if (view === 'profile' && section === 'about') content = `<section class="about-card"><span class="eyebrow">ABOUT THIS PROFILE</span><h2>A voice in the conversation.</h2><p>${escape(profile.bio || 'No bio yet.')}</p><dl><dt>Workshop identity</dt><dd>${escape(profile.name)}</dd><dt>Username</dt><dd>@${escape(handle(profile))}</dd><dt>Community</dt><dd>Nordic Youth Conference</dd></dl><p class="small-note">This is a fictional workshop identity. Keep real private details out of your bio and posts.</p></section>`;
  else content = `<div class="feed-label"><h3>${view === 'profile' ? (profile.id === me?.id ? 'Your posts' : 'Posts') : 'Latest posts'}</h3><span>Latest first</span></div>${postCards(view === 'profile' ? ownPosts : posts)}`;
  if (content !== contentSignature) { document.querySelector('#content').innerHTML = content; contentSignature = content; }
}
async function refresh() {
  if (!entered || polling) return;
  polling = true;
  try {
    const data = await api('feed'); profiles = data.profiles; posts = data.posts;
    if (me) me = profiles.find(person => person.id === me.id) || me;
    const requestedId = selectedId;
    if (view === 'profile' && requestedId) {
      try {
        const data = await api('profile?id=' + encodeURIComponent(requestedId));
        if (selectedId === requestedId) { ownPosts = data.posts; postCount = data.postCount; }
      } catch (error) { if (error.status !== 404) throw error; ownPosts = []; postCount = 0; }
    }
    if (!entered) return;
    document.querySelector('#people').textContent = profiles.length + ' joined';
    document.querySelector('#connection').textContent = 'Connected · live updates';
    paint();
  } catch { const connection = document.querySelector('#connection'); if (connection) connection.textContent = 'Reconnecting…'; }
  finally { polling = false; }
}
function editProfile() {
  const dialog = document.querySelector('#profile-dialog');
  dialog.innerHTML = `<form id="edit-profile-form"><div class="dialog-heading"><div><span class="eyebrow">YOUR WORKSHOP IDENTITY</span><h2 id="edit-title">Edit profile</h2></div><button type="button" class="dialog-close" aria-label="Close profile editor">×</button></div><p class="edit-name">${escape(me.name)} <span>Assigned name</span></p><label for="bio">Bio</label><textarea id="bio" maxlength="160" rows="3" placeholder="A little about your fictional profile…">${escape(me.bio)}</textarea><small>Visible to everyone in the workshop. Up to 160 characters.</small><fieldset><legend>Avatar style</legend>${PROFILE_THEMES.map(({name}, i) => `<label class="style-option"><input type="radio" name="color" value="${i}" ${me.color === i ? 'checked' : ''}>${avatar({color:i})}<span>${name}</span></label>`).join('')}</fieldset><fieldset><legend>Cover style</legend>${PROFILE_THEMES.map(({name}, i) => `<label class="style-option"><input type="radio" name="cover" value="${i}" ${(me.cover || 0) === i ? 'checked' : ''}><span class="cover-swatch cover-${i}"></span><span>${name}</span></label>`).join('')}</fieldset><p id="edit-error" class="error" role="alert"></p><div class="dialog-actions"><button type="button" class="edit-profile cancel-edit">Cancel</button><button class="primary">Save changes</button></div></form>`;
  dialog.querySelectorAll('.dialog-close,.cancel-edit').forEach(button => { button.onclick = () => dialog.close(); });
  dialog.querySelector('form').onsubmit = async event => {
    event.preventDefault(); const button = dialog.querySelector('.primary'); button.disabled = true;
    const values = new FormData(event.target);
    try {
      const result = await api('profile', { bio: dialog.querySelector('#bio').value, color: Number(values.get('color')), cover: Number(values.get('cover')) });
      me = result.participant; profiles = profiles.map(person => person.id === me.id ? me : person);
      document.querySelector('#navigation').innerHTML = menu(view, me);
      dialog.close(); composer(); await refresh(); announce('Your profile is updated.');
    } catch (error) { dialog.querySelector('#edit-error').textContent = error.status ? error.message : 'Could not save. Try again.'; button.disabled = false; }
  };
  dialog.showModal();
}
window.addEventListener('hashchange', () => { section = 'posts'; ownPosts = []; postCount = 0; route(); shell(); refresh(); });
document.querySelector('.skip').addEventListener('click', event => { event.preventDefault(); const main = document.querySelector('#main'); if (main) { main.tabIndex = -1; main.focus(); } });
async function start() {
  if (token) {
    try { me = (await api('me')).participant; }
    catch (error) { if (error.status === 401) { token = ''; localStorage.removeItem(key); } }
  }
  if (me) { profiles = [me]; entered = localStorage.getItem(begunKey) === me.id; }
  route(); shell(); await refresh(); setInterval(refresh, 2000);
}
start();
