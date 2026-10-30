import { test, expect } from '@playwright/test';
import { randomBytes, randomUUID } from 'node:crypto';
import { transportCards } from '../../workshop/transport.mjs';

test('participants deploy both campaigns, select one of four targets, and the victim gets one attack alert', async ({ browser, request }, info) => {
  await request.post('/api/host/login', { data: { password: 'browser-test-host-password-only' } });
  const sid = randomUUID(), tokens = [], members = [], contexts = [], pages = {}, errors = [];
  await request.post('/api/host/sessions', { data: { id: sid, label: 'Participant bot controls', kind: 'rehearsal', expiresAt: Date.now() + 3600000 } });
  for (const [i, c] of transportCards.entries()) {
    tokens[i] = randomBytes(32).toString('hex');
    const result = await request.post('/api/join?s=' + sid, { headers: { Authorization: 'Bearer ' + tokens[i] }, data: { name: c.fullName, town: c.town, bio: '', color: i, cover: i } }); members[i] = (await result.json()).participant;
  }
  async function release(action) { const s = await (await request.get('/api/host/state?s=' + sid)).json(); expect((await request.post('/api/host/action?s=' + sid, { data: { action, version: s.version, requestId: randomUUID() } })).ok()).toBeTruthy(); }
  await release('debate');
  for (let i = 0; i < 7; i++) await request.post('/api/posts?s=' + sid, { headers: { Authorization: 'Bearer ' + tokens[i] }, data: { text: transportCards[i].suggestedPost, requestId: randomUUID() } });
  for (const i of [0, 1, 3]) {
    const context = await browser.newContext({ viewport: i === 3 ? { width: 390, height: 844 } : { width: 1280, height: 900 }, reducedMotion: 'reduce' }); contexts.push(context);
    await context.addInitScript(({ sid, token }) => localStorage.setItem('open-circle:' + sid, token), { sid, token: tokens[i] });
    const p = await context.newPage(); pages[i] = p; p.on('pageerror', e => errors.push(e.message)); await p.goto('/?s=' + sid);
    await expect(p.locator('#bot-controls')).toBeHidden();
  }
  await release('incident');
  for (const p of Object.values(pages)) { await expect(p.locator('#incident-dialog')).toBeVisible(); await p.locator('#close-incident').click(); }
  const hashtag = pages[1], attack = pages[3], victim = pages[0];
  await expect(hashtag.locator('#incident-banner')).toContainText('Launch a hashtag campaign');
  await expect(attack.locator('#bot-target option')).toHaveCount(5);
  expect(await attack.locator('#bot-target option').allTextContents()).not.toContain('@nordlys-vandrer');
  await expect(attack.locator('#deploy-bots')).toBeDisabled();
  await attack.locator('#bot-target').selectOption(members[0].id);
  await attack.getByText('Preview the posts', { exact: true }).click();
  await expect(attack.locator('#bot-preview li')).toHaveCount(5);
  await expect(attack.locator('#bot-preview')).toContainText('half-price plan');
  await attack.screenshot({ path: info.outputPath('targeted-bots-phone.png'), fullPage: true });
  await hashtag.locator('#deploy-bots').click(); await attack.locator('#deploy-bots').click();
  await expect(victim.getByRole('heading', { name: 'You’re being attacked for your beliefs' })).toBeVisible();
  await victim.screenshot({ path: info.outputPath('victim-alert.png') });
  await victim.getByRole('button', { name: 'View tagged post' }).click();
  await expect(victim.locator('#composer')).toBeHidden();
  await expect(hashtag.locator('.bot-progress')).toContainText('10 / 10', { timeout: 60000 });
  await expect(attack.locator('.bot-progress')).toContainText('5 / 5');
  await expect(victim.locator('#incident-dialog')).toBeHidden();
  await expect(victim.locator('.post.is-mentioned')).toHaveCount(5);
  const posts = await (await request.get('/api/feed?s=' + sid, { headers: { Authorization: 'Bearer ' + tokens[0] } })).json();
  expect(new Set(posts.posts.filter(p => p.attackCampaign).map(p => p.author.id)).size).toBe(5);
  await attack.reload(); await expect(attack.locator('.bot-progress')).toContainText('5 / 5'); await expect(attack.locator('#deploy-bots')).toHaveCount(0);
  await release('reflection'); await release('reveal');
  await expect(victim.locator('.account-restored')).toBeVisible();
  expect(errors).toEqual([]); for (const c of contexts) await c.close();
});
