import { e } from './open-circle.js';

const groups = {
  all: { label: 'All stories', categories: null },
  reporting: { label: 'Reporting', categories: ['Reporting', 'Analysis', 'Explainer', 'Interview'] },
  opinion: { label: 'Opinion & debate', categories: ['Opinion', 'Debate'] },
  community: { label: 'Around town', categories: ['Community', 'Culture'] }
};
const budgetGraphic = () => `<figure class="news-budget" aria-label="Proposed share of the youth budget: 80 percent for the center and 20 percent for other uses, for five years"><div class="news-budget-bar" aria-hidden="true"><span>80%</span><span>20%</span></div><figcaption><span><strong>Center proposal</strong>80% of the youth budget</span><span><strong>Other uses</strong>20% remaining</span></figcaption><p>A five-year commitment. Not the municipality’s entire budget.</p></figure>`;
const photo = (item, eager = false) => item.image ? `<img class="news-photo" src="${e(item.image.src)}" alt="${e(item.image.alt)}" width="1672" height="941" loading="${eager ? 'eager' : 'lazy'}" decoding="async">` : '';
const meta = item => `<span class="news-category">${e(item.category)}</span><span>${e(item.publisher)}</span><span class="news-time">${e(item.time)}</span>`;

export function setupNews({ root, api }) {
  const section = root.querySelector('#news');
  root.insertAdjacentHTML('beforeend', `<dialog id="news-reader" class="news-reader" aria-labelledby="news-article-title"><div class="news-reader-toolbar"><span>Circle News<span class="news-brand-dot">.</span></span><button type="button" id="close-news-reader" class="secondary" autofocus>Close story <span aria-hidden="true">×</span></button></div><article id="news-article"></article></dialog>`);
  const reader = root.querySelector('#news-reader'), article = root.querySelector('#news-article');
  let card = null, sequence = 0, loading = false, loaded = false, stories = [], filter = 'all', opener = null;
  root.querySelector('#close-news-reader').onclick = () => reader.close();
  reader.addEventListener('close', () => { if (opener?.isConnected) opener.focus({ preventScroll: true }); });
  function showStory(id, button) {
    const item = stories.find(story => story.id === id);
    if (!item) return;
    opener = button;
    article.innerHTML = `<div class="news-reader-heading"><div class="news-meta">${meta(item)}</div><h1 id="news-article-title">${e(item.title)}</h1><p class="news-deck">${e(item.summary)}</p><p class="news-byline">By ${e(item.author)} · ${item.readMinutes} min read</p></div>${photo(item, true)}<div class="news-prose">${item.graphic === 'budget' ? budgetGraphic() : ''}${item.body.map(paragraph => `<p>${e(paragraph)}</p>`).join('')}<p class="news-endmark" aria-hidden="true">●</p></div>`;
    reader.showModal(); reader.scrollTop = 0;
  }
  function storyCard(item, index) {
    const opinion = ['Opinion', 'Debate'].includes(item.category);
    const compact = filter === 'all' && index > 0 && item.category === 'Community';
    return `<article class="news-card${index === 0 && filter === 'all' ? ' news-lead' : ''}${opinion ? ' news-opinion' : ''}${compact ? ' news-compact' : ''}" data-news-id="${e(item.id)}"><div class="news-meta">${meta(item)}</div>${photo(item, index === 0)}<div class="news-card-copy">${item.quote ? `<p class="news-pullquote">“${e(item.quote.replaceAll('“', '').replaceAll('”', ''))}”</p>` : ''}<h2><button class="news-title" data-open-story="${e(item.id)}">${e(item.title)}</button></h2><p class="news-deck">${e(item.summary)}</p>${item.graphic === 'budget' ? budgetGraphic() : ''}<p class="news-byline">${e(item.author)}</p><div class="news-card-footer"><span>${item.readMinutes} min read</span><button class="news-read" data-open-story="${e(item.id)}" aria-label="Read story: ${e(item.title)}">Read story <span aria-hidden="true">↗</span></button></div></div></article>`;
  }
  function renderStories() {
    const visible = stories.filter(item => !groups[filter].categories || groups[filter].categories.includes(item.category));
    section.querySelector('#news-stories').innerHTML = visible.map(storyCard).join('');
    section.querySelector('#news-count').textContent = `${visible.length} ${visible.length === 1 ? 'story' : 'stories'}`;
    section.querySelectorAll('[data-news-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.newsFilter === filter)));
  }
  section.addEventListener('click', event => {
    const tab = event.target.closest('[data-news-filter]');
    if (tab) { filter = tab.dataset.newsFilter; renderStories(); }
    const button = event.target.closest('[data-open-story]');
    if (button) showStory(button.dataset.openStory, button);
  });
  function render() {
    section.innerHTML = `<div class="news-edition"><span><span class="news-edition-dot" aria-hidden="true"></span> THE LINDVIK EDITION</span><span>Morning briefing</span></div><div class="news-filter-row"><div class="news-filters" role="group" aria-label="Filter news stories">${Object.entries(groups).map(([id, group]) => `<button type="button" data-news-filter="${id}" aria-pressed="${id === filter}">${e(group.label)}</button>`).join('')}</div><span id="news-count" role="status" aria-live="polite"></span></div><div id="news-stories"></div><footer class="news-colophon"><strong>Circle News.</strong><p>You’re all caught up with this edition.</p><details><summary>About this edition</summary><p>Lindvik is a fictional workshop setting. These stories, publishers, people and quotes were created for the exercise. Images are generated illustrations of the stories, not photographs of actual events.</p></details></footer>`;
    renderStories();
  }
  return {
    async update(person) {
      const nextCard = person?.association.card || null;
      if (nextCard !== card) {
        card = nextCard; sequence++; loaded = false; loading = false; stories = []; filter = 'all';
        opener = null; if (reader.open) reader.close(); article.innerHTML = '';
        section.innerHTML = '<p class="muted">Join your organization to read your news feed.</p>';
      }
      if (!card || loaded || loading) return;
      const current = sequence;
      loading = true; section.innerHTML = '<p class="news-loading" role="status">Opening your news feed…</p>';
      try {
        const result = await api('feed');
        if (sequence !== current) return;
        stories = result.news.articles; loaded = true; render();
      } catch (error) {
        if (sequence === current) section.innerHTML = `<p class="news-loading" role="status">${e(error.message)} Your news feed will retry when connected.</p>`;
      } finally { if (sequence === current) loading = false; }
    }
  };
}
