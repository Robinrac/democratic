import { createIncidentExperience } from './incident-experience.js';
import { PROFILE_THEMES } from './profile-themes.js';
import { createActivity, postText, profileStats, newestPosts } from './forum-activity.js';

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
  return `<div class="setup-tabs" role="tablist" aria-label="Profile setup"><button type="button" role="tab" id="${prefix}-personal-tab" aria-controls="${prefix}-personal" aria-selected="true">Personal info</button><button type="button" role="tab" id="${prefix}-appearance-tab" aria-controls="${prefix}-appearance" aria-selected="false" tabindex="-1">Profile</button></div><section id="${prefix}-personal" role="tabpanel" aria-labelledby="${prefix}-personal-tab"><label for="${prefix}-bio">Bio</label><p class="field-hint" id="${prefix}-bio-hint">Public · Based on your paper profile.</p><textarea id="${prefix}-bio" name="bio" maxlength="160" rows="2" aria-describedby="${prefix}-bio-hint" placeholder="What matters to this person?">${e(values.bio || '')}</textarea><fieldset class="private-fields" aria-describedby="${prefix}-privacy-note"><legend><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 14v3"/></svg>Private details</legend><p class="privacy-note" id="${prefix}-privacy-note">These details are not visible to anyone else in the forum.</p><div class="details-grid"><div><label for="${prefix}-name">Name from your paper</label><input id="${prefix}-name" name="name" maxlength="60" value="${e(values.name || '')}" required autocomplete="off" aria-describedby="${prefix}-name-hint" placeholder="Enter name"><small class="field-hint" id="${prefix}-name-hint">First name, surname or full name. Accents are optional.</small></div><div><label for="${prefix}-town">Home town from your paper</label><input id="${prefix}-town" name="town" maxlength="80" value="${e(values.town || '')}" required autocomplete="off" placeholder="Enter home town"></div></div></fieldset></section><section id="${prefix}-appearance" role="tabpanel" aria-labelledby="${prefix}-appearance-tab" hidden>${prefix === 'join' ? '<p class="field-hint">Choose your look, or we’ll pick a random picture and banner when you join.</p>' : ''}${appearanceChoices('color', values.color ?? 0)}${appearanceChoices('cover', values.cover ?? 0)}</section>`;
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
function phaseHTML(data) { if (['reflection', 'recovery', 'discussion', 'closing'].includes(data.phase)) return ''; const copy = data.scenario === 'transport-v1' && data.phase === 'debate' ? ['Different journeys. Different priorities.', 'Discuss your own proposal: lower fares, free travel, a fare cap or improving services first.'] : phaseCopy[data.phase] || phaseCopy.opening; return `<strong>${e(copy[0])}</strong><p>${e(copy[1])}</p>${data.paused ? '<small>Updates are paused. You can still read the conversation.</small>' : ''}`; }

export async function startProjector() {
  const sid = new URLSearchParams(location.search).get('s');
  const link = location.origin + '/?s=' + encodeURIComponent(sid || '');
  document.querySelector('#app').innerHTML = header(false) + `<main id="main" class="projector"><section><span class="eyebrow">WELCOME TO OPEN CIRCLE</span><h1>Your voice.<br>Your choice.<br>Our conversation.</h1><span class="eyebrow">TODAY’S TOPIC</span><p id="question"></p><div class="phase" id="phase"></div><p id="progress" role="status"></p></section><section class="panel"><div id="qr"></div><h2>Join the circle.</h2><p>Scan the QR, or enter this room code:</p><strong id="room-code" class="projector-room-code" aria-label="Room code"></strong><p id="display-url"></p><p>Use the details on your paper profile to join.</p><p id="connection" role="status"></p></section></main>`;
  if (!sid) { document.querySelector('#connection').textContent = 'Open the projector link from your host screen.'; return; }
  const qr = window.qrcode(0, 'M'); qr.addData(link); qr.make();
  document.querySelector('#qr').innerHTML = qr.createSvgTag({ cellSize: 6, margin: 24, scalable: true });
  document.querySelector('#qr svg').setAttribute('aria-label', 'Scan to open Open Circle');
  document.querySelector('#qr svg').setAttribute('role', 'img');
  document.querySelector('#display-url').textContent = location.host;
  let busy = false;
  const refresh = async () => {
    if (busy) return; busy = true;
    try {
      const data = await request('projector', { sid });
      document.querySelector('#room-code').textContent = data.joinCode ? data.joinCode.slice(0, 3) + ' ' + data.joinCode.slice(3) : '';
      document.querySelector('#qr').hidden = data.phase === 'ended';
      document.querySelector('#room-code').hidden = data.phase === 'ended';
      document.querySelector('#question').textContent = data.question;
      document.querySelector('#phase').innerHTML = phaseHTML(data);
      document.querySelector('#phase').hidden = !phaseHTML(data);
      document.querySelector('#progress').textContent = `${data.participants} / ${data.capacity} profiles joined · ${data.genuinePosts} contributions`;
      document.querySelector('#connection').textContent = ['localhost', '127.0.0.1'].includes(location.hostname) ? 'For phones, open the host screen using the computer’s network address before opening this projector link.' : 'Live updates connected';
    } catch (error) { document.querySelector('#connection').textContent = error.message; if (error.status === 410) { document.querySelector('#qr').replaceChildren(); document.querySelector('#room-code').textContent = ''; document.querySelector('#progress').textContent = ''; } }
    finally { busy = false; }
  };
  await refresh(); setInterval(refresh, 2000);
}

export async function startParticipant() {
  const root = document.querySelector('#app'), sid = new URLSearchParams(location.search).get('s');
  if (!sid) {
    root.innerHTML = header() + `<main id="main" class="welcome room-join"><span class="eyebrow">DIFFERENT VOICES. SHARED SPACE.</span><img class="welcome-mark" src="/brand/open-circle-mark.png" alt=""><h1>Join the circle.</h1><p>Enter the six-letter room code on your host’s screen.</p><form id="room-join-form" novalidate><label class="sr-only" for="join-room-code">Room code</label><input id="join-room-code" name="code" maxlength="12" placeholder="ABC DEF" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-describedby="room-join-error" required><button class="primary" type="submit">Join room <span aria-hidden="true">→</span></button><p id="room-join-error" class="error" role="alert"></p></form><p class="room-join-alternative">Or scan the QR code on the screen to join directly.</p></main>`;
    const input = document.querySelector('#join-room-code'), error = document.querySelector('#room-join-error');
    input.oninput = () => { input.value = input.value.toUpperCase().replace(/\s/g, '').slice(0, 6); error.textContent = ''; input.removeAttribute('aria-invalid'); };
    document.querySelector('#room-join-form').onsubmit = async event => {
      event.preventDefault();
      if (!/^[A-Z]{6}$/.test(input.value)) { error.textContent = 'Enter the six letters shown on your host’s screen.'; input.setAttribute('aria-invalid', 'true'); input.focus(); return; }
      const button = event.submitter; button.disabled = true; error.textContent = '';
      try { const room = await request('rooms/resolve', { body: { code: input.value } }); location.assign('/?s=' + encodeURIComponent(room.id)); }
      catch (err) { error.textContent = err.message; input.setAttribute('aria-invalid', 'true'); button.disabled = false; }
    };
    return;
  }
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
      joinForm.reset(); chosenAppearance.clear(); updateJoinPreview();
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
    incidentExperience.clear(); activity.clear(); activeHashtag = null;
    person = null; token = saved(':replacement')?.token || uid(); localStorage.setItem(key, token);
    [':draft', ':post-id', ':composer', ':pending-post'].forEach(suffix => localStorage.removeItem(key + suffix));
    draft = { text: '', stance: null, replyTo: null, correction: false }; pendingPost = null;
  }
  const api = (route, body) => request(route, { sid, token, body });
  root.innerHTML = header() + `<main id="main" class="layout social-layout">
    <div class="forum-toolbar"><button id="open-menu" class="secondary" aria-label="Open menu" aria-controls="phone-menu" aria-expanded="false"><span aria-hidden="true">☰</span> Menu</button><div id="notification-control"></div></div><dialog id="phone-menu" aria-label="Forum menu"><button id="close-menu" class="secondary">Close menu ×</button></dialog><aside class="sidebar">
      <section class="panel join-card" id="team"></section>
      <nav class="social-nav" aria-label="Forum navigation">
        <a href="#feed" data-view="feed" aria-current="page"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg><span>Feed</span></a>
        <a href="#discover" data-view="discover"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/></svg><span>Discover</span></a>
      </nav>
      <ul id="sidebar-other-members" class="sidebar-names" aria-label="Other members" hidden></ul>
      <section class="sidebar-trends" id="trending" aria-label="Top five hashtags"></section>
      <section class="sidebar-about"><span class="eyebrow">ABOUT OPEN CIRCLE</span><h2>Different voices.<br>Shared space.</h2><p>Share an idea. Hear another view.</p></section>
      <div class="session-note"><span class="dot"></span><span id="connection" role="status">Connecting…</span></div>
    </aside>
    <section class="conversation" id="feed-view" aria-labelledby="feed-title">
      <div class="feed-heading"><h1 id="feed-title">Feed</h1><span id="counts" class="people"></span></div>
      <div class="panel prompt"><span class="eyebrow">TODAY’S TOPIC</span><h2 id="question">Bus fares for young people</h2></div>
      <div class="phase" id="phase" aria-live="polite"></div><p id="error" role="alert"></p>
      <section id="notice"></section><section id="incident-banner" aria-live="polite"></section><section id="account-takeover" hidden></section>
      <section id="composer"></section><section id="social-tools"><div id="activity-history"></div></section>
      <div id="phone-trends"></div><div id="tag-filter"></div><div id="threads"></div>
    </section>
    <section class="conversation" id="discover-view" aria-labelledby="discover-title" hidden>
      <div class="feed-heading"><h1 id="discover-title">Discover</h1></div><div id="profiles" class="member-grid"></div>
    </section>
  </main>`;
  const menu = document.querySelector('#phone-menu'), sidebar = document.querySelector('.sidebar'), layout = document.querySelector('.social-layout'), phone = matchMedia('(max-width: 760px)');
  function arrangePhone() {
    const trends = document.querySelector('#trending');
    if (phone.matches) { menu.append(sidebar); document.querySelector('#phone-trends').append(trends); }
    else { if (menu.open) menu.close(); layout.insertBefore(sidebar, document.querySelector('#feed-view')); sidebar.insertBefore(trends, sidebar.querySelector('.sidebar-about')); }
  }
  document.querySelector('#open-menu').onclick = () => { menu.showModal(); document.querySelector('#open-menu').setAttribute('aria-expanded', 'true'); };
  document.querySelector('#close-menu').onclick = () => menu.close();
  menu.addEventListener('close', () => document.querySelector('#open-menu').setAttribute('aria-expanded', 'false'));
  sidebar.addEventListener('click', event => { if (event.target.closest('[data-view], [data-profile], #edit-profile, #open-profile, #open-join') && menu.open) menu.close(); }, true);
  phone.addEventListener('change', arrangePhone); arrangePhone();
  root.addEventListener('click', event => { if (event.target.closest('#more-trends')) { const trends = document.querySelector('#trending'); trends.classList.toggle('show-all'); const button = document.querySelector('#more-trends'); button.textContent = trends.classList.contains('show-all') ? 'Show top 3' : 'View top 5'; button.setAttribute('aria-expanded', String(trends.classList.contains('show-all'))); } });
  const activity = createActivity(root, key);
  root.insertAdjacentHTML('beforeend', `<dialog id="join-dialog" class="join-dialog" aria-labelledby="join-title"><form id="join-form"><h2 id="join-title">Create your profile.</h2><div class="profile-preview"><div class="profile-preview-banner banner-art cover-0">${bannerArtwork(0)}</div><div class="profile-preview-content"><img id="preview-picture" src="/avatars/0.svg" alt="Selected profile picture"><span class="eyebrow">YOUR PUBLIC PROFILE</span><strong id="preview-name" aria-live="polite">@your-username</strong><p id="preview-bio">Your bio</p><small id="preview-hint">Username assigned from your paper profile.</small></div></div>${profileFields('join')}<p id="join-error" class="error" role="alert"></p><div class="join-actions"><button class="primary" type="submit">Join the forum</button></div></form></dialog>`);
  root.insertAdjacentHTML('beforeend', '<dialog id="workshop-intro-dialog" class="join-dialog welcome-dialog" aria-labelledby="welcome-title"><span class="eyebrow">YOUR PROFILE IS READY</span><h2 id="welcome-title">Today’s topic</h2><p id="welcome-topic"></p><h3>Your anonymous forum</h3><p>Share your paper character’s views using an anonymous username. Read, reply and @tag others.</p><form method="dialog"><button class="primary" autofocus>Enter the forum</button></form></dialog>');
  const welcomeDialog = document.querySelector('#workshop-intro-dialog');
  async function restartDeletedAccount() {
    const replacement = saved(':replacement') || { token: uid(), pending: true };
    localStorage.setItem(key + ':replacement', JSON.stringify(replacement));
    await api('restart-account', { newToken: replacement.token });
    replacement.pending = false;
    localStorage.setItem(key, replacement.token);
    localStorage.setItem(key + ':replacement', JSON.stringify(replacement));
    location.reload();
  }
  const incidentExperience = createIncidentExperience({ root, key, restartAccount: restartDeletedAccount,
    async deployBots(targetId) { await api('deploy-bots', { requestId: uid(), ...(targetId ? { targetId } : {}) }); await refresh(); },
    forceFeed() {
      memberId = null; activeHashtag = null;
      document.querySelectorAll('dialog[open]:not(#incident-dialog)').forEach(dialog => dialog.close());
      setView('feed'); renderFeed();
      document.querySelectorAll('#threads details').forEach(thread => { thread.open = true; });
      document.querySelector('#incident-banner').scrollIntoView({ block: 'start', behavior: 'instant' });
    },
    updateControls: updateIncidentControls,
    refreshPosts: renderFeed,
    showPost(id) {
      renderFeed();
      const post = document.getElementById('post-' + id);
      if (post) { post.classList.add('takeover-arrived'); post.scrollIntoView({ block: 'center', behavior: 'instant' }); }
    }
  });
  const incidentDialog = document.querySelector('#incident-dialog');
  function updateIncidentControls() {
    document.querySelector('#composer').hidden = incidentExperience.readOnly || incidentExperience.busy;
    document.querySelectorAll('[data-view="discover"], [data-profile], #open-profile').forEach(link => {
      if (incidentExperience.lockedToFeed) link.setAttribute('aria-disabled', 'true'); else link.removeAttribute('aria-disabled');
    });
    const edit = document.querySelector('#edit-profile');
    if (edit) edit.disabled = person?.canWrite === false || incidentExperience.busy || data?.phase === 'ended';
    updateComposer();
  }
  function renderIncident() { incidentExperience.update(person, data); }
  const joinDialog = document.querySelector('#join-dialog');
  const joinForm = document.querySelector('#join-form');
  setupProfileTabs(joinForm);
  const chosenAppearance = new Set();
  joinForm.addEventListener('click', event => { const option = event.target.closest('.appearance-option')?.querySelector('input'); if (option) chosenAppearance.add(option.name); });
  joinForm.addEventListener('change', event => { if (['color', 'cover'].includes(event.target.name)) chosenAppearance.add(event.target.name); });
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
  function showJoinDialog() { if (saved(':replacement')) { document.querySelector('#join-title').textContent = 'Create your new account.'; document.querySelector('#preview-hint').textContent = 'Your old account was deleted. Sign up again using your paper name.'; } if (welcomeDialog.open) welcomeDialog.close(); if (!joinDialog.open) joinDialog.showModal(); }
  joinDialog.addEventListener('cancel', event => event.preventDefault());
  joinDialog.addEventListener('close', () => { if (!person && data) showJoinDialog(); });
  joinForm.onsubmit = async event => {
    event.preventDefault();
    for (const field of ['color', 'cover']) {
      if (chosenAppearance.has(field)) continue;
      const choice = 1 + crypto.getRandomValues(new Uint32Array(1))[0] % (PROFILE_THEMES.length - 1);
      joinForm.querySelector(`input[name=${field}][value="${choice}"]`).checked = true;
      chosenAppearance.add(field);
    }
    updateJoinPreview();
    const button = event.submitter, fields = new FormData(joinForm);
    button.disabled = true; document.querySelector('#join-error').textContent = '';
    try {
      person = await api('join', { name: fields.get('name'), town: fields.get('town'), bio: fields.get('bio'), color: Number(fields.get('color')), cover: Number(fields.get('cover')) });
      localStorage.removeItem(key + ':replacement');
      membershipChecked = true; joinDialog.close(); renderTeam(); renderComposer();
      document.querySelector('#welcome-topic').textContent = person.scenario === 'transport-v1'
        ? 'Should buses be cheaper or free for under-20s or under-25s—or should we keep fares and improve services?'
        : data.question;
      welcomeDialog.showModal();
      await refresh();
      document.querySelector('#announcer').textContent = 'Your profile is ready.';
    } catch (err) { document.querySelector('#join-error').textContent = err.message; if (!err.status || err.status >= 500) membershipChecked = false; }
    finally { button.disabled = false; }
  };
  function setView(view, scroll = false) {
    if (view === 'discover' && incidentExperience.lockedToFeed) return;
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
    document.querySelector('#profile-dialog')?.remove();
    const target = document.querySelector('#team');
    if (!person) {
      target.className = 'panel join-card';
      target.innerHTML = `<span class="eyebrow">YOUR PROFILE</span><h2>Step into the circle.</h2><p>Use your paper profile to join with an anonymous username, bio, banner and picture.</p><button id="open-join" class="primary">Create profile</button>`;
      document.querySelector('#open-join').onclick = showJoinDialog;
      return;
    }
    const p = person.participant, card = person.privateRole, details = person.privateDetails;
    target.className = 'sidebar-members';
    target.innerHTML = `${person.scope === 'viewer' ? '<span class="eyebrow">TEAM VIEWER · READ ONLY</span>' : ''}<button class="mini-profile" data-profile="${e(p.id)}" aria-label="Open your profile"><span class="mini-profile-banner banner-art cover-${p.cover}" aria-hidden="true">${bannerArtwork(p.cover)}</span><span class="mini-profile-body"><img src="${e(p.avatar)}" alt=""><span class="eyebrow">YOUR PROFILE</span><strong>@${e(p.username)}</strong></span></button>${card ? `<button id="edit-profile" class="secondary edit-profile-button">Edit profile</button><dialog id="profile-dialog" class="join-dialog" aria-labelledby="edit-title"><h2 id="edit-title">Your profile.</h2><form id="profile-form"><div class="profile-preview"><div class="profile-preview-banner banner-art cover-${p.cover}">${bannerArtwork(p.cover)}</div><div class="profile-preview-content"><img class="edit-preview-picture" src="${e(p.avatar)}" alt="Selected profile picture"><span class="eyebrow">YOUR PUBLIC PROFILE</span><strong>@${e(p.username)}</strong><p class="edit-preview-bio">${e(p.bio || 'Your bio')}</p></div></div><p id="profile-error" class="error" role="alert"></p>${profileFields('edit', { ...p, ...details })}<div class="join-actions"><button class="primary">Save profile</button><button type="button" id="close-profile" class="secondary">Cancel</button></div></form></dialog>` : '<span class="muted">Read-only</span>'}`;
    if (card) {
      const editDialog = document.querySelector('#profile-dialog');
      root.append(editDialog);
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
    }
  }
  function renderComposer() {
    const composer = document.querySelector('#composer');
    if (person?.scope !== 'poster') { composer.innerHTML = ''; return; }
    composer.innerHTML = `<section class="panel composer"><div class="composer-person">${identity(person.participant)}<span class="you-tag">YOU</span></div><form id="post-form"><p id="reply-label" class="reply-label"></p><button type="button" id="cancel-reply" class="secondary" hidden>Cancel reply</button><label class="sr-only" for="post-text">Your reason or reply</label><div class="mention-editor"><textarea id="post-text" maxlength="500" required aria-describedby="social-help" aria-autocomplete="list" aria-controls="mention-suggestions" aria-expanded="false" placeholder="Share a thought or ask a question…"></textarea><div id="mention-suggestions" class="mention-menu" role="listbox" aria-label="Members to tag" hidden></div></div><p id="social-help" class="muted">@ mention someone · Use #hashtags to put your view in trending.</p><div class="hashtag-cues"><button type="button" data-insert-tag="AffordableJourneys">#AffordableJourneys</button><button type="button" data-insert-tag="ExpensiveRides">#ExpensiveRides</button><button type="button" data-insert-tag="ServiceFirst">#ServiceFirst</button></div><label id="correction-label" hidden><input type="checkbox" id="correction">Publish this as a correction</label><div class="composer-bottom"><span id="counter">0 / 500</span><button class="primary" id="send-post">Publish post <span aria-hidden="true">↑</span></button></div><p id="post-help" class="muted" role="status"></p></form></section>`;
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
    const partial = value.startsWith('@') && area.value.slice(0, start).match(/(?:^|\s)(@[\p{L}\p{M}\p{N}-]*)$/iu);
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
    const before = area.value.slice(0, area.selectionStart), match = before.match(/(?:^|\s)@([\p{L}\p{M}\p{N}-]*)$/iu);
    const key = match ? before : '';
    if (key !== mentionKey) { mentionIndex = -1; mentionKey = key; }
    const show = !!match && !area.disabled && currentView === 'feed' && document.activeElement === area && key !== dismissedMention;
    target.hidden = !show; area.setAttribute('aria-expanded', String(show));
    if (!show) { area.removeAttribute('aria-activedescendant'); return; }
    const members = (data?.profiles || []).filter(p => p.username.startsWith(match[1].normalize('NFC').toLowerCase()));
    if (mentionIndex >= members.length) mentionIndex = -1;
    const html = members.map((p, index) => `<button type="button" role="option" tabindex="-1" id="mention-option-${index}" aria-selected="${index === mentionIndex}" data-insert-mention="${e(p.username)}"><img src="${e(p.avatar)}" alt=""><span>@${e(p.username)}</span></button>`).join('') || '<p>No matching members</p>';
    if (target.innerHTML !== html) target.innerHTML = html;
    if (mentionIndex >= 0) area.setAttribute('aria-activedescendant', 'mention-option-' + mentionIndex); else area.removeAttribute('aria-activedescendant');
  }
  function updateComposer() {
    if (person?.scope !== 'poster') return;
    const closed = !data || person.canWrite === false || ['opening', 'closing', 'ended'].includes(data.phase);
    const locked = sending || !!pendingPost || incidentExperience.busy;
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
    button.disabled = person.canWrite === false || incidentExperience.busy || sending || (!pendingPost && (closed || missingReply));
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
    if (sending || incidentExperience.busy || person?.canWrite === false) return;
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
    if (incidentExperience.busy || pendingPost || sending || person?.scope !== 'poster' || person?.canWrite === false) return;
    setView('feed');
    draft.replyTo = post?.id || null; saveDraft(); updateComposer();
    document.querySelector('#post-text').focus();
  }
  const mentionsYou = post => !post.hidden && post.mentions?.includes(person?.participant.id);
  const mentionMarker = post => mentionsYou(post) ? '<span class="mention-marker"><span aria-hidden="true"></span>Tagged you</span>' : '';
  function renderPost(post, memberView = false) {
    const mine = post.author.id === person?.participant.id;
    const original = post.replyTo && data.posts.find(item => item.id === post.replyTo);
    const canPost = person?.scope === 'poster' && person?.canWrite !== false && !['opening', 'closing', 'ended'].includes(data.phase);
    return `<article ${incidentExperience.hiddenPostIds.includes(post.id) ? 'data-takeover-pending' : ''} class="post${mine ? ' is-mine' : ''}${mentionsYou(post) ? ' is-mentioned' : ''}" id="${memberView ? 'member-post-' : 'post-'}${e(post.id)}" tabindex="-1"><div class="post-heading">${identity(post.author, !memberView && data.profiles.some(p => p.id === post.author.id))}<time datetime="${e(post.createdAt)}" title="${e(new Date(post.createdAt).toLocaleString())}">${e(new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}</time></div>${mine || mentionsYou(post) ? `<div class="post-labels">${mine ? '<span class="own-post-label">Your account</span>' : ''}${mentionMarker(post)}</div>` : ''}${post.provenance ? `<span class="badge">${{ team: 'Team-authored', simulation: 'Simulation-injected', scripted: 'Scripted reaction' }[post.provenance]}</span>` : ''}${post.correction ? '<span class="badge">Correction</span>' : ''}${post.disputed ? '<span class="badge disputed">Authorship disputed by this team</span>' : ''}${original ? `<button class="reply-context" data-jump="${e(original.id)}">Reply to @${e(original.author.username)}<span>${e(original.text.slice(0, 100))}</span></button>` : ''}<p class="post-body">${postText(post, data.profiles)}</p>${post.exposedIdentity ? `<figure class="exposed-identity"><img src="${e(post.exposedIdentity.portrait)}" alt="${e(post.exposedIdentity.name)}"><figcaption><strong>${e(post.exposedIdentity.name)}</strong><span>${e(post.exposedIdentity.town)}</span><small>Identity shared in this post</small></figcaption></figure>` : ''}<div class="row post-actions">${memberView ? `<button class="secondary" data-jump="${e(post.id)}">View conversation</button>` : ''}${canPost ? `<button class="secondary" data-reply="${e(post.id)}">Reply</button>` : ''}${person?.scope === 'poster' && person?.canWrite !== false && data.phase !== 'ended' && mine && !post.disputed ? `<button class="secondary" data-flag="${e(post.id)}">I did not write this</button>` : ''}</div></article>`;
  }
  root.insertAdjacentHTML('beforeend', '<dialog id="member-dialog" class="join-dialog member-dialog" aria-labelledby="member-title"><div id="member-content"></div><button class="secondary" id="close-member">Close profile</button></dialog>');
  const memberDialog = document.querySelector('#member-dialog');
  document.querySelector('#close-member').onclick = () => memberDialog.close();
  memberDialog.addEventListener('close', () => { memberId = null; document.querySelector('#member-content').replaceChildren(); });
  function renderProfileStats(id) {
    const stats = profileStats(data.posts, id, data.profiles);
    const ranking = (items, kind) => items.length ? `<ol>${items.map(item => `<li><button class="inline-tag" ${kind === 'hashtag' ? 'data-hashtag' : 'data-profile'}="${e(item.id)}">${kind === 'hashtag' ? '#' : '@'}${e(item.label)}</button><span class="stat-frequency">${item.count} ${item.count === 1 ? 'post' : 'posts'}</span></li>`).join('')}</ol>` : '<p class="muted">No activity yet.</p>';
    return `<section class="circle-profile-stats" aria-label="Your circle stats"><h3>Your circle stats</h3><dl class="profile-stat-totals"><div><dt>Posts</dt><dd data-stat="posts">${stats.posts}</dd></div><div><dt>Replies</dt><dd data-stat="replies">${stats.replies}</dd></div><div><dt>Mentions received</dt><dd data-stat="mentions">${stats.mentions}</dd></div></dl><div class="profile-rankings"><section><h4>Hashtags you use most</h4>${ranking(stats.hashtags, 'hashtag')}</section><section><h4>People you tag most</h4>${ranking(stats.tagged, 'profile')}</section></div></section>`;
  }
  function renderMember() {
    const profile = data?.profiles?.find(p => p.id === memberId);
    if (!profile) { if (memberDialog.open) memberDialog.close(); return; }
    const posts = data.posts.filter(post => post.author.id === memberId);
    const tagged = data.posts.filter(post => post.mentions?.includes(memberId));
    const html = `<div class="profile-preview"><div class="profile-preview-banner banner-art cover-${profile.cover}">${bannerArtwork(profile.cover)}</div><div class="profile-preview-content"><img src="${e(profile.avatar)}" alt="Profile picture"><span class="eyebrow">PUBLIC PROFILE</span><h2 id="member-title" tabindex="-1">@${e(profile.username)}</h2><p>${e(profile.bio)}</p></div></div>${memberId === person?.participant.id ? renderProfileStats(memberId) : ''}<h3>${posts.length} ${posts.length === 1 ? 'contribution' : 'contributions'}</h3>${newestPosts(posts).map(post => renderPost(post, true)).join('') || '<p class="muted">No contributions yet.</p>'}${tagged.length ? `<h3>Tagged posts · ${tagged.length}</h3>` : ''}${newestPosts(tagged).map(post => `<article class="tagged-post${mentionsYou(post) ? ' is-mentioned' : ''}">${mentionMarker(post)}<strong>@${e(post.author.username)} mentioned @${e(profile.username)}</strong><p>${postText(post, data.profiles)}</p><button class="secondary" data-jump="${e(post.id)}">View conversation</button></article>`).join('') || ''}`;
    const content = document.querySelector('#member-content');
    if (content.innerHTML !== html) content.innerHTML = html;
  }
  function openMember(id) { if (incidentExperience.lockedToFeed) return; memberId = id; renderMember(); if (memberId && !memberDialog.open) memberDialog.showModal(); memberDialog.scrollTop = 0; document.querySelector('#member-title')?.focus({ preventScroll: true }); }
  root.addEventListener('click', event => {
    const button = event.target.closest('[data-profile], [data-reply], [data-flag], [data-jump], [data-hashtag], [data-insert-tag], [data-insert-mention], [data-clear-tag]');
    if (!button || !data?.posts || incidentExperience.busy) return;
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
      if (post) { post.focus(); }
    }
  });
  function renderFeed() {
    if (!person) { document.querySelector('#threads').replaceChildren(); document.querySelector('#profiles').replaceChildren(); feedSignature = ''; return; }
    const signature = JSON.stringify([data.posts, data.profiles, person?.participant.id, data.phase, activeHashtag, incidentExperience.hiddenPostIds]); if (signature === feedSignature) return; feedSignature = signature;
    const container = document.querySelector('#threads');
    const existingPosts = new Set([...container.querySelectorAll('.post')].map(el => el.id));
    const active = document.activeElement?.dataset;
    const focus = active?.reply ? ['reply', active.reply] : active?.flag ? ['flag', active.flag] : null;
    document.querySelector('#tag-filter').innerHTML = activeHashtag ? `<p>Posts tagged <strong>#${e(activeHashtag)}</strong> <button class="secondary" data-clear-tag>Show all posts</button></p>` : '';
    const filtered = activeHashtag ? data.posts.filter(post => post.hashtags?.includes(activeHashtag)) : data.posts;
    const ordered = newestPosts(filtered);
    container.innerHTML = ordered.length ? ordered.map(post => renderPost(post)).join('') : `<p class="empty">${activeHashtag ? 'No posts with this hashtag yet.' : 'No posts yet.'}</p>`;
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
        const closed = ['closing', 'ended'].includes(data.phase) || (!['opening', 'debate'].includes(data.phase) && !saved(':replacement'));
        joinForm.querySelector('[type=submit]').disabled = closed;
        if (closed) document.querySelector('#join-error').textContent = 'Joining has closed. Use your team’s original device.';
      }
      document.querySelector('#question').textContent = data.question;
      const phase = document.querySelector('#phase'), next = phaseHTML(data); if (phase.innerHTML !== next) phase.innerHTML = next; phase.hidden = !['opening', 'ended'].includes(data.phase);
      document.querySelector('#counts').textContent = data.participants + (data.participants === 1 ? ' member' : ' members');
      document.querySelector('#connection').textContent = 'Connected';
      const notice = document.querySelector('#notice');
      notice.replaceChildren();
      renderIncident();
      updateComposer();
      updateIncidentControls();
      document.querySelector('#social-tools').hidden = !person; document.querySelector('#trending').hidden = !person;
      if (person) {
        const trends = document.querySelector('#trending');
        const expanded = trends.classList.contains('show-all');
        const leader = data.trending?.find(tag => tag.count > 0)?.tag;
        const previousLeader = localStorage.getItem(key + ':trend-leader');
        if (leader && previousLeader && leader !== previousLeader) localStorage.setItem(key + ':new-leader', leader);
        if (leader) localStorage.setItem(key + ':trend-leader', leader);
        const newLeader = localStorage.getItem(key + ':new-leader');
        const trendingHTML = `<div class="trends-heading"><h2 class="trends-title">Trending hashtags</h2><button id="more-trends" class="secondary" aria-expanded="${expanded}">${expanded ? 'Show top 3' : 'View top 5'}</button></div><ol class="trending-list">${(data.trending || []).slice(0, 5).map(tag => `<li class="${tag.rank === 1 ? 'leading-trend' : ''}"><span class="trend-rank">${tag.rank}</span><div><button class="inline-tag" data-hashtag="${e(tag.tag)}">#${e(tag.label)}</button><span>${tag.count} ${tag.count === 1 ? 'post' : 'posts'}${tag.starter ? ' · Starter' : ''}${tag.rank === 1 && tag.tag === newLeader ? ' · New #1' : ''}</span></div></li>`).join('')}</ol>`;
        if (trends.innerHTML !== trendingHTML) trends.innerHTML = trendingHTML;
        activity.observe(data.activity);
      }
      const members = document.querySelector('#sidebar-other-members');
      if (members) members.hidden = !person;
      if (members && !person) members.replaceChildren();
      if (members && person) {
        const names = (data.profiles || []).filter(p => p.id !== person.participant.id).map(p => `<li><button class="profile-link" data-profile="${e(p.id)}">@${e(p.username)}</button></li>`).join('');
        if (members.innerHTML !== names) members.innerHTML = names;
      }
      renderFeed(); if (memberId) renderMember();
    } catch (err) {
      document.querySelector('#connection').textContent = err.message;
      if (err.status === 410) { incidentExperience.clear(); welcomeDialog.close(); activity.clear(); document.querySelector('#social-tools').hidden = true; document.querySelector('#trending').hidden = true; document.querySelector('#tag-filter').replaceChildren(); person = null; data = null; pendingPost = null; if (incidentDialog.open) incidentDialog.close(); document.querySelector('#incident-banner').replaceChildren(); if (memberDialog.open) memberDialog.close(); if (joinDialog.open) joinDialog.close(); [key,key+':draft',key+':post-id',key+':composer',key+':pending-post'].forEach(k=>localStorage.removeItem(k)); document.querySelector('#team').innerHTML = '<p>This session has been cleared or expired.</p>'; document.querySelector('#composer').innerHTML = ''; document.querySelector('#threads').innerHTML = ''; document.querySelector('#profiles').innerHTML = ''; document.querySelector('#sidebar-other-members').replaceChildren(); document.querySelector('#notice').innerHTML = ''; document.querySelector('#phase').textContent = 'This session has been cleared or expired.'; }
    } finally { busy = false; }
  }
  if (saved(':replacement')?.pending) { try { await restartDeletedAccount(); return; } catch (err) { root.innerHTML = header() + `<main class="panel"><h2>Finish signing out</h2><p>${e(err.message)}</p><button id="retry-signout" class="primary">Retry</button></main>`; document.querySelector('#retry-signout').onclick = () => location.reload(); return; } }
  try { person = await api('me'); membershipChecked = true; } catch (err) { if (err.status === 401) { membershipChecked = true; forgetTeam(); } }
  renderTeam(); renderComposer(); await refresh();
  if (!person && data) showJoinDialog();
  window.addEventListener('online', refresh);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  setInterval(refresh, 2000);
}
