import { test, expect } from '@playwright/test';
import { randomBytes, randomUUID } from 'node:crypto';
import { roleCards } from '../../workshop/roles.mjs';

test('profile browsing, reply drafts, interrupted sends and offline recovery work across reloads', async ({ browser, request }, info) => {
  await request.post('/api/host/login', { data: { password: 'browser-test-host-password-only' } });
  const sid = randomUUID();
  await request.post('/api/host/sessions', { data: { id: sid, label: 'Conversation resilience', scenario: 'legacy', kind: 'rehearsal', expiresAt: Date.now() + 86400000 } });
  const tokens = [0, 1].map(() => randomBytes(32).toString('hex'));
  const members = [];
  for (let i = 0; i < 2; i++) {
    const response = await request.post('/api/join?s=' + sid, { headers: { Authorization: 'Bearer ' + tokens[i] }, data: { name: roleCards[i].fullName, town: roleCards[i].town, bio: 'A member who likes listening.', color: i, cover: i } });
    members.push((await response.json()).participant);
  }
  async function release(action) {
    const state = await (await request.get('/api/host/state?s=' + sid)).json();
    const result = await request.post('/api/host/action?s=' + sid, { data: { action, version: state.version, requestId: randomUUID() } });
    expect(result.ok()).toBeTruthy();
  }
  await release('debate');
  const first = await (await request.post('/api/posts?s=' + sid, { headers: { Authorization: 'Bearer ' + tokens[1] }, data: { text: 'What makes a conversation welcoming?', stance: 'real-names', requestId: randomUUID() } })).json();
  const context = await browser.newContext({ viewport: { width: 360, height: 800 }, reducedMotion: 'reduce' });
  const page = await context.newPage(); const errors = []; page.on('pageerror', error => errors.push(error.message));
  await context.addInitScript(({ sid, token }) => localStorage.setItem('open-circle:' + sid, token), { sid, token: tokens[0] });
  await page.goto('/?s=' + sid);
  await page.getByRole('button', { name: 'Reply', exact: true }).click();
  await page.getByLabel('Your reason or reply').fill('Listening without judging helps.');
  await page.reload();
  await expect(page.locator('#reply-label')).toContainText(members[1].username);
  await expect(page.locator('#stance')).toBeHidden();
  await expect(page.getByLabel('Your reason or reply')).toHaveValue('Listening without judging helps.');
  await page.getByRole('button', { name: 'Edit profile', exact: true }).click();
  await page.locator('#profile-form').getByLabel('Bio', { exact: true }).fill('Listening first.');
  await page.getByRole('button', { name: 'Save profile', exact: true }).click();
  await expect(page.locator('#profile-dialog')).not.toBeVisible();
  await expect(page.locator('#reply-label')).toContainText(members[1].username);
  await expect(page.getByLabel('Your reason or reply')).toHaveValue('Listening without judging helps.');
  await page.locator('#threads').getByRole('button', { name: '@' + members[1].username, exact: true }).click();
  await expect(page.locator('#member-dialog')).toBeVisible();
  await expect(page.locator('#member-dialog')).not.toContainText(roleCards[1].fullName);
  await expect(page.locator('#member-dialog')).toContainText('What makes a conversation welcoming?');
  expect(await page.locator('#member-dialog').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('public-profile-phone.png') });
  await page.getByRole('button', { name: 'View conversation', exact: true }).click();
  await expect(page.locator('#member-dialog')).not.toBeVisible();
  await expect(page.locator('#post-' + first.post.id)).toBeFocused();
  // Fail before commit, then reload with the immutable send still saved locally.
  await page.route('**/api/posts?*', route => route.abort('failed'));
  await page.getByRole('button', { name: 'Publish post' }).click();
  await expect(page.getByRole('button', { name: 'Retry publish' })).toBeEnabled();
  await expect(page.getByLabel('Your reason or reply')).toBeDisabled();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Retry publish' })).toBeEnabled();
  await page.unroute('**/api/posts?*');
  await page.getByRole('button', { name: 'Retry publish' }).click();
  await expect(page.locator('#threads .post')).toHaveCount(2);
  await expect(page.locator('#counter')).toHaveText('0 / 500');
  const feed = await (await request.get('/api/feed?s=' + sid, { headers: { Authorization: 'Bearer ' + tokens[0] } })).json();
  expect(feed.posts[1].replyTo).toBe(first.post.id);
  expect(feed.posts[1].threadId).toBe(members[1].id);
  await expect(page.locator('#threads .reply-context')).toContainText('What makes a conversation welcoming?');
  // The server commits, but the response disappears. A receipt must resolve it
  // after reload without producing a duplicate or clearing a different draft.
  await page.getByLabel('Your reason or reply').fill('This send will lose its response.');
  await page.route('**/api/receipt?*', route => route.abort('failed'));
  await page.route('**/api/posts?*', async route => { await route.fetch(); await route.abort('failed'); });
  await page.getByRole('button', { name: 'Publish post' }).click();
  await expect(page.getByRole('button', { name: 'Retry publish' })).toBeEnabled();
  await page.unroute('**/api/posts?*'); await page.unroute('**/api/receipt?*');
  await page.reload();
  await expect(page.getByLabel('Your reason or reply')).toHaveValue('');
  await expect(page.locator('#threads .post')).toHaveCount(3);
  for (const action of ['exposure', 'forgery', 'reactions', 'reflection', 'reveal']) await release(action);
  await expect(page.locator('#response-form')).toHaveCount(0);
  await expect(page.locator('#notice')).toBeEmpty();
  await page.reload();
  await expect(page.locator('#response-form')).toHaveCount(0);
  await release('discussion'); await release('closing'); await release('end');
  await expect(page.getByRole('button', { name: 'Publish post' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Edit profile', exact: true })).toBeDisabled();
  await expect(page.locator('#response-form')).toHaveCount(0);
  expect(errors).toEqual([]);
  await context.close();
});
