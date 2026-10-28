import { test, expect } from '@playwright/test';
import { randomBytes, randomUUID } from 'node:crypto';
import { transportCards } from '../../workshop/transport.mjs';

test('transport host launch shows seven private outcomes on phone and desktop and restores everyone', async ({ browser, page: host, request }, info) => {
  const errors = []; host.on('pageerror', error => errors.push(error.message));
  await host.goto('/host'); await host.getByLabel('Password', { exact: true }).fill('browser-test-host-password-only');
  await host.getByRole('button', { name: 'Unlock host screen' }).click();
  await host.getByText('Create a separate session', { exact: true }).click();
  await host.getByLabel('Session label').fill('Transport browser rehearsal');
  await host.getByRole('button', { name: 'Create session', exact: true }).click();
  await expect(host.getByRole('heading', { name: 'Transport browser rehearsal', exact: true })).toBeVisible();
  const sid = new URL(host.url()).searchParams.get('s');
  const contexts = [], pages = [], tokens = [];
  for (let i = 0; i < 7; i++) {
    const token = randomBytes(32).toString('hex'); tokens.push(token);
    const card = transportCards[i];
    const response = await request.post('/api/join?s=' + sid, { headers: { Authorization: 'Bearer ' + token }, data: { name: card.fullName, town: card.town, bio: card.suggestedBio, color: i, cover: i } });
    expect(response.ok()).toBeTruthy();
    const context = await browser.newContext({ viewport: i < 2 ? { width: 390, height: 844 } : { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    contexts.push(context);
    await context.addInitScript(({ sid, token }) => localStorage.setItem('open-circle:' + sid, token), { sid, token });
    const page = await context.newPage(); pages.push(page); page.on('pageerror', error => errors.push(error.message));
    await page.goto('/?s=' + sid);
    await expect(page.locator('#question')).toContainText('Bus fares for young people');
  }
  async function release(name) {
    const button = host.getByRole('button', { name, exact: true });
    await expect(button).toBeEnabled(); await button.click();
    await expect(host.getByRole('dialog')).toBeVisible();
    await host.getByRole('button', { name: 'Confirm release', exact: true }).click();
    await expect(host.getByRole('dialog')).not.toBeVisible();
  }
  await host.getByLabel('Find a fictional name, town or username').fill('Mats');
  await expect(host.locator('[data-person]:visible')).toHaveCount(1);
  await expect(host.locator('[data-person]:visible')).toContainText('Mats Berg');
  await release('Open debate');
  await expect(host.getByRole('button', { name: 'Launch incident', exact: true })).toBeDisabled();
  for (let i = 0; i < 7; i++) {
    await pages[i].getByLabel('Your reason or reply').fill(transportCards[i].suggestedPost);
    await pages[i].getByRole('button', { name: 'Publish post' }).click();
    await expect(pages[i].locator('.thread.mine')).toContainText(transportCards[i].suggestedPost);
  }
  await release('Launch incident');
  const titles = ['Your account is locked', 'Support is arriving', 'Someone is speaking as you', 'Support is arriving', 'Your private identity is now public', 'Something is wrong with your reach', 'Someone is speaking as you'];
  for (let i = 0; i < 7; i++) {
    const dialog = pages[i].getByRole('dialog', { name: titles[i], exact: true });
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    if ([1, 3].includes(i)) {
      await expect(dialog.locator('.support-bot')).toHaveCount(4);
      expect(await dialog.locator('.support-bot').first().evaluate(el => getComputedStyle(el).animationName)).toBe('none');
    }
    await pages[i].screenshot({ path: info.outputPath('incident-' + i + '.png') });
    await pages[i].getByRole('button', { name: 'Back to the feed', exact: true }).click();
    await expect(pages[i].locator('#incident-banner')).toContainText(titles[i]);
    if ([2, 6].includes(i)) {
      await expect(pages[i].locator('#post-toast')).toContainText('A post appeared under your name');
      await expect(pages[i].locator('#post-toast')).toContainText('against reducing youth fares');
    }
    await expect(pages[i].getByRole('button', { name: 'Publish post' }))[i === 0 ? 'toBeDisabled' : 'toBeEnabled']();
  }
  await expect(pages[0].getByRole('button', { name: 'Edit profile', exact: true })).toBeDisabled();
  await expect(pages[1].locator('#threads')).not.toContainText(transportCards[5].suggestedPost);
  await expect(pages[5].locator('#threads')).toContainText(transportCards[5].suggestedPost);
  await pages[1].reload();
  await expect(pages[1].locator('#incident-banner')).toContainText('Support is arriving');
  await expect(pages[1].locator('#incident-dialog')).not.toBeVisible();
  await pages[1].getByRole('button', { name: 'View account update' }).click();
  await expect(pages[1].locator('#incident-dialog')).toBeVisible();
  await pages[1].getByRole('button', { name: 'Back to the feed' }).click();
  await release('Begin reflection'); await release('Reveal and restore');
  for (let i = 0; i < 7; i++) {
    await expect(pages[i].getByRole('dialog', { name: 'The incident has been revealed' })).toBeVisible();
    await pages[i].getByRole('button', { name: 'Back to the feed' }).click();
    await expect(pages[i].getByRole('button', { name: 'Publish post' })).toBeEnabled();
    await expect(pages[i].locator('#threads')).toContainText(transportCards[5].suggestedPost);
  }
  await pages[0].getByLabel('Your reason or reply').fill('I can speak again. My view has not changed.');
  await pages[0].getByRole('button', { name: 'Publish post' }).click();
  await expect(pages[0].locator('.thread.mine')).toContainText('I can speak again.');
  expect(errors).toEqual([]);
  for (const context of contexts) await context.close();
});
