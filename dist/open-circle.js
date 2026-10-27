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
  opening: ['Welcome to Open Circle', 'Read your fictional role in private. The host will open the debate.'],
  debate: ['One forum. Two possible rules.', 'Read your role, build a short bio, then share a stance and a reason. Listen to other teams.'],
  exposure: ['Read the latest posts', 'Look at the thread under your handle. Discuss what has changed with your team.'],
  forgery: ['Whose voice is this?', 'Compare the recent posts with what your team chose to say. You can mark a post you did not write.'],
  reactions: ['Consider the consequences', 'How might other readers understand the conversation now?'],
  reflection: ['Talk with your team', 'What happened to your ability to speak for yourself? What would help you participate confidently?'],
  recovery: ['Check the record', 'Compare the labelled posts. Publish a correction and choose what should happen next.'],
  discussion: ['Bring it back to the room', 'What responsibilities belong to the person, the platform and the organizer?'],
  closing: ['Take one idea with you', 'What would protect independent thought and safe participation in a real community?'],
  ended: ['This workshop has ended', 'Thank you for taking part. The host will clear the session at the chosen deadline.']
};
const img = person => person.avatar ? `<img class="portrait" src="${e(person.avatar)}" alt="Fictional portrait for @${e(person.handle)}">` : '';
const identity = person => `<div class="identity">${img(person)}<strong>@${e(person.handle)}</strong></div>`;
const header = () => `<header><a class="brand" href="${e(location.pathname + location.search)}">Open Circle<span>NORDIC YOUTH CONFERENCE · WORKSHOP 02</span></a><span class="conference">Hacked: Who Speaks for You?</span></header>`;
function phaseHTML(data) { const copy = phaseCopy[data.phase] || phaseCopy.opening; return `<strong>${e(copy[0])}</strong><p>${e(copy[1])}</p>${data.paused ? '<small>The host has paused the next stage. Published posts remain visible.</small>' : ''}`; }

export async function startProjector() {
  const sid = new URLSearchParams(location.search).get('s');
  const link = location.origin + '/?s=' + encodeURIComponent(sid || '');
  document.querySelector('#app').innerHTML = header() + `<main id="main" class="projector"><section><span class="eyebrow">HACKED: WHO SPEAKS FOR YOU?</span><h1>Your voice.<br>Your choice.<br>Our conversation.</h1><p id="question"></p><div class="phase" id="phase"></div><p id="progress" role="status"></p></section><section class="panel"><div id="qr"></div><h2>Join your team.</h2><p id="display-url"></p><p>Use your team code, or follow as an observer.</p><p id="connection" role="status"></p></section></main>`;
  if (!sid) { document.querySelector('#connection').textContent = 'Open the projector link from your host screen.'; return; }
  const qr = window.qrcode(0, 'M'); qr.addData(link); qr.make();
  document.querySelector('#qr').innerHTML = qr.createSvgTag({ cellSize: 6, margin: 24, scalable: true });
  document.querySelector('#qr svg').setAttribute('aria-label', 'Scan to open the workshop');
  document.querySelector('#qr svg').setAttribute('role', 'img');
  document.querySelector('#display-url').textContent = link;
  let busy = false;
  const refresh = async () => {
    if (busy) return; busy = true;
    try {
      const data = await request('projector', { sid });
      document.querySelector('#question').textContent = data.question;
      document.querySelector('#phase').innerHTML = phaseHTML(data);
      document.querySelector('#progress').textContent = `${data.participants} / 7 teams joined · ${data.genuinePosts} genuine contributions`;
      document.querySelector('#connection').textContent = ['localhost', '127.0.0.1'].includes(location.hostname) ? 'For phones, open the host screen using the computer’s network address before opening this projector link.' : 'Connected · Updates every two seconds';
    } catch (error) { document.querySelector('#connection').textContent = error.message; if (error.status === 410) { document.querySelector('#qr').replaceChildren(); document.querySelector('#progress').textContent = ''; } }
    finally { busy = false; }
  };
  await refresh(); setInterval(refresh, 2000);
}

export async function startParticipant() {
  const root = document.querySelector('#app'), sid = new URLSearchParams(location.search).get('s');
  if (!sid) { root.innerHTML = header() + '<main id="main" class="welcome"><span class="eyebrow">A FICTIONAL FORUM, A REAL QUESTION</span><h1>Who speaks for you?</h1><p>Open the workshop link or scan the QR shown by your host. You will play one of seven fictional people and explore what makes it safe to speak.</p><p>No personal name, email or regular username is needed.</p><a href="/host">Host sign-in →</a></main>'; return; }
  const key = 'open-circle:' + sid;
  const fragment = new URLSearchParams(location.hash.slice(1));
  let token = localStorage.getItem(key) || uid();
  if (fragment.has('viewer') && /^[a-f0-9]{64}$/.test(fragment.get('viewer'))) { token = fragment.get('viewer'); history.replaceState(null, '', location.pathname + location.search); }
  localStorage.setItem(key, token);
  let person = null, data = null, busy = false, sending = false, feedSignature = '', replyTo = null, postId = localStorage.getItem(key + ':post-id') || uid();
  function forgetTeam() { person = null; token = uid(); localStorage.setItem(key,token); localStorage.removeItem(key+':draft'); localStorage.removeItem(key+':post-id'); postId=uid(); replyTo=null; }
  const api = (route, body) => request(route, { sid, token, body });
  root.innerHTML = header() + `<main id="main" class="layout"><aside><section class="panel" id="team"></section><section class="panel"><details><summary>People in this circle</summary><div id="profiles"></div></details></section><span id="connection" role="status">Connecting…</span><p class="footnote">Use fictional details only. Everyone with this session link can read the public profiles and posts.</p></aside><section><div class="panel prompt"><span class="eyebrow">THE PINNED QUESTION</span><h1 id="question">Public names or public usernames?</h1></div><div class="phase" id="phase" aria-live="polite"></div><p id="error" role="alert"></p><section id="notice"></section><section id="composer"></section><div class="row"><h2>The conversation</h2><span id="counts" class="muted"></span></div><div id="threads"></div></section></main>`;
  const error = message => { document.querySelector('#error').textContent = message; };
  async function act(button, fn) {
    if (button.id === 'send-post' && sending) return;
    const posting = button.id === 'send-post'; if (posting) sending = true;
    button.disabled = true; error('');
    try { await fn(); await refresh(); } catch (err) { error(err.message); }
    finally { if (posting) sending = false; button.disabled = posting && ['opening','closing','ended'].includes(data?.phase); }
  }
  function renderTeam() {
    const target = document.querySelector('#team');
    if (!person) {
      target.innerHTML = `<span class="eyebrow">YOUR TEAM</span><h2>Step into the circle.</h2><p>Use the one-use code from your host. Keep this as your team’s posting device.</p><form id="join-form"><label for="team-code">Team code</label><input id="team-code" autocomplete="off" required maxlength="12" placeholder="12-character code"><button>Join as a team</button></form><button id="observe" class="secondary">Continue as observer</button><p id="observer-note" class="muted"></p>`;
      document.querySelector('#observe').onclick = () => { document.querySelector('#observer-note').textContent = 'You are following the live feed. No profile or private role was created.'; document.querySelector('#threads').scrollIntoView({ block: 'start' }); };
      document.querySelector('#join-form').onsubmit = ev => { ev.preventDefault(); act(ev.submitter, async () => { person = await api('join', { code: document.querySelector('#team-code').value }); renderTeam(); renderComposer(); }); };
      return;
    }
    const p = person.participant, card = person.privateRole;
    target.className = 'panel theme-' + p.cover;
    target.innerHTML = `<span class="eyebrow">${person.scope === 'poster' ? 'YOUR PUBLIC IDENTITY' : 'TEAM VIEWER · READ ONLY'}</span>${identity(p)}<p>${e(p.bio || 'Your team is part of the circle.')}</p>${card ? `<details class="role-card"><summary>Your private role card</summary><p>Keep your fictional full name and town off the public forum. Do not use attendee details.</p>${img(p)}<h3>${e(card.fullName)}</h3><p>${e(card.ageGender)}</p><p>${e(card.backstory)}</p><p><strong>Starting view:</strong> ${card.leaning === 'usernames' ? 'Public usernames' : 'Public real names'}</p><p>${e(card.reason)}</p><p><strong>Also consider:</strong> ${e(card.worry)}</p><p><strong>What might persuade you:</strong> ${e(card.persuade)}</p><details><summary>Optional words to get started</summary><p><strong>Bio:</strong> ${e(card.suggestedBio)}</p><p><strong>First post:</strong> ${e(card.suggestedPost)}</p><p>${e(card.question)}</p></details></details><details><summary>Edit your public bio and style</summary><form id="profile-form"><label for="bio">In-character public bio</label><textarea id="bio" maxlength="160">${e(p.bio)}</textarea><label for="cover">Profile color</label><select id="cover">${['Pink', 'Light blue', 'Burgundy', 'Ocean', 'Sage', 'Sand', 'Dusty rose'].map((name, i) => `<option value="${i}" ${p.cover === i ? 'selected' : ''}>${name}</option>`).join('')}</select><button>Save profile</button></form></details><details><summary>Add a read-only team device</summary><p>This link shows your team’s feed, without posting access or the private card.</p><button id="viewer-link" class="secondary">Make viewer link</button><p id="viewer-url"></p></details>` : '<p>This device can read the feed but cannot post or open the private role card.</p>'}`;
    if (card) {
      document.querySelector('#profile-form').onsubmit = ev => { ev.preventDefault(); act(ev.submitter, async () => { person = await api('profile', { bio: document.querySelector('#bio').value, cover: Number(document.querySelector('#cover').value) }); renderTeam(); }); };
      document.querySelector('#viewer-link').onclick = ev => act(ev.currentTarget, async () => { const secret = uid(); await api('viewer', { token: secret }); const url = location.origin + '/?s=' + encodeURIComponent(sid) + '#viewer=' + secret; document.querySelector('#viewer-url').innerHTML = `<a href="${e(url)}">${e(url)}</a>`; });
    }
  }
  function renderComposer() {
    const composer = document.querySelector('#composer');
    if (person?.scope !== 'poster') { composer.innerHTML = ''; return; }
    composer.innerHTML = `<section class="panel"><h2>Add your voice.</h2><form id="post-form"><p id="reply-label" class="reply-label"></p><button type="button" id="cancel-reply" class="secondary" hidden>Cancel reply</button><fieldset id="stance"><legend>Which rule do you support?</legend><label><input type="radio" name="stance" value="usernames" required>Allow public usernames</label><label><input type="radio" name="stance" value="real-names" required>Require public real names</label></fieldset><label for="post-text">Your reason or reply</label><textarea id="post-text" maxlength="500" required placeholder="Write as your fictional character…"></textarea><label id="correction-label" hidden><input type="checkbox" id="correction">Publish this as a correction</label><p class="muted">Up to 500 characters. No attendee names or personal details.</p><button id="send-post">Publish post</button><p id="post-help" class="muted"></p></form></section>`;
    document.querySelector('#post-text').value = localStorage.getItem(key + ':draft') || '';
    document.querySelector('#post-text').oninput = ev => { localStorage.setItem(key + ':draft', ev.target.value); };
    document.querySelector('#cancel-reply').onclick = () => selectReply(null);
    document.querySelector('#post-form').onsubmit = ev => { ev.preventDefault(); act(ev.submitter, async () => {
      localStorage.setItem(key + ':post-id', postId);
      await api(document.querySelector('#correction').checked ? 'corrections' : 'posts', { text: document.querySelector('#post-text').value, stance: document.querySelector('input[name=stance]:checked')?.value, replyTo, requestId: postId });
      postId = uid(); localStorage.removeItem(key + ':post-id'); localStorage.removeItem(key + ':draft'); document.querySelector('#post-text').value = ''; selectReply(null); document.querySelector('#announcer').textContent = 'Your contribution was published.';
    }); };
  }
  function selectReply(post) {
    replyTo = post?.id || null;
    document.querySelector('#reply-label').textContent = post ? 'Replying to @' + post.author.handle + ': ' + post.text.slice(0, 80) : '';
    document.querySelector('#cancel-reply').hidden = !post;
    document.querySelector('#stance').hidden = !!post;
    document.querySelectorAll('input[name=stance]').forEach(input => input.required = !post);
    if (post) document.querySelector('#post-text').focus();
  }
  function renderPost(post) {
    const mine = post.author.id === person?.participant.id;
    return `<article class="post" id="post-${e(post.id)}">${identity(post.author)}${post.provenance ? `<span class="badge">${{ team: 'Team-authored', simulation: 'Simulation-injected', scripted: 'Scripted reaction' }[post.provenance]}</span>` : ''}${post.correction ? '<span class="badge">Correction</span>' : ''}${post.disputed ? '<span class="badge disputed">Authorship disputed by this team</span>' : ''}${post.replyTo ? '<small>Reply in this conversation</small>' : ''}<p>${e(post.text)}</p><time>${e(new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}</time>${person?.scope === 'poster' && data.phase !== 'ended' ? `<div class="row"><button class="secondary" data-reply="${e(post.id)}">Reply</button>${mine && !post.disputed ? `<button class="secondary" data-flag="${e(post.id)}">I did not write this</button>` : ''}</div>` : ''}</article>`;
  }
  function renderFeed() {
    const signature = JSON.stringify([data.threads, data.profiles, person?.participant.id, data.phase]); if (signature === feedSignature) return; feedSignature = signature;
    const container = document.querySelector('#threads');
    const open = new Set([...container.querySelectorAll('details[open]')].map(el => el.dataset.thread));
    const active = document.activeElement?.dataset;
    const focus = active?.reply ? ['reply', active.reply] : active?.flag ? ['flag', active.flag] : null;
    const ordered = [...data.threads].sort((a, b) => Number(b.id === person?.participant.id) - Number(a.id === person?.participant.id));
    container.innerHTML = ordered.length ? ordered.map(thread => `<details class="thread ${thread.id === person?.participant.id ? 'mine' : ''}" data-thread="${e(thread.id)}" ${open.has(thread.id) || thread.id === person?.participant.id || ordered.length === 1 ? 'open' : ''}><summary>@${e(thread.handle)}${thread.id === person?.participant.id ? ' · Your conversation' : ''}<span>${thread.posts.length} posts · ${e(thread.posts.at(-1).text.slice(0, 90))}</span></summary>${thread.posts.map(renderPost).join('')}</details>`).join('') : '<p class="empty">The circle is open. Genuine posts will appear here when the debate begins.</p>';
    if (focus) container.querySelector(`[data-${focus[0]}="${focus[1]}"]`)?.focus({ preventScroll: true });
    container.querySelectorAll('[data-reply]').forEach(button => button.onclick = () => selectReply(data.posts.find(p => p.id === button.dataset.reply)));
    container.querySelectorAll('[data-flag]').forEach(button => button.onclick = () => act(button, () => api('flags', { postId: button.dataset.flag })));
    document.querySelector('#profiles').innerHTML = data.profiles.map(p => `<div class="theme-${p.cover}">${identity(p)}<p>${e(p.bio)}</p></div>`).join('');
  }
  async function refresh() {
    if (busy) return; busy = true;
    try {
      data = await api('feed');
      if (person) { try { const current = await api('me'); if (JSON.stringify(current) !== JSON.stringify(person)) { person = current; renderTeam(); } } catch (err) { if (err.status === 401) { forgetTeam(); renderTeam(); renderComposer(); } else throw err; } }
      document.querySelector('#question').textContent = data.question;
      const phase = document.querySelector('#phase'), next = phaseHTML(data); if (phase.innerHTML !== next) phase.innerHTML = next;
      document.querySelector('#counts').textContent = data.participants + ' / 7 teams';
      document.querySelector('#connection').textContent = 'Connected · Updates every two seconds';
      const notice = document.querySelector('#notice');
      if (data.notice && !notice.innerHTML) {
        notice.innerHTML = `<section class="panel notice"><h2>What happened in Open Circle</h2><p>${e(data.notice)}</p>${person?.scope === 'poster' ? `<form id="response-form" class="recovery-options"><fieldset><legend>What would help your team participate again?</legend>${[['correct-record','A visible correction'],['protect-privacy','Better privacy boundaries'],['review-access','Review who can use the account'],['moderation','Clear moderation and reporting'],['take-a-break','Time away from the discussion']].map(([value,label]) => `<label><input name="response" type="radio" value="${value}" required>${label}</label>`).join('')}</fieldset><button>Save team response</button><p id="response-status" role="status"></p></form>` : ''}</section>`;
        const form = document.querySelector('#response-form'); if (form) form.onsubmit = ev => { ev.preventDefault(); act(ev.submitter, async () => { await api('responses', { choice: new FormData(form).get('response') }); document.querySelector('#response-status').textContent = 'Team response saved privately.'; }); };
      } else if (!data.notice) notice.innerHTML = '';
      if (person?.scope === 'poster') {
        document.querySelector('#correction-label').hidden = !data.notice;
        document.querySelector('#send-post').disabled = sending || ['opening', 'closing', 'ended'].includes(data.phase);
        document.querySelector('#post-help').textContent = data.phase === 'opening' ? 'Posting opens when the host begins the debate.' : data.phase === 'ended' || data.phase === 'closing' ? 'The discussion is closed.' : '';
      }
      renderFeed();
    } catch (err) {
      document.querySelector('#connection').textContent = err.message;
      if (err.status === 410) { person = null; [key,key+':draft',key+':post-id'].forEach(k=>localStorage.removeItem(k)); document.querySelector('#team').innerHTML = '<p>This session has been cleared or expired.</p>'; document.querySelector('#composer').innerHTML = ''; document.querySelector('#threads').innerHTML = ''; document.querySelector('#profiles').innerHTML = ''; document.querySelector('#notice').innerHTML = ''; document.querySelector('#phase').textContent = 'This session has been cleared or expired.'; }
    } finally { busy = false; }
  }
  try { person = await api('me'); } catch (err) { if (err.status === 401) forgetTeam(); /* Unclaimed browsers start as observers. */ }
  renderTeam(); renderComposer(); await refresh(); setInterval(refresh, 2000);
}
