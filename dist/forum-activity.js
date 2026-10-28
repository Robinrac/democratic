const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function postText(post, profiles) {
  let html = '', offset = 0;
  const tokens = /(?<![\p{L}\p{N}_@])(?:@([a-z0-9]+(?:-[a-z0-9]+)*)(?![\w-])|#([\p{L}\p{N}_]{1,32})(?![\p{L}\p{N}_]))/giu;
  for (const match of post.text.matchAll(tokens)) {
    html += escape(post.text.slice(offset, match.index));
    const profile = match[1] && profiles.find(p => p.username.toLowerCase() === match[1].toLowerCase() && post.mentions?.includes(p.id));
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
      const ids = new Set(items.map(item => item.id));
      queue = queue.filter(item => ids.has(item.id));
      if (active && !ids.has(active.id)) { clearTimeout(timer); active = null; toast.hidden = true; }
      if (!initialized) { items.forEach(item => seen.add(item.id)); initialized = true; save(); }
      else items.forEach(enqueue);
      const next = JSON.stringify(items);
      if (next !== signature) {
        signature = next;
        const history = document.querySelector('#activity-history');
        const opened = history.querySelector('details')?.open;
        history.innerHTML = `<details ${opened ? 'open' : ''}><summary>Activity · ${items.length}</summary><div class="activity-list">${items.slice().reverse().map(item => `<article><strong>${escape(title(item))}</strong><p>${escape(item.text)}</p><button class="secondary" data-jump="${escape(item.postId)}">View post</button></article>`).join('') || '<p>Your posts, account activity and @mentions will appear here.</p>'}</div></details>`;
      }
      flush();
    },
    clear() { clearTimeout(timer); seen.clear(); queue = []; active = null; initialized = false; signature = ''; toast.hidden = true; toast.replaceChildren(); localStorage.removeItem(storageKey); document.querySelector('#activity-history').replaceChildren(); }
  };
}
