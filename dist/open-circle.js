import { PROFILE_THEMES } from './profile-themes.js';
import { createActivity, postText } from './forum-activity.js';

export const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const uid = () => [...crypto.getRandomValues(new Uint8Array(32))].map(v => v.toString(16).padStart(2, '0')).join('');
export async function request(route, { sid, token, body } = {}) {
  const url = new URL('/api/' + route, location.origin); if (sid) url.searchParams.set('s', sid);
  let response;
  try { response = await fetch(url, { method: body === undefined ? 'GET' : 'POST', headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(10000) }); }
  catch { throw new Error('Connection lost. Keep this page open and retry. Your last confirmed state is still shown.'); }
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.error || 'Please try again.'), { status: response.status });
  return data;
}
export const phaseCopy = {
  opening: ['Welcome to Open Circle', 'Make yourself at home. The conversation opens soon.'],
  debate: ['One forum. Two possible rules.', 'Share your perspective, explain your thinking and hear what others have to say.'],
  exposure: ['Read the latest posts', 'Look at the thread under your username. Discuss what has changed with your team.'],
  forgery: ['Whose voice is this?', 'Compare the recent posts with what your team chose to say. You can mark a post you did not write.'],
  reactions: ['Consider the consequences', 'How might other readers understand the conversation now?'],
  reflection: ['Talk with your team', 'What happened to your ability to speak for yourself? What would help you participate confidently?'],
  recovery: ['Check the record', 'Compare the labelled posts. Publish a correction and choose what should happen next.'],
  discussion: ['Bring it back to the room', 'What responsibilities belong to the person, the platform and the organizer?'],
  closing: ['Take one idea with you', 'What helps you feel confident sharing your thoughts?'],
  ended: ['This conversation has closed', 'Thanks for sharing your ideas and listening to one another.']
};
const img = person => person.avatar ? `<img class="portrait" src="${e(person.avatar)}" alt="Profile picture for ${e(person.username)}">` : '';
const identity = (person, linked = false) => `<div class="identity">${img(person)}<strong>${linked ? `<button class="profile-link" data-profile="${e(person.id)}">@${e(person.username)}</button>` : `@${e(person.username)}`}</strong></div>`;
const bannerShapes = {
  circles: '<g fill="none" stroke="currentColor"><circle cx="188" cy="24" r="72" stroke-width="22"/><circle cx="83" cy="129" r="53" stroke-width="14"/></g>',
  triangles: '<path d="M164 -28 258 119 70 119Z"/><path d="m242 45 62 101H180Z" opacity=".6"/><path d="m36 10 24 40H12Z"/>',
  octagons: '<path d="M145 -24h67l47 47v67l-47 47h-67L98 90V23Z"/><path d="M36 52h32l23 23v32l-23 23H36l-23-23V75Z" fill="none" stroke="currentColor" stroke-width="10"/>',
  waves: '<g fill="none" stroke="currentColor" stroke-width="14"><path d="M10 5c50-50 65 60 115 10s65 60 115 10 65 60 115 10"/><path d="M-5 42c50-50 65 60 115 10s65 60 115 10 65 60 115 10"/><path d="M-20 79c50-50 65 60 115 10s65 60 115 10 65 60 115 10"/><path d="M-35 116c50-50 65 60 115 10s65 60 115 10 65 60 115 10"/></g>',
  squares: '<rect x="124" y="-8" width="116" height="116"/><rect x="50" y="66" width="56" height="56" fill="none" stroke="currentColor" stroke-width="10"/><rect x="242" y="112" width="34" height="34" opacity=".6"/>',
  diamonds: '<path d="m178-28 88 88-88 88-88-88Z" fill="none" stroke="currentColor" stroke-width="20"/><path d="m54 59 33 33-33 33-33-33Z"/><path d="m269-15 32 32-32 32-32-32Z"/>',
  starbursts: '<path d="m181-15 15 31 34-13-3 37 35 9-25 27 20 29-36 4-3 36-29-20-27 25-9-35-37 3 13-34-31-15 31-15-13-34 37 3 9-35Z"/><path d="m48 65 8 20 22-4-13 18 13 18-22-4-8 20-8-20-22 4 13-18-13-18 22 4Z" opacity=".65"/>'
};
function bannerArtwork(cover) {
  const theme = PROFILE_THEMES[cover] || PROFILE_THEMES[0];
  return `<svg class="banner-shapes" data-shape="${e(theme.shape)}" viewBox="0 0 280 140" aria-hidden="true" focusable="false">${bannerShapes[theme.shape]}</svg><span class="banner-caption">${theme.banner.map(e).join('<br>')}</span>`;
}
function appearanceChoices(field, selected) {
  const picture = field === 'color';
  return `<fieldset class="appearance-group"><legend>${picture ? 'Profile picture' : 'Banner'}</legend><div class="appearance-options ${picture ? '' : 'banner-options'}">${PROFILE_THEMES.map((theme, index) => `<label class="appearance-option"><input type="radio" name="${field}" value="${index}" ${index === selected ? 'checked' : ''}><span class="${picture ? 'picture-swatch' : `cover-swatch banner-art cover-${index}`}" aria-hidden="true">${picture ? `<img src="/avatars/${index}.svg" alt="">` : bannerArtwork(index)}</span><span>${e(theme.name)}</span></label>`).join('')}</div></fieldset>`;
}
function profileFields(prefix, values = {}) {
  return `<div class="setup-tabs" role="tablist" aria-label="Profile setup"><button type="button" role="tab" id="${prefix}-personal-tab" aria-controls="${prefix}-personal" aria-selected="true">Personal info</button><button type="button" role="tab" id="${prefix}-appearance-tab" aria-controls="${prefix}-appearance" aria-selected="false" tabindex="-1">Profile</button></div><section id="${prefix}-personal" role="tabpanel" aria-labelledby="${prefix}-personal-tab"><label for="${prefix}-bio">Bio</label><p class="field-hint" id="${prefix}-bio-hint">Public · Based on your paper profile.</p><textarea id="${prefix}-bio" name="bio" maxlength="160" rows="2" aria-describedby="${prefix}-bio-hint" placeholder="What matters to this person?">${e(values.bio || '')}</textarea><fieldset class="private-fields"><legend>Private details</legend><div class="details-grid"><div><label for="${prefix}-name">Name</label><input id="${prefix}-name" name="name" maxlength="60" value="${e(values.name || '')}" required autocomplete="off" placeholder="First name or surname from your paper"><small class="field-hint">Accents are optional.</small></div><div><label for="${prefix}-town">Home town</label><input id="${prefix}-town" name="town" maxlength="80" value="${e(values.town || '')}" required autocomplete="off" placeholder="Home town from your paper"></div></div></fieldset></section><section id="${prefix}-appearance" role="tabpanel" aria-labelledby="${prefix}-appearance-tab" hidden>${appearanceChoices('color', values.color ?? 0)}${appearanceChoices('cover', values.cover ?? 0)}</section>`;
}
function setupProfileTabs(form) {
  const tabs = [...form.querySelectorAll('[role="tab"]')];
  function activate(tab, focus = false) {
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected)); item.tabIndex = selected ? 0 : -1;
      form.querySelector('#' + item.getAttribute('aria-controls')).hidden = !selected;
    });
    if (focus) tab.focus();
  }
  tabs.forEach((tab, index) => {
    tab.onclick = () => activate(tab);
    tab.onkeydown = event => {
      const next = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 }[event.key];
      if (next !== undefined) { event.preventDefault(); activate(tabs[next], true); }
    };
  });
  form.addEventListener('invalid', event => {
    const panel = event.target.closest('[role="tabpanel"]');
    if (panel?.hidden) activate(tabs.find(tab => tab.getAttribute('aria-controls') === panel.id));
  }, true);
}
const header = (hostEntry = true) => `<header class="topbar"><a class="brand forum-brand" href="${e(location.pathname + location.search)}" aria-label="Open Circle home"><img class="forum-mark" src="/brand/open-circle-mark.png" width="40" height="40" alt=""><span class="forum-wordmark">open circle<span class="brand-dot">.</span></span></a><span class="community-tagline">Different voices. Shared space.</span>${hostEntry ? '<a class="host-entry" href="/host" aria-label="Host access"><span>Host access</span></a>' : '<span class="header-spacer" aria-hidden="true"></span>'}</header>`;
function phaseHTML(data) { const copy = data.scenario === 'transport-v1' && data.phase === 'debate' ? ['Different journeys. Different priorities.', 'Discuss your own proposal: lower fares, free travel, a fare cap or improving services first.'] : phaseCopy[data.phase] || phaseCopy.opening; return `<strong>${e(copy[0])}</strong><p>${e(copy[1])}</p>${data.paused ? '<small>Updates are paused. You can still read the conversation.</small>' : ''}`; }

export async function startProjector() {
  const sid = new URLSearchParams(location.search).get('s');
  const link = location.origin + '/?s=' + encodeURIComponent(sid || '');
  document.querySelector('#app').innerHTML = header(false) + `<main id="main" class="projector"><section><span class="eyebrow">WELCOME TO OPEN CIRCLE</span><h1>Your voice.<br>Your choice.<br>Our conversation.</h1><span class="eyebrow">TODAY’S TOPIC</span><p id="question"></p><div class="phase" id="phase"></div><p id="progress" role="status"></p></section><section class="panel"><div id="qr"></div><h2>Join the circle.</h2><p id="display-url"></p><p>Use the details on your paper profile to join.</p><p id="connection" role="status"></p></section></main>`;
  if (!sid) { document.querySelector('#connection').textContent = 'Open the projector link from your host screen.'; return; }
  const qr = window.qrcode(0, 'M'); qr.addData(link); qr.make();
  document.querySelector('#qr').innerHTML = qr.createSvgTag({ cellSize: 6, margin: 24, scalable: true });
  document.querySelector('#qr svg').setAttribute('aria-label', 'Scan to open Open Circle');
  document.querySelector('#qr svg').setAttribute('role', 'img');
  document.querySelector('#display-url').textContent = link;
  let busy = false;
  const refresh = async () => {
    if (busy) return; busy = true;
    try {
      const data = await request('projector', { sid });
      document.querySelector('#question').textContent = data.question;
      document.querySelector('#phase').innerHTML = phaseHTML(data);
      document.querySelector('#progress').textContent = `${data.participants} / ${data.capacity} profiles joined · ${data.genuinePosts} contributions`;
      document.querySelector('#connection').textContent = ['localhost', '127.0.0.1'].includes(location.hostname) ? 'For phones, open the host screen using the computer’s network address before opening this projector link.' : 'Live updates connected';
    } catch (error) { document.querySelector('#connection').textContent = error.message; if (error.status === 410) { document.querySelector('#qr').replaceChildren(); document.querySelector('#progress').textContent = ''; } }
    finally { busy = false; }
  };
  await refresh(); setInterval(refresh, 2000);
}

export async function startParticipant() {
  const root = document.querySelector('#app'), sid = new URLSearchParams(location.search).get('s');
  if (!sid) { root.innerHTML = header() + '<main id="main" class="welcome"><span class="eyebrow">A PLACE FOR EVERY VOICE</span><img class="welcome-mark" src="/brand/open-circle-mark.png" alt=""><h1>Good conversations<br>start here.</h1><p>A space to share ideas, listen and see things differently.</p><p>Open your community link or scan the QR to join Open Circle.</p></main>'; return; }
  const key = 'open-circle:' + sid;
  const fragment = new URLSearchParams(location.hash.slice(1));
  let token = localStorage.getItem(key) || uid();
  if (fragment.has('viewer') && /^[a-f0-9]{64}$/.test(fragment.get('viewer'))) { token = fragment.get('viewer'); history.replaceState(null, '', location.pathname + location.search); }
  localStorage.setItem(key, token);
  const saved = suffix => { try { return JSON.parse(localStorage.getItem(key + suffix)); } catch { return null; } };
  let draft = saved(':composer') || { text: localStorage.getItem(key + ':draft') || '', stance: null, replyTo: null, correction: false };
  let pendingPost = saved(':pending-post');
  let person = null, data = null, busy = false, sending = false, feedSignature = '', memberId = null, membershipChecked = false, activeHashtag = null, currentView = location.hash === '#discover' ? 'discover' : 'feed';
  function saveDraft() { localStorage.setItem(key + ':composer', JSON.stringify(draft)); }
  function forgetTeam() {
    if (person) {
      joinForm.reset(); updateJoinPreview();
      clearTimeout(previewTimer); previewVersion++;
      document.querySelector('#preview-name').textContent = '@your-username';
      document.querySelector('#preview-hint').hidden = false;
      document.querySelector('#preview-hint').textContent = 'The host cleared your profile. Use your paper card to join again.';
      document.querySelector('#join-error').textContent = '';
      document.querySelector('#join-name').removeAttribute('aria-invalid');
      joinForm.querySelector('[role=tab]')?.click();
    }
    document.querySelector('#profile-dialog')?.close();
    if (memberDialog.open) memberDialog.close();
    activity.clear(); activeHashtag = null;
    person = null; token = uid(); localStorage.setItem(key, token);
    [':draft', ':post-id', ':composer', ':pending-post'].forEach(suffix => localStorage.removeItem(key + suffix));
    draft = { text: '', stance: null, replyTo: null, correction: false }; pendingPost = null;
  }
  const api = (route, body) => request(route, { sid, token, body });
  root.innerHTML = header() + `<main id="main" class="layout social-layout">
    <aside class="sidebar">
      <section class="panel join-card" id="team"></section>
      <nav class="social-nav" aria-label="Forum navigation">
        <a href="#feed" data-view="feed" aria-current="page"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg><span>Feed</span></a>
        <a href="#discover" data-view="discover"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/></svg><span>Discover</span></a>
      </nav>
      <section class="sidebar-trends" id="trending" aria-label="Top five hashtags"></section>
      <section class="sidebar-about"><span class="eyebrow">ABOUT OPEN CIRCLE</span><h2>Different voices.<br>Shared space.</h2><p>Share an idea. Hear another view.</p></section>
      <div class="session-note"><span class="dot"></span><span id="connection" role="status">Connecting…</span></div>
    </aside>
    <section class="conversation" id="feed-view" aria-labelledby="feed-title">
      <div class="feed-heading"><h1 id="feed-title">Feed</h1><span id="counts" class="people"></span></div>
      <div class="panel prompt"><span class="eyebrow">TODAY’S TOPIC</span><h2 id="question">Bus fares for young people</h2></div>
      <div class="phase" id="phase" aria-live="polite"></div><p id="error" role="alert"></p>
      <section id="notice"></section><section id="incident-banner" aria-live="polite"></section>
      <section id="composer"></section><section id="social-tools"><div id="activity-history"></div></section>
      <div id="tag-filter"></div><div id="threads"></div>
    </section>
    <section class="conversation" id="discover-view" aria-labelledby="discover-title" hidden>
      <div class="feed-heading"><h1 id="discover-title">Discover</h1></div><div id="profiles" class="member-grid"></div>
    </section>
  </main>`;
  const activity = createActivity(root, key);
  root.insertAdjacentHTML('beforeend', `<dialog id="join-dialog" class="join-dialog" aria-labelledby="join-title"><form id="join-form"><h2 id="join-title">Create your profile.</h2><div class="profile-preview"><div class="profile-preview-banner banner-art cover-0">${bannerArtwork(0)}</div><div class="profile-preview-content"><img id="preview-picture" src="/avatars/0.svg" alt="Selected profile picture"><span class="eyebrow">YOUR PUBLIC PROFILE</span><strong id="preview-name" aria-live="polite">@your-username</strong><p id="preview-bio">Your bio</p><small id="preview-hint">Username assigned from your paper profile.</small></div></div>${profileFields('join')}<p id="join-error" class="error" role="alert"></p><div class="join-actions"><button class="primary" type="submit">Join the forum</button></div></form></dialog>`);
  root.insertAdjacentHTML('beforeend', '<dialog id="incident-dialog" class="join-dialog incident-dialog" aria-labelledby="incident-title"><div id="incident-content"></div><button id="close-incident" class="primary">Back to the feed</button></dialog>');
  const incidentDialog = document.querySelector('#incident-dialog');
  document.querySelector('#close-incident').onclick = () => incidentDialog.close();
  function renderIncident() {
    const notice = person?.incident, banner = document.querySelector('#incident-banner');
    if (person?.canWrite === false) document.querySelector('#profile-dialog')?.close();
    if (!notice) { banner.replaceChildren(); if (incidentDialog.open) incidentDialog.close(); return; }
    const openNotice = () => {
      const animation = notice.animation ? '<div class="support-scene" role="img" aria-label="Small automated helpers move between anonymous profile cards"><span class="support-profile">@•••</span><span class="support-profile">@•••</span><span class="support-profile">@•••</span><span class="support-bot">🤖</span><span class="support-bot">🤖</span><span class="support-bot">🤖</span><span class="support-bot">🤖</span></div>' : '';
      document.querySelector('#incident-content').innerHTML = `<span class="eyebrow">PRIVATE ACCOUNT UPDATE</span><h2 id="incident-title">${e(notice.title)}</h2>${animation}<p>${e(notice.message)}</p>`;
      if (!incidentDialog.open) incidentDialog.showModal();
      sessionStorage.setItem(key + ':incident-seen', notice.id);
    };
    if (banner.dataset.notice !== notice.id) {
      banner.dataset.notice = notice.id;
      banner.innerHTML = `<div class="panel incident-notice"><h2>${e(notice.title)}</h2><p>${e(notice.message)}</p><button id="show-incident" class="secondary">View account update</button></div>`;
      document.querySelector('#show-incident').onclick = openNotice;
    }
    if (sessionStorage.getItem(key + ':incident-seen') !== notice.id && !document.querySelector('dialog[open]')) openNotice();
  }
  const joinDialog = document.querySelector('#join-dialog');
  const joinForm = document.querySelector('#join-form');
  setupProfileTabs(joinForm);
  localStorage.removeItem(key + ':observer');
  function updateJoinPreview() {
    const form = new FormData(joinForm), color = Number(form.get('color')), cover = Number(form.get('cover'));
    document.querySelector('#preview-picture').src = `/avatars/${color}.svg`;
    joinForm.querySelector('.profile-preview-banner').className = `profile-preview-banner banner-art cover-${cover}`;
    joinForm.querySelector('.profile-preview-banner').innerHTML = bannerArtwork(cover);
    document.querySelector('#preview-bio').textContent = form.get('bio')?.trim() || 'Your bio';
  }
  let previewTimer, previewVersion = 0;
  document.querySelector('#join-name').addEventListener('input', () => {
    clearTimeout(previewTimer); const version = ++previewVersion;
    const name = document.querySelector('#join-name').value.trim();
    const username = document.querySelector('#preview-name'), hint = document.querySelector('#preview-hint');
    document.querySelector('#join-error').textContent = '';
    document.querySelector('#join-name').removeAttribute('aria-invalid');
    if (!name) { username.textContent = '@your-username'; hint.textContent = 'Username assigned from your paper profile.'; hint.hidden = false; return; }
    previewTimer = setTimeout(async () => {
      try {
        const result = await api('join-preview', { name });
        if (version !== previewVersion) return;
        username.textContent = result.username ? '@' + result.username : '@your-username';
        hint.hidden = false;
        hint.textContent = result.username ? (result.claimed ? 'This profile has already joined. Use its original device or ask the host to release it.' : 'Paper profile recognised. Your public username is assigned.') : 'Use a complete first name, surname or full paper name. Accents are optional.';
        document.querySelector('#join-error').textContent = result.error || (result.claimed ? 'This paper profile is already in use. Ask the host for help.' : '');
        document.querySelector('#join-name').setAttribute('aria-invalid', result.username ? 'false' : 'true');
      } catch { if (version === previewVersion) { username.textContent = '@your-username'; hint.hidden = false; hint.textContent = 'Could not check the name. Please try again.'; } }
    }, 100);
  });
  joinForm.addEventListener('input', updateJoinPreview);
  joinForm.addEventListener('change', updateJoinPreview);
  function showJoinDialog() { if (!joinDialog.open) joinDialog.showModal(); }
  joinDialog.addEventListener('cancel', event => event.preventDefault());
  joinDialog.addEventListener('close', () => { if (!person && data) showJoinDialog(); });
  joinForm.onsubmit = async event => {
    event.preventDefault();
    const button = event.submitter, fields = new FormData(joinForm);
    button.disabled = true; document.querySelector('#join-error').textContent = '';
    try {
      person = await api('join', { name: fields.get('name'), town: fields.get('town'), bio: fields.get('bio'), color: Number(fields.get('color')), cover: Number(fields.get('cover')) });
      membershipChecked = true; joinDialog.close(); renderTeam(); renderComposer(); await refresh();
      document.querySelector('#announcer').textContent = 'Your profile is ready.';
    } catch (err) { document.querySelector('#join-error').textContent = err.message; if (!err.status || err.status >= 500) membershipChecked = false; }
    finally { button.disabled = false; }
  };
  function setView(view, scroll = false) {
    currentView = view === 'discover' ? 'discover' : 'feed';
    document.querySelector('#feed-view').hidden = currentView !== 'feed';
    document.querySelector('#discover-view').hidden = currentView !== 'discover';
    document.querySelectorAll('[data-view]').forEach(link => { if (link.dataset.view === currentView) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current'); });
    history.replaceState(null, '', location.pathname + location.search + '#' + currentView);
    if (scroll) { if (matchMedia('(min-width: 761px)').matches) window.scrollTo({ top: 0 }); else document.querySelector('#' + currentView + '-view').scrollIntoView({ block: 'start' }); }
    renderMentionSuggestions();
  }
  document.querySelectorAll('[data-view]').forEach(link => link.onclick = event => { event.preventDefault(); setView(link.dataset.view, true); });
  setView(currentView);
  const error = message => { const target = document.querySelector('#profile-dialog[open] #profile-error') || document.querySelector('#error'); target.textContent = message; };
  async function act(button, fn) {
    button.disabled = true; error('');
    try { await fn(); await refresh(); } catch (err) { error(err.message); }
    finally { button.disabled = data?.phase === 'ended' || person?.canWrite === false; }
  }
  function renderTeam() {
    const target = document.querySelector('#team');
    if (!person) {
      target.className = 'panel join-card';
      target.innerHTML = `<span class="eyebrow">YOUR PROFILE</span><h2>Step into the circle.</h2><p>Use your paper profile to join with an anonymous username, bio, banner and picture.</p><button id="open-join" class="primary">Create profile</button>`;
      document.querySelector('#open-join').onclick = showJoinDialog;
      return;
    }
    const p = person.participant, card = person.privateRole, details = person.privateDetails;
    target.className = 'sidebar-members';
    target.innerHTML = `${person.scope === 'viewer' ? '<span class="eyebrow">TEAM VIEWER · READ ONLY</span>' : ''}<ul class="sidebar-names"><li><button class="profile-link" data-profile="${e(p.id)}" aria-label="Open your profile">@${e(p.username)} <small>you</small></button></li></ul><ul id="sidebar-other-members" class="sidebar-names" aria-label="Other members"></ul>${card ? `<button id="edit-profile" class="secondary edit-profile-button">Edit profile</button><dialog id="profile-dialog" class="join-dialog" aria-labelledby="edit-title"><h2 id="edit-title">Your profile.</h2><form id="profile-form"><div class="profile-preview"><div class="profile-preview-banner banner-art cover-${p.cover}">${bannerArtwork(p.cover)}</div><div class="profile-preview-content"><img class="edit-preview-picture" src="${e(p.avatar)}" alt="Selected profile picture"><span class="eyebrow">YOUR PUBLIC PROFILE</span><strong>@${e(p.username)}</strong><p class="edit-preview-bio">${e(p.bio || 'Your bio')}</p></div></div><p id="profile-error" class="error" role="alert"></p>${profileFields('edit', { ...p, ...details })}<div class="join-actions"><button class="primary">Save profile</button><button type="button" id="close-profile" class="secondary">Cancel</button></div></form><details class="role-card"><summary>Your profile notes</summary><p>A little background for your conversations.</p><img class="portrait role-portrait" src="${e(card.portrait)}" alt="Portrait of ${e(card.fullName)}"><h3>${e(card.fullName)}</h3><p>${e(card.ageGender)}</p><p>${e(card.backstory)}</p><p><strong>Starting view:</strong> ${e(card.proposal || (card.leaning === 'usernames' ? 'Public usernames' : 'Public real names'))}</p><p>${e(card.reason)}</p><p><strong>Also consider:</strong> ${e(card.worry)}</p><p><strong>${card.proposal ? 'Your priority' : 'What might persuade you'}:</strong> ${e(card.persuade)}</p><details><summary>Optional words to get started</summary><p><strong>Bio:</strong> ${e(card.suggestedBio)}</p><p><strong>First post:</strong> ${e(card.suggestedPost)}</p><p>${e(card.question)}</p></details></details><details><summary>Add a read-only team device</summary><p>This link shows your team’s feed, without posting access or the private card.</p><button id="viewer-link" class="secondary">Make viewer link</button><p id="viewer-url"></p></details></dialog>` : '<span class="muted">Read-only</span>'}`;
    if (card) {
      const editDialog = document.querySelector('#profile-dialog');
      setupProfileTabs(document.querySelector('#profile-form'));
      document.querySelector('#edit-profile').onclick = () => editDialog.showModal();
      document.querySelector('#close-profile').onclick = () => editDialog.close();
      document.querySelector('#profile-form').oninput = ev => {
        const fields = new FormData(ev.currentTarget);
        editDialog.querySelector('.profile-preview-banner').className = 'profile-preview-banner banner-art cover-' + fields.get('cover');
        editDialog.querySelector('.profile-preview-banner').innerHTML = bannerArtwork(Number(fields.get('cover')));
        editDialog.querySelector('.edit-preview-picture').src = '/avatars/' + fields.get('color') + '.svg';
        editDialog.querySelector('.edit-preview-bio').textContent = fields.get('bio').trim() || 'Your bio';
      };
      document.querySelector('#profile-form').onsubmit = ev => { ev.preventDefault(); act(ev.submitter, async () => { const fields = new FormData(ev.currentTarget); person = await api('profile', { name: fields.get('name'), town: fields.get('town'), bio: fields.get('bio'), color: Number(fields.get('color')), cover: Number(fields.get('cover')) }); editDialog.close(); renderTeam(); renderComposer(); }); };
      document.querySelector('#viewer-link').onclick = ev => act(ev.currentTarget, async () => { const secret = uid(); await api('viewer', { token: secret }); const url = location.origin + '/?s=' + encodeURIComponent(sid) + '#viewer=' + secret; document.querySelector('#viewer-url').innerHTML = `<a href="${e(url)}">${e(url)}</a>`; });
    }
  }
  function renderComposer() {
    const composer = document.querySelector('#composer');
    if (person?.scope !== 'poster') { composer.innerHTML = ''; return; }
    composer.innerHTML = `<section class="panel composer"><div class="composer-person">${identity(person.participant)}<span class="you-tag">YOU</span></div><form id="post-form"><p id="reply-label" class="reply-label"></p><button type="button" id="cancel-reply" class="secondary" hidden>Cancel reply</button><label class="sr-only" for="post-text">Your reason or reply</label><div class="mention-editor"><textarea id="post-text" maxlength="500" required aria-describedby="social-help" aria-autocomplete="list" aria-controls="mention-suggestions" aria-expanded="false" placeholder="Share a thought or ask a question…"></textarea><div id="mention-suggestions" class="mention-menu" role="listbox" aria-label="Members to tag" hidden></div></div><p id="social-help" class="muted">@ mention someone · # add a topic</p><label id="correction-label" hidden><input type="checkbox" id="correction">Publish this as a correction</label><div class="composer-bottom"><span id="counter">0 / 500</span><button class="primary" id="send-post">Publish post <span aria-hidden="true">↑</span></button></div><p id="post-help" class="muted" role="status"></p></form></section>`;
    document.querySelector('#post-text').value = draft.text;
    document.querySelector('#correction').checked = !!draft.correction;
    const form = document.querySelector('#post-form');
    form.oninput = () => {
      draft.text = document.querySelector('#post-text').value;
      draft.correction = document.querySelector('#correction').checked;
      saveDraft(); updateComposer(); renderMentionSuggestions();
    };
    document.querySelector('#cancel-reply').onclick = () => selectReply(null);
    form.onsubmit = event => { event.preventDefault(); sendPost(); };
    const area = document.querySelector('#post-text');
    area.onkeydown = event => {
      const menu = document.querySelector('#mention-suggestions');
      if (menu.hidden) return;
      const options = [...menu.querySelectorAll('[data-insert-mention]')];
      if (event.key === 'Escape') { event.preventDefault(); dismissedMention = mentionKey; menu.hidden = true; area.setAttribute('aria-expanded', 'false'); area.removeAttribute('aria-activedescendant'); }
      if (['ArrowDown', 'ArrowUp'].includes(event.key) && options.length) { event.preventDefault(); mentionIndex = mentionIndex < 0 ? (event.key === 'ArrowDown' ? 0 : options.length - 1) : (mentionIndex + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length; renderMentionSuggestions(); options[mentionIndex]?.scrollIntoView({ block: 'nearest' }); }
      if (event.key === 'Enter' && mentionIndex >= 0 && options[mentionIndex]) { event.preventDefault(); insertToken('@' + options[mentionIndex].dataset.insertMention); }
    };
    area.addEventListener('input', () => { dismissedMention = ''; renderMentionSuggestions(); });
    area.addEventListener('click', renderMentionSuggestions);
    area.addEventListener('focus', renderMentionSuggestions);
    area.addEventListener('blur', () => { document.querySelector('#mention-suggestions').hidden = true; area.setAttribute('aria-expanded', 'false'); area.removeAttribute('aria-activedescendant'); });
    document.querySelector('#mention-suggestions').onpointerdown = event => event.preventDefault();
    updateComposer();
  }
  function insertToken(value) {
    const area = document.querySelector('#post-text');
    if (!area || area.disabled || pendingPost || sending || person?.canWrite === false) return;
    const start = area.selectionStart, end = area.selectionEnd;
    const partial = value.startsWith('@') && area.value.slice(0, start).match(/(?:^|\s)(@[a-z0-9-]*)$/i);
    const from = partial ? start - partial[1].length : start;
    const prefix = from && !/\s/.test(area.value[from - 1]) ? ' ' : '';
    const insertion = prefix + value + ' ';
    if (area.value.length - (end - from) + insertion.length > 500) { error('There is not enough room for this tag. Posts can contain up to 500 characters.'); return; }
    area.setRangeText(insertion, from, end, 'end');
    area.dispatchEvent(new Event('input', { bubbles: true })); area.focus();
  }
  let mentionIndex = -1, mentionKey = '', dismissedMention = '';
  function renderMentionSuggestions() {
    const area = document.querySelector('#post-text'), target = document.querySelector('#mention-suggestions'); if (!area || !target) return;
    const before = area.value.slice(0, area.selectionStart), match = before.match(/(?:^|\s)@([a-z0-9-]*)$/i);
    const key = match ? before : '';
    if (key !== mentionKey) { mentionIndex = -1; mentionKey = key; }
    const show = !!match && !area.disabled && currentView === 'feed' && document.activeElement === area && key !== dismissedMention;
    target.hidden = !show; area.setAttribute('aria-expanded', String(show));
    if (!show) { area.removeAttribute('aria-activedescendant'); return; }
    const members = (data?.profiles || []).filter(p => p.username.startsWith(match[1].toLowerCase()));
    if (mentionIndex >= members.length) mentionIndex = -1;
    const html = members.map((p, index) => `<button type="button" role="option" tabindex="-1" id="mention-option-${index}" aria-selected="${index === mentionIndex}" data-insert-mention="${e(p.username)}"><img src="${e(p.avatar)}" alt=""><span>@${e(p.username)}</span></button>`).join('') || '<p>No matching members</p>';
    if (target.innerHTML !== html) target.innerHTML = html;
    if (mentionIndex >= 0) area.setAttribute('aria-activedescendant', 'mention-option-' + mentionIndex); else area.removeAttribute('aria-activedescendant');
  }
  function updateComposer() {
    if (person?.scope !== 'poster') return;
    const closed = !data || person.canWrite === false || ['opening', 'closing', 'ended'].includes(data.phase);
    const locked = sending || !!pendingPost;
    const reply = data?.posts?.find(post => post.id === draft.replyTo);
    const missingReply = !!draft.replyTo && !!data?.posts && !reply;
    document.querySelector('#counter').textContent = draft.text.length + ' / 500';
    document.querySelector('#reply-label').textContent = draft.replyTo ? (reply ? `Replying to @${reply.author.username}: ${reply.text.slice(0, 100)}` : 'The original post is unavailable. Cancel this reply to start a new post.') : '';
    document.querySelector('#cancel-reply').hidden = !draft.replyTo;
    document.querySelector('#cancel-reply').disabled = locked;
    document.querySelector('#post-text').disabled = locked || person.canWrite === false;
    document.querySelector('#correction').disabled = locked || closed;
    document.querySelector('#correction-label').hidden = !data?.notice;
    const button = document.querySelector('#send-post');
    button.textContent = sending ? 'Publishing…' : pendingPost ? 'Retry publish' : 'Publish post ↑';
    button.disabled = person.canWrite === false || sending || (!pendingPost && (closed || missingReply));
    document.querySelector('#post-help').textContent = person.canWrite === false ? 'Account locked. You can watch the feed. Your draft is saved for recovery.' : pendingPost ? 'Waiting for confirmation. Your contribution is saved here; retrying will not publish it twice.' : data?.phase === 'opening' ? 'Posting opens soon. Your draft stays here.' : closed ? 'The discussion is closed. Your draft stays here.' : 'Draft saved';
    renderMentionSuggestions();
  }
  function published(post) {
    activity.published(post);
    pendingPost = null; localStorage.removeItem(key + ':pending-post');
    localStorage.removeItem(key + ':draft'); localStorage.removeItem(key + ':post-id');
    draft = { text: '', stance: draft.stance, replyTo: null, correction: false }; saveDraft(); renderComposer();
    const thread = document.querySelector(`[data-thread="${post.threadId}"]`); if (thread) thread.open = true;
    error(''); document.querySelector('#announcer').textContent = 'Your contribution was published.';
  }
  async function sendPost() {
    if (sending || person?.canWrite === false) return;
    if (!pendingPost) {
      pendingPost = { route: draft.correction ? 'corrections' : 'posts', body: { text: draft.text, replyTo: draft.replyTo, requestId: uid() } };
      localStorage.setItem(key + ':pending-post', JSON.stringify(pendingPost));
    }
    const send = pendingPost;
    sending = true; error(''); updateComposer();
    try { const result = await api(send.route, send.body); published(result.post); }
    catch (err) {
      // A definite rejection allows editing again. On uncertain network/storage
      // failures the exact payload remains locked until its receipt or safe retry.
      if ([400, 403, 409, 413, 415].includes(err.status)) {
        try {
          const result = await api('receipt?id=' + encodeURIComponent(send.body.requestId));
          if (result.post) { published(result.post); return; }
          pendingPost = null; localStorage.removeItem(key + ':pending-post');
        } catch { /* Keep the immutable send until the connection returns. */ }
      }
      error(err.message);
    } finally { sending = false; updateComposer(); await refresh(); }
  }
  function selectReply(post) {
    if (pendingPost || sending || person?.scope !== 'poster' || person?.canWrite === false) return;
    setView('feed');
    draft.replyTo = post?.id || null; saveDraft(); updateComposer();
    document.querySelector('#post-text').focus();
  }
  function renderPost(post, memberView = false) {
    const mine = post.author.id === person?.participant.id;
    const original = post.replyTo && data.posts.find(item => item.id === post.replyTo);
    const canPost = person?.scope === 'poster' && person?.canWrite !== false && !['opening', 'closing', 'ended'].includes(data.phase);
    return `<article class="post" id="${memberView ? 'member-post-' : 'post-'}${e(post.id)}" tabindex="-1">${identity(post.author, !memberView && data.profiles.some(p => p.id === post.author.id))}${post.provenance ? `<span class="badge">${{ team: 'Team-authored', simulation: 'Simulation-injected', scripted: 'Scripted reaction' }[post.provenance]}</span>` : ''}${post.correction ? '<span class="badge">Correction</span>' : ''}${post.disputed ? '<span class="badge disputed">Authorship disputed by this team</span>' : ''}${original ? `<button class="reply-context" data-jump="${e(original.id)}">Reply to @${e(original.author.username)}<span>${e(original.text.slice(0, 100))}</span></button>` : ''}<p class="post-body">${postText(post, data.profiles)}</p><time datetime="${e(post.createdAt)}">${e(new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}</time><div class="row">${memberView ? `<button class="secondary" data-jump="${e(post.id)}">View conversation</button>` : ''}${canPost ? `<button class="secondary" data-reply="${e(post.id)}">Reply</button>` : ''}${person?.scope === 'poster' && person?.canWrite !== false && data.phase !== 'ended' && mine && !post.disputed ? `<button class="secondary" data-flag="${e(post.id)}">I did not write this</button>` : ''}</div></article>`;
  }
  root.insertAdjacentHTML('beforeend', '<dialog id="member-dialog" class="join-dialog member-dialog" aria-labelledby="member-title"><div id="member-content"></div><button class="secondary" id="close-member">Close profile</button></dialog>');
  const memberDialog = document.querySelector('#member-dialog');
  document.querySelector('#close-member').onclick = () => memberDialog.close();
  memberDialog.addEventListener('close', () => { memberId = null; document.querySelector('#member-content').replaceChildren(); });
  function renderMember() {
    const profile = data?.profiles?.find(p => p.id === memberId);
    if (!profile) { if (memberDialog.open) memberDialog.close(); return; }
    const posts = data.posts.filter(post => post.author.id === memberId);
    const tagged = data.posts.filter(post => post.mentions?.includes(memberId));
    const html = `<div class="profile-preview"><div class="profile-preview-banner banner-art cover-${profile.cover}">${bannerArtwork(profile.cover)}</div><div class="profile-preview-content"><img src="${e(profile.avatar)}" alt="Profile picture"><span class="eyebrow">PUBLIC PROFILE</span><h2 id="member-title">@${e(profile.username)}</h2><p>${e(profile.bio)}</p></div></div><h3>${posts.length} ${posts.length === 1 ? 'contribution' : 'contributions'}</h3>${posts.slice().reverse().map(post => renderPost(post, true)).join('') || '<p class="muted">No contributions yet.</p>'}<h3>Tagged posts · ${tagged.length}</h3>${tagged.slice().reverse().map(post => `<article class="tagged-post"><strong>@${e(post.author.username)} mentioned @${e(profile.username)}</strong><p>${postText(post, data.profiles)}</p><button class="secondary" data-jump="${e(post.id)}">View conversation</button></article>`).join('') || '<p class="muted">Posts tagging this member will appear here.</p>'}`;
    const content = document.querySelector('#member-content');
    if (content.innerHTML !== html) content.innerHTML = html;
  }
  function openMember(id) { memberId = id; renderMember(); if (memberId && !memberDialog.open) memberDialog.showModal(); }
  root.addEventListener('click', event => {
    const button = event.target.closest('[data-profile], [data-reply], [data-flag], [data-jump], [data-hashtag], [data-insert-tag], [data-insert-mention], [data-clear-tag]');
    if (!button || !data?.posts) return;
    if (button.dataset.insertTag) { insertToken('#' + button.dataset.insertTag); return; }
    if (button.dataset.insertMention) { insertToken('@' + button.dataset.insertMention); return; }
    if (button.dataset.hashtag) { if (memberDialog.open) memberDialog.close(); activeHashtag = button.dataset.hashtag; setView('feed'); renderFeed(); document.querySelector('#tag-filter').scrollIntoView({ block: 'center' }); }
    if (button.hasAttribute('data-clear-tag')) { activeHashtag = null; renderFeed(); }
    if (button.dataset.profile) openMember(button.dataset.profile);
    if (button.dataset.reply) { if (memberDialog.open) memberDialog.close(); selectReply(data.posts.find(post => post.id === button.dataset.reply)); }
    if (button.dataset.flag) act(button, () => api('flags', { postId: button.dataset.flag }));
    if (button.dataset.jump) {
      activeHashtag = null; setView('feed'); renderFeed();
      if (memberDialog.open) memberDialog.close();
      const post = document.getElementById('post-' + button.dataset.jump);
      if (post) { post.closest('details').open = true; post.focus(); }
    }
  });
  function renderFeed() {
    if (!person) { document.querySelector('#threads').replaceChildren(); document.querySelector('#profiles').replaceChildren(); feedSignature = ''; return; }
    const signature = JSON.stringify([data.threads, data.profiles, person?.participant.id, data.phase, activeHashtag]); if (signature === feedSignature) return; feedSignature = signature;
    const container = document.querySelector('#threads');
    const existingPosts = new Set([...container.querySelectorAll('.post')].map(el => el.id));
    const expanded = new Map([...container.querySelectorAll('details')].map(el => [el.dataset.thread, el.open]));
    const active = document.activeElement?.dataset;
    const focus = active?.reply ? ['reply', active.reply] : active?.flag ? ['flag', active.flag] : null;
    const activity = new Map(data.posts.map((post, index) => [post.id, index]));
    document.querySelector('#tag-filter').innerHTML = activeHashtag ? `<p>Posts tagged <strong>#${e(activeHashtag)}</strong> <button class="secondary" data-clear-tag>Show all posts</button></p>` : '';
    const filtered = activeHashtag ? data.threads.map(thread => ({ ...thread, posts: thread.posts.filter(post => post.hashtags?.includes(activeHashtag)) })).filter(thread => thread.posts.length) : data.threads;
    const ordered = [...filtered].sort((a, b) => activity.get(b.posts.at(-1).id) - activity.get(a.posts.at(-1).id));
    container.innerHTML = ordered.length ? ordered.map(thread => `<details class="thread ${thread.id === person?.participant.id ? 'mine' : ''}" data-thread="${e(thread.id)}" ${!!activeHashtag || (expanded.get(thread.id) ?? true) ? 'open' : ''}><summary>@${e(thread.username)}${thread.id === person?.participant.id ? ' · Your conversation' : ''}<span>${thread.posts.length} ${thread.posts.length === 1 ? 'post' : 'posts'}</span></summary>${thread.posts.map(post => renderPost(post)).join('')}</details>`).join('') : `<p class="empty">${activeHashtag ? 'No posts with this hashtag yet.' : 'No posts yet.'}</p>`;
    container.querySelectorAll('.post').forEach(post => { if (!existingPosts.has(post.id)) post.classList.add('post-enter'); });
    if (focus) container.querySelector(`[data-${focus[0]}="${focus[1]}"]`)?.focus({ preventScroll: true });
    document.querySelector('#profiles').innerHTML = data.profiles.filter(p => p.id !== person.participant.id).map(p => `<button class="member-card theme-${p.cover}" data-profile="${e(p.id)}" aria-label="Visit @${e(p.username)}"><span class="member-cover banner-art cover-${p.cover}" aria-hidden="true">${bannerArtwork(p.cover)}</span><span class="member-card-body"><img src="${e(p.avatar)}" alt=""><strong>@${e(p.username)}</strong><span>${e(p.bio || 'Open Circle member')}</span></span></button>`).join('') || '<p class="empty">Other members will appear here when they join.</p>';
  }
  async function refresh() {
    if (busy) return; busy = true;
    try {
      if (person || !membershipChecked) {
        try {
          const current = await api('me');
          const changed = JSON.stringify([current.participant, current.privateDetails, current.scenario]) !== JSON.stringify([person?.participant, person?.privateDetails, person?.scenario]);
          const newlyConnected = !person; person = current; membershipChecked = true;
          if (changed) renderTeam(); if (newlyConnected) { renderComposer(); if (joinDialog.open) joinDialog.close(); }
        } catch (err) {
          if (err.status === 401) { membershipChecked = true; forgetTeam(); renderTeam(); renderComposer(); } else throw err;
        }
      }
      data = await api(person ? 'feed' : 'projector');
      if (pendingPost && person?.scope === 'poster' && !sending) { const result = await api('receipt?id=' + encodeURIComponent(pendingPost.body.requestId)); if (result.post) published(result.post); }
      if (!person) {
        showJoinDialog();
        const closed = !['opening', 'debate'].includes(data.phase);
        joinForm.querySelector('[type=submit]').disabled = closed;
        if (closed) document.querySelector('#join-error').textContent = 'Joining has closed. Use your team’s original device.';
      }
      document.querySelector('#question').textContent = data.question;
      const phase = document.querySelector('#phase'), next = phaseHTML(data); if (phase.innerHTML !== next) phase.innerHTML = next; phase.hidden = ['debate', 'exposure', 'forgery', 'reactions', 'discussion'].includes(data.phase) && !data.paused;
      document.querySelector('#counts').textContent = data.participants + (data.participants === 1 ? ' member' : ' members');
      document.querySelector('#connection').textContent = 'Connected';
      const notice = document.querySelector('#notice');
      if (data.notice && !notice.innerHTML) {
        notice.innerHTML = `<section class="panel notice"><h2>What happened in Open Circle</h2><p>${e(data.notice)}</p>${person?.scope === 'poster' ? `<form id="response-form" class="recovery-options"><fieldset><legend>What would help your team participate again?</legend>${[['correct-record','A visible correction'],['protect-privacy','Better privacy boundaries'],['review-access','Review who can use the account'],['moderation','Clear moderation and reporting'],['take-a-break','Time away from the discussion']].map(([value,label]) => `<label><input name="response" type="radio" value="${value}" ${person.response === value ? 'checked' : ''} required>${label}</label>`).join('')}</fieldset><button>Save team response</button><p id="response-status" role="status">${person.response ? 'Team response saved privately.' : ''}</p></form>` : ''}</section>`;
        const form = document.querySelector('#response-form'); if (form) form.onsubmit = ev => { ev.preventDefault(); act(ev.submitter, async () => { const choice = new FormData(form).get('response'); await api('responses', { choice }); person.response = choice; document.querySelector('#response-status').textContent = 'Team response saved privately.'; }); };
      } else if (!data.notice) notice.innerHTML = '';
      renderIncident();
      updateComposer();
      document.querySelectorAll('#response-form input, #response-form button, #edit-profile, #viewer-link').forEach(control => { control.disabled = data.phase === 'ended' || person?.canWrite === false; });
      document.querySelector('#social-tools').hidden = !person; document.querySelector('#trending').hidden = !person;
      if (person) {
        const trends = document.querySelector('#trending');
        const expanded = trends.querySelector('details')?.open ?? matchMedia('(min-width: 761px)').matches;
        const trendingHTML = `<details ${expanded ? 'open' : ''}><summary><span class="eyebrow">IN THIS CIRCLE</span><span class="trends-title">Trending hashtags</span></summary><ol class="trending-list">${(data.trending || []).slice(0, 5).map(tag => `<li><span class="trend-rank">${tag.rank}</span><div><button class="inline-tag" data-hashtag="${e(tag.tag)}">#${e(tag.label)}</button><span>${tag.count} ${tag.count === 1 ? 'post' : 'posts'}${tag.starter ? ' · Starter' : ''}</span></div></li>`).join('')}</ol></details>`;
        if (trends.innerHTML !== trendingHTML) trends.innerHTML = trendingHTML;
        activity.observe(data.activity);
      }
      const members = document.querySelector('#sidebar-other-members');
      if (members && person) {
        const names = (data.profiles || []).filter(p => p.id !== person.participant.id).map(p => `<li><button class="profile-link" data-profile="${e(p.id)}">@${e(p.username)}</button></li>`).join('');
        if (members.innerHTML !== names) members.innerHTML = names;
      }
      renderFeed(); if (memberId) renderMember();
    } catch (err) {
      document.querySelector('#connection').textContent = err.message;
      if (err.status === 410) { activity.clear(); document.querySelector('#social-tools').hidden = true; document.querySelector('#trending').hidden = true; document.querySelector('#tag-filter').replaceChildren(); person = null; data = null; pendingPost = null; if (incidentDialog.open) incidentDialog.close(); document.querySelector('#incident-banner').replaceChildren(); if (memberDialog.open) memberDialog.close(); if (joinDialog.open) joinDialog.close(); [key,key+':draft',key+':post-id',key+':composer',key+':pending-post'].forEach(k=>localStorage.removeItem(k)); document.querySelector('#team').innerHTML = '<p>This session has been cleared or expired.</p>'; document.querySelector('#composer').innerHTML = ''; document.querySelector('#threads').innerHTML = ''; document.querySelector('#profiles').innerHTML = ''; document.querySelector('#notice').innerHTML = ''; document.querySelector('#phase').textContent = 'This session has been cleared or expired.'; }
    } finally { busy = false; }
  }
  try { person = await api('me'); membershipChecked = true; } catch (err) { if (err.status === 401) { membershipChecked = true; forgetTeam(); } }
  renderTeam(); renderComposer(); await refresh();
  if (!person && data) showJoinDialog();
  window.addEventListener('online', refresh);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  setInterval(refresh, 2000);
}
