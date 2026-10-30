import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { workshop } from './helpers.mjs';
import { transportCards } from '../workshop/transport.mjs';
import { advanceIncident, incidentPending, setPaused, release } from '../workshop/model.mjs';
import { socialText } from '../workshop/social.mjs';
import { postText } from '../dist/forum-activity.js';

test('saved incident runs once over 160 seconds, pauses, resumes after reload and gates reflection', async t => {
  const w = await workshop(t, { incidentStepMs: 20000 }); await w.login();
  const { sid } = await w.session('rehearsal', 'transport-v1');
  const teams = []; for (let i = 0; i < 7; i++) teams.push(await w.claim(sid, i));
  await w.action(sid, 'debate');
  for (let i = 0; i < 7; i++) await w.call('posts', { text: transportCards[i].suggestedPost, requestId: randomUUID() }, { sid, token: teams[i].token });
  const event = await w.action(sid, 'incident'); assert.equal(event.count, 1); assert.equal(event.scheduledCount, 9);
  let state = await w.server.store.read(sid);
  const start = state.incidentQueue[0].dueAt;
  assert.ok(Math.abs(state.incidentQueue.at(-1).dueAt - start - 160000) < 10);
  assert.equal(incidentPending(state), 8);
  assert.equal((await w.action(sid, 'reflection')).status, 409);
  const publicFeed = await w.call('feed', undefined, { sid, token: teams[1].token });
  assert.equal(publicFeed.incidentQueue, undefined);
  assert.equal(advanceIncident(state, start + 19000), 0);
  assert.equal(advanceIncident(state, start + 21000), 1);
  assert.equal(advanceIncident(state, start + 21000), 0);
  setPaused(state, true, start + 30000);
  assert.equal(advanceIncident(state, start + 90000), 0);
  state = JSON.parse(JSON.stringify(state)); // Persisted state after restart.
  setPaused(state, false, start + 90000);
  assert.equal(advanceIncident(state, start + 99000), 0);
  assert.equal(advanceIncident(state, start + 101000), 1);
  assert.equal(advanceIncident(state, start + 221000), 6);
  assert.equal(advanceIncident(state, start + 300000), 0);
  assert.equal(incidentPending(state), 0);
  assert.equal(new Set(state.incidentQueue.map(item => item.postId)).size, 9);
  release(state, { action: 'reflection', version: state.version, requestId: randomUUID() });
  assert.equal(state.phase, 'reflection');
});

test('Nordic handles tag exact members, including decomposed accents, and render clickable names', () => {
  const roles = ['räk-mackan', 'brunost-bølge', 'skärgårds-säl'].map((username, i) => ({ id: String(i), username, claimed: true }));
  const text = '@RÄK-MACKAN @brunost-bølge @skärgårds-säl'.normalize('NFD');
  const parsed = socialText(text, roles);
  assert.deepEqual(parsed.mentions, ['0', '1', '2']);
  const html = postText({ text, ...parsed }, roles);
  assert.equal((html.match(/data-profile=/g) || []).length, 3);
  assert.deepEqual(socialText('@räk-mackan-extra mail@räk-mackan @skärgårds-säl_', roles).mentions, []);
});
