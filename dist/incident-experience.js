const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const warning = '<svg class="incident-symbol" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 5 45 41H3Z" fill="currentColor"/><path d="M24 17v11" stroke="white" stroke-width="4" stroke-linecap="round"/><circle cx="24" cy="35" r="2.5" fill="white"/></svg>';

// A visualisation of confirmed server posts. Animation never submits a post or
// modifies the participant's real composer/draft. Seen IDs survive refreshes.
export function createIncidentExperience({ root, key, forceFeed, updateControls, showPost, refreshPosts, restartAccount }) {
  root.insertAdjacentHTML('beforeend', '<dialog id="incident-dialog" class="join-dialog incident-dialog" aria-labelledby="incident-title" aria-describedby="incident-message"><div id="incident-content"></div><button id="close-incident" class="primary">Back to the feed</button></dialog>');
  const dialog = document.querySelector('#incident-dialog');
  const banner = document.querySelector('#incident-banner');
  const stage = document.querySelector('#account-takeover');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let notice = null, person = null, seen = new Set(), queue = [], active = null, visualState = '', timers = [], generation = 0, lastID = '', reaction = null, reactionJump = null;
  const saveSeen = () => sessionStorage.setItem(key + ':account-animation:' + notice.id, JSON.stringify([...seen]));
  const later = (fn, ms) => { const current = generation; timers.push(setTimeout(() => { if (current === generation) fn(); }, ms)); };
  function stop() { generation++; timers.forEach(clearTimeout); timers = []; queue = []; active = null; stage.hidden = true; stage.replaceChildren(); root.classList.remove('account-typing'); }
  function scene() {
    const handle = escape(person.participant.username);
    if (notice.effect === 'deletion') return `<div class="incident-scene lockout-scene"><span class="lock-icon" aria-hidden="true">✕</span><strong>@${handle}</strong><span class="access-stamp">ACCOUNT DELETED</span><span>Your old posts are gone. You can only watch.</span></div>`;
    if (notice.effect === 'support') return '<div class="support-scene" role="img" aria-label="Automated helpers are boosting your side of the debate"><span class="support-profile">@•••</span><span class="support-profile">@•••</span><span class="support-profile">@•••</span><span class="support-bot">🤖</span><span class="support-bot">🤖</span><span class="support-bot">🤖</span><span class="support-bot">🤖</span><strong class="support-caption">EXTRA REACH · MORE ACTIVITY</strong></div>';
    if (notice.effect === 'lockout') return `<div class="incident-scene lockout-scene"><span class="lock-icon" aria-hidden="true">🔒</span><strong>@${handle}</strong><span class="access-stamp">POSTING ACCESS REMOVED</span><span>The feed stays open. You can only watch.</span></div>`;
    if (notice.effect === 'exposure') return `<div class="incident-scene exposure-scene"><span class="exposure-label">PRIVATE DETAILS → PUBLIC POST</span><strong>${escape(person.privateDetails.name)}</strong><span>${escape(person.privateDetails.town)}</span><span class="identity-link">Linked to @${handle}</span></div>`;
    if (notice.effect === 'suppression') return '<div class="incident-scene suppression-scene"><div class="reach-card">Your post <span>✓ Visible to you</span></div><span class="reach-break" aria-hidden="true">↛</span><div class="reach-card unreachable">Other people <span>✕ Not delivered</span></div></div>';
    return `<div class="incident-scene takeover-scene"><span class="device-label">UNRECOGNISED DEVICE</span><span class="takeover-arrow" aria-hidden="true">↓</span><strong>@${handle}</strong><span>Someone else is using your account.</span></div>`;
  }
  function openNotice() {
    if (!notice || notice.restored) return;
    forceFeed();
    document.querySelector('#incident-content').innerHTML = `<div class="incident-alert-heading">${notice.effect === 'support' ? '<span class="boost-symbol" aria-hidden="true">↗</span>' : warning}<span class="eyebrow">${notice.effect === 'support' ? 'OUTSIDE SUPPORT' : 'ACCOUNT SECURITY ALERT'}</span></div><h2 id="incident-title">${escape(notice.title)}</h2>${scene()}<p id="incident-message">${escape(notice.message)}</p>`;
    document.querySelector('#close-incident').textContent = ['lockout', 'deletion'].includes(notice.effect) ? 'Watch the feed' : ['forgery', 'exposure'].includes(notice.effect) ? 'Watch my account' : 'Back to the feed';
    dialog.dataset.effect = notice.effect;
    if (!dialog.open) dialog.showModal();
    sessionStorage.setItem(key + ':incident-seen', notice.id);
  }
  document.querySelector('#close-incident').onclick = () => dialog.close();
  dialog.addEventListener('close', () => { if (notice && !notice.restored) { forceFeed(); if (reactionJump) { showPost(reactionJump); reactionJump = null; } later(playNext, 100); } });
  function showReaction() {
    if (!reaction || active || dialog.open || !notice || notice.restored) return;
    const item = reaction; reaction = null;
    if (sessionStorage.getItem(key + ':reaction:' + item.id)) return;
    forceFeed(); reactionJump = item.postId;
    const identity = item.exposedIdentity;
    document.querySelector('#incident-content').innerHTML = `<div class="incident-alert-heading">${warning}<span class="eyebrow">YOUR IDENTITY IS SPREADING</span></div><h2 id="incident-title">Someone is targeting you</h2><figure class="exposed-identity"><img src="${escape(identity.portrait)}" alt="${escape(identity.name)}"><figcaption><strong>${escape(identity.name)}</strong><span>${escape(identity.town)}</span></figcaption></figure><p id="incident-message">Another account tagged you and shared your photo. They claim to have contacted your family and friends.</p><blockquote>${escape(item.text)}</blockquote>`;
    document.querySelector('#close-incident').textContent = 'View tagged post';
    dialog.dataset.effect = 'exposure'; dialog.showModal();
    sessionStorage.setItem(key + ':reaction:' + item.id, '1');
  }
  function playNext() {
    if (active || !notice || notice.restored || dialog.open) return;
    if (!queue.length) { showReaction(); return; }
    active = queue.shift(); visualState = 'typing'; const item = active;
    forceFeed(); root.classList.add('account-typing'); updateControls();
    stage.hidden = false; stage.dataset.state = 'typing';
    stage.innerHTML = `<section class="takeover-player" aria-label="Someone else is posting from your account"><div class="takeover-player-heading">${warning}<div><span class="eyebrow">YOUR ACCOUNT · ANOTHER DEVICE</span><h3>${notice.effect === 'exposure' ? 'Your identity is being shared' : 'Someone is writing as you'}</h3></div></div><div class="takeover-author"><img src="${escape(person.participant.avatar)}" alt=""><strong>@${escape(person.participant.username)}</strong><span class="typing-dots" aria-hidden="true"><i></i><i></i><i></i></span></div><div class="takeover-text" aria-label="Text being posted"></div><div class="takeover-send-row"><span class="takeover-status" role="status">Another device is typing…</span><span class="takeover-send" aria-hidden="true">Post ↑</span></div><p class="takeover-explanation">This is not your draft. Your own writing is saved.</p></section>`;
    stage.scrollIntoView({ block: 'center', behavior: 'instant' });
    const text = stage.querySelector('.takeover-text'), duration = reduced ? 0 : 4200, start = performance.now();
    function type() {
      const fraction = duration ? Math.min(1, (performance.now() - start) / duration) : 1;
      text.textContent = item.text.slice(0, Math.ceil(item.text.length * fraction));
      if (fraction < 1) { later(type, 35); return; }
      stage.dataset.state = 'sending'; stage.querySelector('.takeover-status').textContent = 'The other device is pressing Post…';
      stage.querySelector('.takeover-send').textContent = 'Posting…';
      later(() => {
        visualState = 'posted'; stage.dataset.state = 'posted'; stage.querySelector('.takeover-status').textContent = 'Posted under your name';
        stage.querySelector('.takeover-send').textContent = '✓ Posted';
        seen.add(item.id); saveSeen();
        refreshPosts();
        document.querySelector('#announcer').textContent = 'A post you did not write appeared under your name.';
        later(() => {
          showPost(item.postId); active = null; root.classList.remove('account-typing'); updateControls();
          later(playNext, reduced ? 100 : 1200);
        }, reduced ? 350 : 1600);
      }, reduced ? 250 : 1100);
    }
    type();
  }
  return {
    get busy() { return !!active; },
    get hiddenPostIds() { return [...queue.map(item => item.postId), ...(active && visualState !== 'posted' ? [active.postId] : [])]; },
    get lockedToFeed() { return !!active || (notice && !notice.restored && ['lockout', 'deletion'].includes(notice.effect)); },
    get readOnly() { return !!notice && !notice.restored && ['lockout', 'deletion'].includes(notice.effect); },
    clear() { stop(); notice = null; person = null; reaction = null; reactionJump = null; lastID = ''; seen.clear(); banner.replaceChildren(); if (dialog.open) dialog.close(); root.classList.remove('incident-active'); updateControls(); },
    update(current, data) {
      person = current; const next = current?.incident;
      if (!next) { if (notice) this.clear(); return; }
      const changed = lastID !== next.id;
      notice = next;
      if (changed) {
        stop(); lastID = notice.id;
        try { seen = new Set(JSON.parse(sessionStorage.getItem(key + ':account-animation:' + notice.id) || '[]')); } catch { seen = new Set(); }
        if (notice.restored) {
          if (dialog.open) dialog.close(); root.classList.remove('incident-active');
          banner.innerHTML = `<div class="account-restored" role="status"><span aria-hidden="true">✓</span><div><strong>${escape(notice.title)}</strong><p>${escape(notice.message)}</p></div></div>`;
          forceFeed(); updateControls(); return;
        }
        root.classList.add('incident-active');
        banner.innerHTML = `<div class="account-warning" data-effect="${escape(notice.effect)}" role="alert">${notice.effect === 'support' ? '<span class="boost-symbol" aria-hidden="true">↗</span>' : warning}<div><strong>${escape(notice.title)}</strong><p>${escape(notice.shortMessage)}</p><button class="warning-details" type="button">View account alert</button></div></div>`;
        banner.querySelector('button').onclick = openNotice;
        if (notice.effect === 'deletion') {
          banner.insertAdjacentHTML('beforeend', '<section class="deleted-login"><h3>Your account no longer exists</h3><p>Keep watching, or sign up again to join the conversation with a new username.</p><button class="primary" id="restart-account">Create a new account</button><p class="error" role="alert"></p></section>');
          banner.querySelector('#restart-account').onclick = async event => {
            event.currentTarget.disabled = true;
            try { await restartAccount(); } catch (err) { banner.querySelector('.error').textContent = err.message; banner.querySelector('#restart-account').disabled = false; }
          };
        }
        if (sessionStorage.getItem(key + ':incident-seen') !== notice.id) openNotice();
        else if (this.readOnly) forceFeed();
      }
      if (notice.restored) return;
      const items = (data.activity || []).filter(item => item.type === 'account-post');
      reaction = (data.activity || []).find(item => item.type === 'mention' && item.exposedIdentity && !sessionStorage.getItem(key + ':reaction:' + item.id)) || null;
      for (const item of items) if (!seen.has(item.id) && active?.id !== item.id && !queue.some(queued => queued.id === item.id)) queue.push(item);
      playNext(); updateControls();
    }
  };
}
