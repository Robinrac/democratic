import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { workshop, secret } from './helpers.mjs';
import { associations } from '../workshop/types.mjs';
import { newsImages } from '../workshop/news.mjs';

const leadIds = ['arts-home', 'rural-last-bus', 'sports-fees', 'tech-room', 'student-space', 'climate-concrete'];
const commonIds = ['budget-basics', 'bakery-cat', 'night-walk', 'pastry-swap'];
test('six organization feeds isolate full articles and private editorial notes while sharing a neutral baseline', async t => {
  const w = await workshop(t); await w.login();
  const created = await w.call('host/sessions', { id: randomUUID(), label: 'News rehearsal', kind: 'rehearsal', workshopType: 'workshop-1', expiresAt: Date.now() + 86400000 }, { host: true });
  const sid = created.session.id, tokens = [], feeds = [];
  assert.equal((await w.call('feed', undefined, { sid, token: null })).status, 401);
  assert.equal((await w.call('feed', undefined, { sid, token: null, host: true })).status, 401);
  for (const association of associations) {
    const token = secret(); tokens.push(token);
    assert.equal((await w.call('join', { name: association.name }, { sid, token })).status, 200);
    const response = await w.call('feed?card=6&organization=6&article=climate-concrete', undefined, { sid, token });
    assert.equal(response.status, 200);
    assert.equal(response.news.articles.length, 8);
    assert.equal(response.news.articles[0].id, leadIds[association.card - 1]);
    const articles = response.news.articles; feeds.push(articles);
    assert.equal(new Set(articles.map(a => a.id)).size, 8);
    assert.equal(articles.filter(a => commonIds.includes(a.id)).length, 4);
    for (const item of articles) {
      assert.ok(item.body.length >= 3 && item.body.join(' ').length > 400);
      assert.ok(item.author && item.publisher && item.category && item.title);
      assert.equal(item.audiences, undefined); assert.equal(item.framing, undefined);
    }
    assert.equal(response.news.feeds, undefined); assert.equal(response.voting, undefined);
    assert.deepEqual(response.profiles, []); assert.deepEqual(response.posts, []);
    for (const otherLead of leadIds.filter(id => id !== leadIds[association.card - 1])) assert.ok(!articles.some(a => a.id === otherLead));
  }
  assert.equal(new Set(feeds.flatMap(items => items.map(item => item.id))).size, 28);
  for (const id of commonIds) for (const items of feeds.slice(1)) assert.deepEqual(items.find(item => item.id === id), feeds[0].find(item => item.id === id));
  assert.equal((await w.call('projector', undefined, { sid })).news, undefined);
  assert.equal((await w.call('join-preview', { name: 'Gaming' }, { sid })).news, undefined);
  assert.equal((await w.call('host/state', undefined, { sid, token: tokens[0] })).status, 401);
  for (const file of ['/workshop/news.mjs', '/news.mjs', '/assets/news-media/README.md', '/news-media/unknown.png']) assert.equal((await fetch(w.base + file)).status, 404);
  const host = await w.state(sid);
  assert.equal(host.news.feeds.length, 6);
  assert.match(host.news.fiction, /invented/);
  for (const feed of host.news.feeds) {
    assert.ok(feed.direction); assert.equal(feed.articles.length, 8);
    for (const article of feed.articles) assert.ok(article.framing && article.audiences.includes(feed.card));
  }
  const exported = await w.call('host/export', undefined, { sid, host: true });
  assert.deepEqual(exported.news, host.news);
  assert.equal(exported.credentials, undefined);
  const { sid: secondRoom } = await w.session();
  assert.equal((await w.call('feed', undefined, { sid: secondRoom, token: tokens[0] })).status, 401);
  const w2 = await w.claim(secondRoom);
  assert.equal((await w.call('feed', undefined, { sid: secondRoom, token: w2.token })).news, undefined);
  await w.action(sid, 'end');
  assert.equal((await w.call('feed', undefined, { sid, token: tokens[0] })).news.articles[0].id, 'arts-home');
  const ended = await w.state(sid);
  assert.equal((await w.call('host/reset', { version: ended.version, confirmLabel: ended.label, expiresAt: Date.now() + 86400000 }, { sid, host: true })).status, 200);
  assert.equal((await w.call('feed', undefined, { sid, token: tokens[0] })).status, 401);
});

test('the seven editorial images are local PNG assets and their routes support HEAD', async t => {
  const w = await workshop(t);
  for (const image of Object.values(newsImages)) {
    assert.ok(image.alt.length > 20);
    const response = await fetch(w.base + image.src);
    assert.equal(response.status, 200); assert.equal(response.headers.get('content-type'), 'image/png');
    assert.deepEqual([...new Uint8Array(await response.arrayBuffer()).slice(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    const head = await fetch(w.base + image.src, { method: 'HEAD' });
    assert.equal(head.status, 200); assert.equal(await head.text(), '');
  }
});
