# Open Circle — local rehearsal and operations

Workshop 2, Nordic Youth Conference for Democracy. Local implementation verified on 27 October 2026. No commit, push, hosting setup or deployment is part of this implementation.

## Start on this computer

Use Node 20+ and PowerShell 7. From `C:\Users\robin\ws\Democratic`:

```powershell
npm ci --ignore-scripts
$env:HOST_PASSWORD = Read-Host 'Choose a private host password (at least 16 characters)' -MaskInput
npm start
```

Open `http://localhost:4173/host`. Enter the same password. Create a **rehearsal** session with a clear label and a deliberate deletion deadline (1–168 hours). The default is 24 hours for rehearsal; choose the event deadline explicitly for a live session. Open **Private one-use team codes** and give each team the code matching its printed card. Keep codes and the host screen off the projector.

The seven portraits and `workshop-2-role-cards.md` are the preserved source assets. Each team sees its private card after claiming. The public portrait URL contains only a card number, never a fictional name or original filename.

For phones on the same Wi-Fi, stop the server with Ctrl+C, then run `npm run dev:lan` in the same terminal. Open `/host` using the network address printed by the server. The participant and projector links then use that address. Permit the Node application through Windows Firewall on the intended private network if prompted. The app does not change firewall settings. Phones cannot use a `localhost` link to this computer.

Use the host's **Open read-only projector** link for projection. It shows a QR, readable link, current prompt and aggregate progress. It has no private preview, team codes, role cards, incident text or host buttons, including when opened in the host's browser.

## Seven-team rehearsal

1. Open seven separate browser profiles/private contexts or seven devices. Separate tabs in one browser profile share the same team token, so they do not represent seven teams. Observers can follow without entering a code. One device per team should be the posting device; use **Add a read-only team device** to share a viewer link without sharing the private card or posting access.
2. Join all seven codes. Inspect the private cards and public bios. Use fictional material only. The host sees claimed handles and whether each team has recorded a first stance.
3. Press **Open debate** and confirm. Setup and genuine posting overlap during minutes 12–30. Have every team publish a stance and reason; reply across teams. The actual first selected stance drives the later inversion, even if it differs from the card's suggestion.
4. In debate, inspect the private preview. It identifies the session, current phase, affected handles, stance sources and expected count. A claimed team with no first post is omitted unless the host explicitly checks its assigned-leaning inclusion. Unclaimed cards are never targets.
5. Press **Launch simulated takeover**, inspect the confirmation, then cancel once. Verify nothing appeared. Try **Pause next release** and verify launch is disabled. Resume, preview again, then confirm. With seven eligible teams, the host reports **Released: 7 posts**. The targets and stance sources are now fixed.
6. Separately confirm **Release forged posts** (14 posts), then **Release reactions** (21 posts). Wait as long as the room needs between clicks. No timer, refresh or participant request can release a wave. Neither release creates a team profile. Three fictional reaction accounts already existed when the session was created.
7. Refresh the host page after one release. The server phase determines which button is enabled. Disconnect a team device, publish the next wave, reconnect, and verify the complete thread returns. A target's own conversation comes first; the other six stay compact. Teams can mark posts under their own handle **I did not write this**; the mark does not hide them.
8. Confirm **Begin reflection**. Discuss before explanation. Only then can **Reveal what happened** be confirmed. Reveal adds no forged posts: it labels actual provenance and opens the incident notice, correction flow and private team response choices.
9. Publish a correction. Check it on another device. Use host moderation to hide a genuine test post; its place and attribution remain. Staged posts cannot be silently removed through moderation.
10. Advance through room discussion and closing, then **End session**. Posting stops, but reading remains until deletion/expiry. Use **Clear this session's data** and type its exact label to remove it immediately. Alternatively reset only the rehearsal; its old codes/tokens are invalidated and new codes are issued. A separate live session is unaffected, and live sessions cannot be reset.

Suggested timing: opening 0–12; role, profile and debate 12–30; exposure 30–33; forgery/reactions 33–38; reflection 38–43; reveal/recovery 43–48; room discussion 48–54; closing 54–59; buffer 59–60. These are facilitation prompts, never automatic release deadlines.

## Reconnects and mistakes

- Keep the original team browser/profile. Its token and an unsent post draft stay in local browser storage. Repeated joins on that device return the same role. A used code cannot create another posting identity.
- A second device should use a viewer link or observer mode. After launch, unclaimed codes cannot create a late incident target; they receive an observer/catch-up message. If a posting device is irretrievably lost, use the team's printed card and observer view for the rest of the workshop. There is no implicit transfer of posting authority.
- If a release response is lost, the host retains its request identifier. **Retry pending release** repeats the same request safely; refresh also checks committed events. A stale preview is rejected and requires a fresh confirmation. Do not reset a session to resolve a connection problem.
- If a create-session or code-issue response is lost, return to that session and reissue only unclaimed codes. Already claimed teams are not affected. Codes are stored as hashes, so plaintext codes cannot be retrieved after closing the host page.
- Storage failure gives a visible retry error. A failed transaction cannot advance the phase or publish a partial wave. The browser retains its last confirmed feed while reconnecting.
- **Pause** blocks future host stages. It leaves published content visible and does not stop genuine team discussion.

## Restart and local data

Local storage is PGlite, an embedded Postgres engine, in `~/.democratic/open-circle` by default. On this computer that resolves to `C:\Users\robin\.democratic\open-circle`. It is intentionally outside the source tree. To isolate a different rehearsal installation, set `DATA_DIR` to another private absolute folder before starting. Never point local storage at the source tree or a shared synchronized folder.

Stop with Ctrl+C and start again using the same data folder and host password. Teams, posts, flags, phase, wave events and host access survive ordinary restart. Changing the host password invalidates existing host cookies. Explicit host sign-out revocation also survives restart.

PGlite allows one Node process per data folder. A `.writer-lock` prevents a second writer. After an abnormal process kill, verify that no server still uses that folder, then remove only that folder's `.writer-lock` before restarting. Do not remove it while a writer is running. Hosted Postgres supports multiple Node instances through database row locks; the embedded rehearsal engine is not a hosted database replacement.

## Backups, export and deletion

- The private host can export workshop content as JSON. Tokens and code hashes are excluded, but exports contain private workshop writing and fictional provenance. Treat them as private, retain only for explicit troubleshooting, and delete them afterward. This export is an inspection artifact, not a restorable authentication backup.
- For a local restorable backup, stop the server cleanly, copy the entire private data directory to a separate private backup folder, then restart. Restore only while the server is stopped; preserve the current directory separately before selecting a backup. A backup restore can reintroduce deleted content and old tokens, so do not restore into an active workshop.
- For hosted Postgres, use the provider's supported snapshot/restore or standard `pg_dump`/`pg_restore` procedure. Test restore in a separate rehearsal database. No provider backup was created or verified here.
- **Clear data** deletes the selected session aggregate, including roles, code hashes, team/viewer tokens, posts, flags, responses and wave events. Other sessions remain. It cannot delete downloaded exports, provider backups or copies on participants' devices.
- The configured deadline immediately denies further access. Expired session rows are purged on the next access to that session or the next authenticated session listing. There is no background deletion scheduler. For event cleanup, explicitly clear the session at the agreed deadline and verify its link returns “expired or cleared.” Clear browser site data on shared devices and delete exports/backups under the chosen retention policy.

## Hosted deployment preparation (not performed)

The Point plan recommends a Node HTTPS host and persistent Postgres, with Render/Neon as the proposed providers. Confirm accounts, permitted use, nearby European regions, uptime needs and the final retention deadline before release. Provider prices and service terms were not re-verified by this local implementation.

Required production configuration, stored in host secrets/settings rather than Git:

| Setting | Purpose |
| --- | --- |
| `NODE_ENV=production` | Requires external Postgres and secure host cookies |
| `DATABASE_URL` | Private Postgres connection URL with provider-recommended TLS verification |
| `HOST_PASSWORD` | Unique host password of at least 16 characters |
| `PUBLIC_ORIGIN` | Exact HTTPS origin participants open, without a trailing slash |
| `HOST=0.0.0.0` | Bind the Node service to its container interface |
| `PORT` | Port assigned by the host |

Install with `npm ci --ignore-scripts`, start with `npm start`, and use `/api/health` for a database-backed health check. The versioned SQL migration runs transactionally at startup and is idempotent for ordinary restart. Apply it to an empty rehearsal database first, and start one instance for the initial migration. Keep TLS certificate verification enabled. Static `dist` hosting cannot serve the shared workshop.

Before declaring readiness: verify the actual HTTPS URL and QR with physical phones; confirm five-second updates on the venue network; run the complete seven-team sequence, restart and backup/restore against the selected Postgres service; choose the deletion deadline; prepare printed cards and incident strips; freeze the tested revision through a separately authorized release workflow. No live session was created by this implementation.

## Tests and paper fallback

```powershell
npm test
npx playwright install chromium
npm run test:browser
```

If using an already installed Microsoft Edge instead: `$env:PLAYWRIGHT_CHANNEL='msedge'`, then `npm run test:browser`. The browser test starts an isolated loopback test server on port 4197 with an in-memory Postgres engine and disposable fictional data. It never connects to a live session. Screenshots and failure traces go to ignored `test-results/`; they can include test-only private previews.

If the service fails during the event, stop digital releases. Keep the seven printed role cards private, ask teams to write a stance/reason on paper under their handle, and let the facilitator read or hand out the disclosure, opposite-position, withdrawal and three reaction strips in the same order. Keep reflection before the provenance explanation. Teams write corrections and discuss privacy, independent thought and safe participation. Do not restart with replacement identities mid-exercise.
