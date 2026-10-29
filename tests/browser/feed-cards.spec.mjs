import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { transportCards } from '../../workshop/transport.mjs';

test('signup randomizes untouched styles, keeps explicit choices, and feed cards stay newest first across replies and reloads', async ({ browser, request }, info) => {
  await request.post('/api/host/login', { data: { password: 'browser-test-host-password-only' } });
  const sid = randomUUID();
  await request.post('/api/host/sessions', { data: { id: sid, label: 'Clear feed', kind: 'rehearsal', expiresAt: Date.now() + 3600000 } });
  const pages = [], contexts = [], errors = [];
  for (let i = 0; i < 3; i++) {
    const context = await browser.newContext(); contexts.push(context);
    const page = await context.newPage(); pages.push(page); page.on('pageerror', e => errors.push(e.message));
    await page.goto('/?s=' + sid);
    const form = page.locator('#join-form');
    await form.locator('#join-name').fill(transportCards[i].fullName); await form.locator('#join-town').fill(transportCards[i].town);
    if (i > 0) {
      await form.getByRole('tab', { name: 'Profile', exact: true }).click();
      await form.locator('input[name=color][value="0"]').locator('..').click();
      if (i === 2) await form.locator('input[name=cover][value="4"]').locator('..').click();
    }
    await form.getByRole('button', { name: 'Join the forum' }).click(); await page.getByRole('button', { name: 'Enter the forum' }).click();
    const token = await page.evaluate(sid => localStorage.getItem('open-circle:' + sid), sid);
    const me = await (await request.get('/api/me?s=' + sid, { headers: { Authorization: 'Bearer ' + token } })).json();
    if (i === 0) { expect(me.participant.avatar).not.toBe('/avatars/0.svg'); expect(me.participant.cover).not.toBe(0); }
    else { expect(me.participant.avatar).toBe('/avatars/0.svg'); if (i === 1) expect(me.participant.cover).not.toBe(0); else expect(me.participant.cover).toBe(4); }
    pages[i].token = token;
  }
  const state = await (await request.get('/api/host/state?s=' + sid)).json();
  await request.post('/api/host/action?s=' + sid, { data: { action: 'debate', version: state.version, requestId: randomUUID() } });
  async function post(index, text, replyTo) {
    const r = await request.post('/api/posts?s=' + sid, { headers: { Authorization: 'Bearer ' + pages[index].token }, data: { text, ...(replyTo ? { replyTo } : { stance: transportCards[index].leaning }), requestId: randomUUID() } });
    expect(r.ok()).toBeTruthy(); return (await r.json()).post;
  }
  const first = await post(0, 'Cheaper buses help young people. #AffordableJourneys');
  await post(1, 'Reliable services come first. #ServiceFirst');
  await post(2, 'What do you think @lava-lundi? #FreeUnder20');
  await post(0, 'A reply should appear at the top too.', first.id);
  const page = pages[0], feed = page.locator('#threads');
  await expect(feed.locator('> .post')).toHaveCount(4);
  await expect(feed.locator('> .post').first()).toContainText('A reply should appear at the top too.');
  await expect(feed.locator('> .post').nth(1)).toHaveClass(/is-mentioned/);
  await expect(feed.locator('> .post').nth(1)).toContainText('Tagged you');
  await expect(feed.locator('> .post').first()).toContainText('Your account');
  await expect(feed.locator('details')).toHaveCount(0);
  await expect(feed.locator('> .post').nth(2)).not.toHaveClass(/is-mine|is-mentioned/);
  await page.reload(); await expect(feed.locator('> .post').first()).toContainText('A reply should appear at the top too.');
  await feed.scrollIntoViewIfNeeded(); await page.screenshot({ path: info.outputPath('feed-cards-desktop.png') });
  await page.setViewportSize({ width: 390, height: 844 }); await feed.scrollIntoViewIfNeeded(); await page.screenshot({ path: info.outputPath('feed-cards-phone.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await feed.locator('.reply-context').first().click(); await expect(page.locator('#post-' + first.id)).toBeFocused();
  expect(errors).toEqual([]); for (const context of contexts) await context.close();
});
