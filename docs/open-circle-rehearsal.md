# Open Circle — rehearsal and operations

> Current workshop: [Youth transport roles and host flow](transport-workshop.md). New sessions use this scenario. The older scenario instructions below are retained for existing sessions.

## Start locally

Use Node.js 20 or newer. No build or separate database installation is required.

```sh
npm ci --ignore-scripts
# Set HOST_PASSWORD privately in this terminal.
npm run check:config
npm start
```

In Bash, a hidden password prompt can set it without putting its value in shell history:

```sh
read -rs -p 'Host password: ' HOST_PASSWORD
export HOST_PASSWORD
```

In PowerShell 7:

```powershell
$env:HOST_PASSWORD = Read-Host 'Host password' -MaskInput
npm start
```

Open `http://localhost:4173/host`, sign in, and create a **rehearsal** session. Choose its deletion deadline deliberately (1–168 hours). The default is 24 hours. Share the participant link or projector QR and give each team its matching printed profile. There are no host-issued team codes.

For phones on the same network, stop the server cleanly and run `npm run dev:lan` with the same environment. Open `/host` using the network address printed by the server before generating the QR. A localhost link works only on the server computer. Network/firewall configuration is not changed by the app.

Project only **Open read-only projector**. It shows QR, current prompts and aggregate progress; it never shows the host preview, incident feed or private role cards, even in the host's browser.

## Seven-team rehearsal

1. Use seven devices or separate browser profiles/contexts. Tabs within one browser profile share the same team credential. Each team uses the room link and enters the name and home town from its paper, adds a public bio, and chooses a profile picture and banner. First name or surname is enough when unique; accents are optional. The username is assigned automatically. Setup cannot be skipped as an observer.
2. Inspect the public preview and the private details under the owner's sidebar. Public profiles focus on the username; paper names and towns remain private until the controlled disclosure. Use only the supplied paper identities. An extra team device can use **Add a read-only team device** without gaining posting access or private card access.
3. Confirm **Open debate**. Each team chooses a stance, writes a reason, and replies to another team. Click a public username to browse its profile and contributions. Replies show their original context and stay in that conversation. Reload a draft and confirm its text, stance and reply target remain.
4. Inspect the private release preview. Claimed teams with genuine first stances are included automatically. A claimed team without a first post is included only if the host explicitly selects its assigned leaning. Unclaimed profiles never become targets.
5. Open **Launch simulated takeover**, inspect the confirmation, then cancel once. Verify no release. Pause, verify actions are unavailable, then resume and confirm. Seven eligible teams produce **7** disclosures. Targets and recorded first stances become fixed.
6. Confirm **Release forged posts** (**14** posts) and **Release reactions** (**21** posts) separately. Wait as long as needed between steps. No timer advances the room. Three scripted reaction accounts were seeded with the session; waves do not create new team profiles.
7. Reload the host. Disconnect and reconnect a participant device. The full confirmed conversation returns. A team's own thread stays first; other threads sort by latest activity and keep their expanded/collapsed state. Use **I did not write this** under the team's own username; the dispute remains without hiding the post.
8. Confirm **Begin reflection**, discuss, then confirm **Reveal what happened**. Provenance labels identify genuine, injected and scripted posts. Each team can publish a correction and save a private recovery choice. Reload and confirm its selection returns. The host sees response totals; other participants do not.
9. Hide a genuine test post through host moderation. Its position and authorship remain, while its text is hidden everywhere, including quoted replies. Staged posts cannot be silently removed.
10. Advance through discussion, closing and **End session**. New posts and corrections stop at closing; other participation stops at end. Reading remains until expiry or clearing. An already committed post can still be acknowledged safely after closing.
11. Clear this rehearsal by typing its exact label, or reset it and confirm all old credentials become invalid. A separate live session is unaffected; live sessions cannot be reset.

Suggested timing: opening 0–12 minutes; profile/debate 12–30; exposure 30–33; forgery/reactions 33–38; reflection 38–43; reveal/recovery 43–48; room discussion 48–54; closing 54–59; one-minute buffer. These are facilitator prompts, not automatic deadlines.

## Connection problems

- Stay in the original browser/profile. Its credential, draft text, stance, reply target and correction choice are stored locally. A second posting identity cannot claim the same paper profile.
- An uncertain send becomes **Retry publish**. Its exact content stays locked until the server confirms it or definitively rejects it. Retrying cannot duplicate it. Reloading checks a private receipt; a post that saved while its response was lost is confirmed without reposting.
- When a send is rejected (for example after closing), its draft stays available. Never reset the whole session to resolve a connection issue.
- An interrupted join checks whether the original claim succeeded. Joining closes at launch. An existing team can reconnect; there is no observer entry or implicit transfer of posting authority to a replacement browser. If its posting device is lost, use an already shared team viewer or the paper fallback.
- **Retry pending release** repeats the original host request. Refresh also checks committed events. A new release is disabled while the old one is unconfirmed; a stale preview requires a new confirmation.
- Storage failures show a retry message. A failed transaction cannot publish part of a wave or advance its phase. The last confirmed feed stays visible while the connection returns.
- **Pause** blocks future host stages; it leaves published content visible and genuine discussion open.

## Local storage and restart

PGlite is an embedded PostgreSQL engine. Local data defaults to `~/.democratic/open-circle`, outside the source tree. `DATA_DIR` can choose a different private folder. Do not place it in the checkout or a shared synchronized folder.

Stop cleanly with Ctrl+C, then restart with the same folder and host password. Teams, posts, flags, recovery responses, phase and committed waves survive. Changing the host password invalidates host cookies; explicit sign-out revocations also survive restart.

Only one process may use a local folder. A `.writer-lock` prevents a second writer. After an abnormal kill, verify no process still uses the folder before removing only its stale `.writer-lock`. Never remove a live writer's lock. Hosted PostgreSQL uses database row locks instead.

## Backup, export and deletion

- Host JSON export excludes authentication credentials, but includes private session writing and provenance. Keep it private and delete it after troubleshooting. It is an inspection export, not a restorable authentication backup.
- For a local backup, stop cleanly, copy the entire private data folder to a separate private backup location, then restart. Restore only while stopped and preserve the current folder separately. A restore can reintroduce old data and tokens; never restore over an active room.
- For hosted PostgreSQL, use the provider's supported backup/restore process and test it against a separate rehearsal database.
- **Clear data** removes the selected session's roles, credentials, writing, disputes, responses and wave events. Other sessions remain. Downloaded exports, browser copies and provider backups are separate.
- Expiry immediately denies access. Rows are removed on the next session access or authenticated session listing; there is no background cleanup service. For event cleanup, explicitly clear the session and check that its link reports expiry/clearing. Clear site data on shared devices and apply the chosen backup/export retention policy.

## Automated checks and hosting

```sh
npm test
npm run test:browser
```

Install the Playwright browser once if needed with `npx playwright install chromium`. `PLAYWRIGHT_CHANNEL` can select an installed supported browser. Browser checks run an isolated in-memory server on loopback port 4197. They do not use the local rehearsal database. Screenshots/traces in ignored `test-results/` may contain test-only private host views.

See [deployment readiness](deployment-readiness.md) for the environment settings, startup/health contract and infrastructure checks. Hosting, external PostgreSQL and venue verification remain to be configured and exercised; no publication is performed here.

## Paper fallback

If the service fails during the event, stop digital releases. Teams use the seven printed cards and write their stance/reason under the assigned username. The facilitator reads or distributes disclosure, opposite-position, withdrawal and three reaction strips in the same order. Keep reflection before the provenance explanation. Teams then write corrections and discuss privacy, independent thought and safe participation. Do not create replacement identities mid-exercise.
