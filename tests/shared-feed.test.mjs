import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createWorkshopServer } from '../server.mjs';

async function workshop(t) {
  const server = createWorkshopServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); server.close(); });
  const base = 'http://127.0.0.1:' + server.address().port;
  return async (route, body, token, origin) => {
    const response = await fetch(base + '/api/' + route, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type':'application/json', ...(token ? { Authorization:'Bearer ' + token } : {}), ...(origin ? { Origin:origin } : {}) },
      ...(body === undefined ? {} : { body:JSON.stringify(body) })
    });
    return { status:response.status, ...await response.json() };
  };
}

test('independent participants receive unique identities and share posts with server-assigned authors', async t => {
  const call = await workshop(t);
  const a = await call('join', {});
  const b = await call('join', {});
  assert.equal(a.status, 201);
  assert.notEqual(a.participant.name, b.participant.name);
  assert.notEqual(a.participant.cover, b.participant.cover);
  const post = await call('posts', { text:'My voice matters.', requestId:'test-request-001', author:b.participant }, a.token);
  assert.equal(post.post.author.id, a.participant.id);
  const feed = await call('feed', undefined, b.token);
  assert.equal(feed.posts[0].text, 'My voice matters.');
  assert.equal(feed.posts[0].author.name, a.participant.name);
  assert.equal(feed.participants, 2);
  assert.equal(feed.posts[0].requestId, undefined);
  assert.equal(JSON.stringify(feed).includes(a.token), false);
  assert.deepEqual((await call('me', undefined, a.token)).participant, a.participant);
  assert.equal((await call('join', {}, a.token)).participant.name, a.participant.name);
  assert.equal((await call('feed')).participants, 2);
});

test('posting requires a valid session and validates content without interpreting markup', async t => {
  const call = await workshop(t);
  assert.equal((await call('posts', {text:'Hello',requestId:'test-request-001'})).status, 401);
  const user = await call('join', {});
  for (const text of ['', '   ', 'x'.repeat(501), null]) {
    assert.equal((await call('posts', {text,requestId:'test-request-002'}, user.token)).status, 400);
  }
  const content = '<img src=x onerror=alert(1)> & hello';
  assert.equal((await call('posts', {text:content,requestId:'test-request-003'}, user.token)).status, 201);
  assert.equal((await call('feed')).posts[0].text, content);
  assert.equal((await call('posts', {text:'hello',requestId:'test-request-004'}, user.token, 'https://unrelated.example')).status, 403);
  assert.equal((await call('me', undefined, 'invalid-token')).status, 401);
});

test('a retry cannot publish a duplicate; another participant can reuse its own request id', async t => {
  const call = await workshop(t);
  const a = await call('join', {});
  const b = await call('join', {});
  const data = {text:'One thought.',requestId:'test-request-005'};
  const first = await call('posts', data, a.token);
  const retry = await call('posts', data, a.token);
  assert.equal(first.post.id, retry.post.id);
  await call('posts', data, b.token);
  assert.equal((await call('feed')).posts.length, 2);
});

test('restarting the workshop clears posts and invalidates previous identities', async t => {
  const first = await workshop(t);
  const user = await first('join', {});
  await first('posts', {text:'Temporary.',requestId:'test-request-006'}, user.token);
  const restarted = await workshop(t);
  assert.equal((await restarted('me', undefined, user.token)).status, 401);
  assert.equal((await restarted('feed')).posts.length, 0);
  assert.equal((await restarted('feed')).participants, 0);
});

test('profile edits are shared, ownership is enforced and profile timelines include only their author', async t => {
  const call = await workshop(t);
  const a = await call('join', {});
  const b = await call('join', {});
  await call('posts', {text:'A voice.',requestId:'profile-post-a'}, a.token);
  await call('posts', {text:'Another voice.',requestId:'profile-post-b'}, b.token);
  const update = { bio:'Exploring ideas together.', color:4, cover:6, id:b.participant.id, name:'Changed name' };
  assert.equal((await call('profile', update)).status, 401);
  const edited = await call('profile', update, a.token);
  assert.equal(edited.participant.id, a.participant.id);
  assert.equal(edited.participant.name, a.participant.name);
  assert.equal((await call('me', undefined, b.token)).participant.bio, b.participant.bio);
  const profile = await call('profile?id=' + a.participant.id, undefined, b.token);
  assert.equal(profile.profile.bio, update.bio);
  assert.equal(profile.profile.cover, 6);
  assert.equal(profile.postCount, 1);
  assert.equal(profile.posts[0].text, 'A voice.');
  assert.equal(profile.posts[0].author.color, 4);
  assert.equal((await call('feed')).profiles.find(person => person.id === a.participant.id).bio, update.bio);
  assert.equal((await call('profile', {...update,bio:'x'.repeat(161)},a.token)).status, 400);
  assert.equal((await call('profile', {...update,color:8},a.token)).status, 400);
  assert.equal((await call('profile?id=missing')).status, 404);
});
