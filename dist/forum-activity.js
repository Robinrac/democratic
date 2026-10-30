export function newestPosts(posts) {
  return posts.map((post, index) => ({ post, index })).sort((a, b) =>
    (Date.parse(b.post.createdAt) || 0) - (Date.parse(a.post.createdAt) || 0) || b.index - a.index
  ).map(item => item.post);
}
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function profileStats(posts, profileId, profiles) {
  const visible = posts.filter(post => !post.hidden);
  const own = visible.filter(post => post.author.id === profileId);
  const members = new Map(profiles.map(profile => [profile.id, profile.username]));
  const hashtags = new Map(), tagged = new Map();
  for (const post of own) {
    for (const tag of new Set(post.hashtags || [])) hashtags.set(tag, (hashtags.get(tag) || 0) + 1);
    for (const id of new Set(post.mentions || [])) if (id !== profileId && members.has(id)) tagged.set(id, (tagged.get(id) || 0) + 1);
  }
  const rank = (counts, label) => [...counts].map(([id, count]) => ({ id, label: label(id), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)).slice(0, 3);
  return {
    posts: own.filter(post => !post.replyTo).length,
    replies: own.filter(post => post.replyTo).length,
    mentions: visible.filter(post => post.author.id !== profileId && post.mentions?.includes(profileId)).length,
    hashtags: rank(hashtags, id => id), tagged: rank(tagged, id => members.get(id))
  };
}
export function postText(post, profiles) {
  let html = '', offset = 0;
  const tokens = /(?<![\p{L}\p{N}_@])(?:@([\p{L}\p{M}\p{N}]+(?:-[\p{L}\p{M}\p{N}]+)*)(?![\p{L}\p{M}\p{N}_-])|#([\p{L}\p{N}_]{1,32})(?![\p{L}\p{N}_]))/giu;
  for (const match of post.text.matchAll(tokens)) {
    html += escape(post.text.slice(offset, match.index));
    const profile = match[1] && profiles.find(p => p.username.toLowerCase() === match[1].normalize('NFC').toLowerCase() && post.mentions?.includes(p.id));
    html += profile ? `<button class="inline-tag" data-profile="${escape(profile.id)}">${escape(match[0])}</button>`
      : match[2] && post.hashtags?.includes(match[2].toLowerCase()) ? `<button class="inline-tag" data-hashtag="${escape(match[2].toLowerCase())}">${escape(match[0])}</button>` : escape(match[0]);
    offset = match.index + match[0].length;
  }
  return html + escape(post.text.slice(offset));
}
const title = item => item.type === 'published' ? 'You have created this post' : item.type === 'account-post' ? 'A post appeared under your name' : '@' + item.author.username + ' tagged you';

export function createActivity(root, key) {
  const storageKey = key + ':activity-seen';
  let saved; try { saved = JSON.parse(localStorage.getItem(storageKey)); } catch { /* Start with the current visible activity. */ }
  let initialized = Array.isArray(saved), seen = new Set(initialized ? saved : []), queue = [], active = null, timer, signature = '';
  root.insertAdjacentHTML('beforeend', '<aside id="post-toast" class="post-toast" role="status" aria-live="polite" aria-atomic="true" hidden></aside>');
  const toast = document.querySelector('#post-toast');
  const readKey = key + ':notifications-read';
  let read; try { read = new Set(JSON.parse(localStorage.getItem(readKey) || '[]')); } catch { read = new Set(); }
  let mentions = [];
  document.querySelector('#notification-control').innerHTML = '<button id="notifications-button" class="secondary" aria-label="Notifications" aria-haspopup="dialog"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg><span>Notifications</span><b id="notification-count" hidden></b></button>';
  root.insertAdjacentHTML('beforeend', '<dialog id="notifications-dialog" aria-labelledby="notifications-title"><div class="notifications-heading"><h2 id="notifications-title">Notifications</h2><button id="close-notifications" class="secondary" aria-label="Close notifications">×</button></div><div id="notification-list"></div></dialog>');
  const notifications = document.querySelector('#notifications-dialog');
  function renderNotifications() {
    if (notifications.open) { mentions.forEach(item => read.add(item.id)); localStorage.setItem(readKey, JSON.stringify([...read].slice(-2000))); }
    const unread = mentions.filter(item => !read.has(item.id)).length;
    const badge = document.querySelector('#notification-count'); badge.textContent = String(unread); badge.hidden = !unread;
    document.querySelector('#notifications-button').setAttribute('aria-label', unread ? `Notifications, ${unread} unread` : 'Notifications');
    document.querySelector('#notification-list').innerHTML = mentions.slice().reverse().map(item => `<article class="notification-item"><strong>@${escape(item.author.username)} tagged you</strong><p>${escape(item.text)}</p><button class="secondary" data-jump="${escape(item.postId)}">View post</button></article>`).join('') || '<p class="muted">No mentions yet.</p>';
  }
  document.querySelector('#notifications-button').onclick = () => { notifications.showModal(); renderNotifications(); };
  document.querySelector('#close-notifications').onclick = () => notifications.close();
  notifications.addEventListener('click', event => { if (event.target.closest('[data-jump]')) notifications.close(); }, true);

  const save = () => localStorage.setItem(storageKey, JSON.stringify([...seen].slice(-2000)));
  function dismiss() { clearTimeout(timer); active = null; toast.hidden = true; flush(); }
  function flush() {
    if (active || !queue.length || document.querySelector('dialog[open]')) return;
    active = queue.shift();
    toast.innerHTML = `<button class="toast-dismiss" aria-label="Dismiss notification">×</button><strong>${escape(title(active))}</strong><span class="toast-author">@${escape(active.author.username)}</span><p>${escape(active.text)}</p><button class="secondary" data-jump="${escape(active.postId)}">View post</button>`;
    toast.hidden = false;
    toast.querySelector('.toast-dismiss').onclick = dismiss;
    toast.querySelector('[data-jump]').addEventListener('click', () => setTimeout(dismiss, 0));
    timer = setTimeout(dismiss, 10000);
  }
  // Keep the full text available while someone is reading or using the toast.
  toast.onmouseenter = toast.onfocusin = () => clearTimeout(timer);
  toast.onmouseleave = toast.onfocusout = () => { if (active) timer = setTimeout(dismiss, 10000); };
  root.addEventListener('close', flush, true);
  function enqueue(item) { if (!seen.has(item.id)) { seen.add(item.id); queue.push(item); save(); } }
  return {
    published(post) { initialized = true; enqueue({ id: post.id, postId: post.id, type: 'published', author: post.author, text: post.text }); flush(); },
    observe(items = []) {
      mentions = items.filter(item => item.type === 'mention'); renderNotifications();
      const ids = new Set(items.map(item => item.id));
      queue = queue.filter(item => ids.has(item.id));
      if (active && !ids.has(active.id)) { clearTimeout(timer); active = null; toast.hidden = true; }
      if (!initialized) { items.forEach(item => seen.add(item.id)); initialized = true; save(); }
      else items.forEach(enqueue);
      const next = JSON.stringify(items);
      if (next !== signature) {
        signature = next;
        document.querySelector('#activity-history').replaceChildren();
      }
      flush();
    },
    clear() { mentions = []; read.clear(); localStorage.removeItem(readKey); if (notifications.open) notifications.close(); renderNotifications(); clearTimeout(timer); seen.clear(); queue = []; active = null; initialized = false; signature = ''; toast.hidden = true; toast.replaceChildren(); localStorage.removeItem(storageKey); document.querySelector('#activity-history').replaceChildren(); }
  };
}
