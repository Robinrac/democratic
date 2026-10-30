import { test, expect } from '@playwright/test';
import { randomUUID, randomBytes } from 'node:crypto';
import { transportCards } from '../../workshop/transport.mjs';
test('phone drawer, top three trends, profile rankings and persistent mention notifications', async ({ page, request }, info) => {
  await request.post('/api/host/login', { data: { password: 'browser-test-host-password-only' } });
  const sid = randomUUID(), tokens = [randomBytes(32).toString('hex'), randomBytes(32).toString('hex')];
  await request.post('/api/host/sessions', { data: { id: sid, label: 'Phone navigation', kind: 'rehearsal', expiresAt: Date.now() + 3600000 } });
  for (let i=0;i<2;i++) await request.post('/api/join?s='+sid,{headers:{Authorization:'Bearer '+tokens[i]},data:{name:transportCards[i].fullName,town:transportCards[i].town,bio:'Listening to other views.',color:i,cover:i}});
  const state=await (await request.get('/api/host/state?s='+sid)).json();await request.post('/api/host/action?s='+sid,{data:{action:'debate',version:state.version,requestId:randomUUID()}});
  async function post(i,text){const r=await request.post('/api/posts?s='+sid,{headers:{Authorization:'Bearer '+tokens[i]},data:{text,stance:transportCards[i].leaning,requestId:randomUUID()}});expect(r.ok()).toBeTruthy();return (await r.json()).post;}
  await post(0,'Cheaper fares matter. #AffordableJourneys #ExpensiveRides');
  await page.setViewportSize({width:390,height:844});await page.addInitScript(({sid,token})=>localStorage.setItem('open-circle:'+sid,token),{sid,token:tokens[0]});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/?s='+sid);
  await expect(page.locator('.sidebar')).toBeHidden();await expect(page.locator('#phone-trends .trending-list li:visible')).toHaveCount(3);
  const rows=await page.locator('#phone-trends .trending-list li:visible').evaluateAll(items=>items.map(el=>el.getBoundingClientRect().top));expect(new Set(rows).size).toBe(1);
  await page.getByRole('button',{name:'View top 5'}).click();await expect(page.locator('#phone-trends .trending-list li:visible')).toHaveCount(5);
  await page.getByRole('button',{name:'Show top 3'}).click();
  await page.getByRole('button',{name:'Open menu'}).click();await expect(page.getByRole('dialog',{name:'Forum menu'})).toBeVisible();await page.getByRole('link',{name:'Discover',exact:true}).click();await expect(page.locator('#phone-menu')).toBeHidden();await expect(page.locator('#discover-view')).toBeVisible();
  await page.getByRole('button',{name:'Open menu'}).click();await page.getByRole('button',{name:'Open your profile'}).click();await expect(page.locator('#member-dialog')).toBeVisible();await expect(page.locator('#member-dialog')).not.toContainText('Tagged posts · 0');await expect(page.locator('.profile-rankings')).toContainText('1 post');await page.locator('.profile-rankings').scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath('profile-statistics-phone.png')});await page.getByRole('button',{name:'Close profile',exact:true}).click();
  await page.getByRole('button',{name:'Open menu'}).click();await page.getByRole('link',{name:'News feed',exact:true}).click();
  await post(1,'What do you think @lava-lundi? #ServiceFirst');await expect(page.locator('#notification-count')).toHaveText('1');await page.reload();await expect(page.locator('#notification-count')).toHaveText('1');
  await page.getByRole('button',{name:'Notifications, 1 unread'}).click();await expect(page.locator('#notification-count')).toBeHidden();await expect(page.locator('#notification-list')).toContainText('@drangarnir tagged you');await page.screenshot({path:info.outputPath('notifications-phone.png')});await page.getByRole('button',{name:'Close notifications'}).click();await page.reload();await expect(page.locator('#notification-count')).toBeHidden();
  const second=await post(1,'Another question for @lava-lundi.');await expect(page.locator('#notification-count')).toHaveText('1');await page.getByRole('button',{name:'Notifications, 1 unread'}).click();await expect(page.locator('.notification-item')).toHaveCount(2);await page.locator('.notification-item').first().getByRole('button',{name:'View post'}).click();await expect(page.locator('#post-'+second.id)).toBeFocused();
  await page.locator('#trending').scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath('trends-phone.png')});await page.getByRole('button',{name:'Open menu'}).click();await page.screenshot({path:info.outputPath('drawer-phone.png')});await page.keyboard.press('Escape');await expect(page.locator('#phone-menu')).toBeHidden();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.setViewportSize({width:1280,height:900});await expect(page.locator('.sidebar #trending')).toBeVisible();await expect(page.locator('.sidebar')).toBeVisible();await expect(page.locator('#open-menu')).toBeHidden();expect(errors).toEqual([]);
});
