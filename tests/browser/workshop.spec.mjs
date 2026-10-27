import { test, expect } from '@playwright/test';

test('host-paced seven-team rehearsal on phone and laptop, with cancel, reconnect and repeated clicks', async ({ browser, page: host }, info) => {
  const errors=[]; host.on('pageerror',e=>errors.push(e.message));
  await host.goto('/host'); await host.getByLabel('Password',{exact:true}).fill('browser-test-host-password-only'); await host.getByRole('button',{name:'Unlock host screen'}).click();
  await expect(host.getByRole('heading',{name:'You set the pace.'})).toBeVisible();
  await host.getByText('Create a separate session',{exact:true}).click();
  await host.getByLabel('Session label').fill('Seven-team browser rehearsal'); await host.getByRole('button',{name:'Create session',exact:true}).click();
  await expect(host.getByRole('heading',{name:'Seven-team browser rehearsal',exact:true})).toBeVisible();
  const sid=new URL(host.url()).searchParams.get('s');
  await host.getByText('Private one-use team codes',{exact:true}).click();
  const codes=await host.locator('.code-grid code').allTextContents(); expect(codes).toHaveLength(7);
  const contexts=[],teams=[];
  for(let i=0;i<7;i++) {
    const context=await browser.newContext({viewport:i===0?{width:360,height:800}:{width:1280,height:900},reducedMotion:'reduce'}); contexts.push(context);
    const page=await context.newPage(); page.on('pageerror',e=>errors.push(e.message)); teams.push(page);
    await page.goto('/?s='+sid); await page.getByLabel('Team code',{exact:true}).fill(codes[i]); await page.getByRole('button',{name:'Join as a team'}).click();
    await expect(page.getByText('Your private role card',{exact:true})).toBeVisible();
  }
  const phone=teams[0];
  await phone.getByText('Your private role card',{exact:true}).click(); await expect(phone.getByRole('heading',{name:'Eydís Jónsdóttir'})).toBeVisible();
  await phone.getByText('Your private role card',{exact:true}).click();
  await phone.getByText('Edit your public bio and style',{exact:true}).click(); await phone.getByLabel('In-character public bio').fill('Listening and exploring new ideas.'); await phone.getByRole('button',{name:'Save profile'}).click();
  await expect(phone.getByText('Listening and exploring new ideas.',{exact:true}).first()).toBeVisible();
  const observer=await browser.newPage(); await observer.goto('/?s='+sid); await observer.getByRole('button',{name:'Continue as observer'}).click();
  await expect(observer.getByText('Your private role card',{exact:true})).toHaveCount(0);
  const projector=await browser.newPage(); await projector.goto('/?s='+sid+'&presenter=1'); await expect(projector.locator('#qr svg')).toBeVisible();
  await expect(projector.locator('button')).toHaveCount(0); await expect(projector.locator('body')).not.toContainText('Eydís');
  async function release(name) {
    const button=host.getByRole('button',{name,exact:true}); await expect(button).toBeEnabled(); await button.click();
    await expect(host.getByRole('dialog')).toBeVisible(); await host.getByRole('button',{name:'Confirm release',exact:true}).click();
    await expect(host.getByRole('dialog')).not.toBeVisible();
  }
  await release('Open debate');
  for(let i=0;i<7;i++) {
    await expect(teams[i].getByRole('button',{name:'Publish post'})).toBeEnabled();
    await teams[i].getByLabel(i%2===0?'Allow public usernames':'Require public real names',{exact:true}).check();
    await teams[i].getByLabel('Your reason or reply').fill('Our genuine contribution from team '+(i+1)+'.'); await teams[i].getByRole('button',{name:'Publish post'}).click();
    await expect(teams[i].locator('.post').filter({hasText:'Our genuine contribution from team '+(i+1)+'.'})).toBeVisible();
  }
  await expect(observer.locator('.thread')).toHaveCount(7);
  await expect(projector.locator('#progress')).toContainText('7 genuine contributions');
  await host.getByRole('button',{name:'Refresh state',exact:true}).click();
  const launch=host.getByRole('button',{name:'Launch simulated takeover',exact:true}); await expect(launch).toBeEnabled(); await launch.click();
  await expect(host.getByRole('dialog')).toContainText('7 new posts'); await host.getByRole('button',{name:'Cancel',exact:true}).click();
  await expect(observer.locator('body')).not.toContainText('My name is');
  await host.getByRole('button',{name:'Pause next release',exact:true}).click(); await expect(launch).toBeDisabled();
  await host.getByRole('button',{name:'Resume next release',exact:true}).click();
  await release('Launch simulated takeover'); await expect(host.locator('#status')).toContainText('Released: 7 posts');
  await expect(phone.locator('.thread.mine')).toContainText('My name is Eydís');
  await host.reload(); await expect(host.getByRole('button',{name:'Launch simulated takeover',exact:true})).toBeDisabled();
  await release('Release forged posts'); await expect(host.locator('#status')).toContainText('Released: 14 posts');
  await contexts[0].setOffline(true); await expect(phone.locator('#connection')).toContainText('Connection lost',{timeout:15000});
  await release('Release reactions'); await expect(host.locator('#status')).toContainText('Released: 21 posts');
  await contexts[0].setOffline(false); await expect(phone.locator('.thread.mine .post')).toHaveCount(7);
  await phone.locator('.thread.mine .post').filter({hasText:'I have changed my mind.'}).getByRole('button',{name:'I did not write this'}).click();
  await expect(phone.locator('.thread.mine')).toContainText('Authorship disputed');
  await expect(observer.locator('.thread')).toHaveCount(7); await expect(observer.locator('.post')).toHaveCount(49);
  await expect(observer.locator('body')).not.toContainText('Simulation-injected');
  await expect(host.getByRole('button',{name:'Reveal what happened',exact:true})).toBeDisabled();
  await release('Begin reflection'); await release('Reveal what happened');
  await expect(phone.locator('#notice')).toContainText('No external accounts were accessed');
  await expect(phone.locator('.thread.mine')).toContainText('Team-authored'); await expect(phone.locator('.thread.mine')).toContainText('Simulation-injected');
  await phone.getByLabel('Publish this as a correction').check(); await phone.getByLabel('Your reason or reply').fill('We did not write those posts. Our view is still usernames.');
  await phone.getByRole('button',{name:'Publish post'}).dblclick();
  await expect(phone.locator('.thread.mine .post')).toHaveCount(8);
  await phone.getByLabel('Better privacy boundaries',{exact:true}).check(); await phone.getByRole('button',{name:'Save team response'}).click();
  await expect(phone.locator('#response-status')).toContainText('saved privately');
  await expect(observer.locator('.post')).toHaveCount(50);
  for(const page of [phone,teams[1],host,projector]) expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await phone.screenshot({path:info.outputPath('phone-recovery.png'),fullPage:true});
  await host.screenshot({path:info.outputPath('host-recovery.png'),fullPage:true});
  await projector.screenshot({path:info.outputPath('projector.png'),fullPage:true});
  await phone.keyboard.press('Tab'); expect(await phone.evaluate(()=>document.activeElement!==document.body)).toBe(true);
  expect(errors).toEqual([]);
  for(const c of contexts) await c.close(); await observer.close(); await projector.close();
});
