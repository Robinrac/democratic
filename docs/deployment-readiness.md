# Open Circle — configuration handoff

The application is prepared for a Node web service backed by PostgreSQL. The hosted deployment is now provisioned and verified as recorded below. The approved Open Circle design, seven paper profiles, usernames, banners and avatars are preserved.

## Hosted deployment — 28 October 2026

- App: https://democratic.onrender.com/ — private host: https://democratic.onrender.com/host
- Render service `democratic` and Neon project `democratic`, both in Frankfurt. Both use free plans; Render can take about a minute to wake after inactivity.
- Secrets are configured in Render environment settings, not in Git. The host password matches the local ignored `.env` at deployment time.
- Verified over HTTPS: database health, secure host login, seven-team joining and posting, 7 disclosures / 14 forged posts / 21 reactions, reveal, correction, recovery, and ending. A Render restart preserved the session, 50 posts and participant credentials. Browser host sign-in and participant joining also passed.
- Disposable automated sessions were cleared. Create a fresh live session with an appropriate expiry for the actual conference; physical phones, projector and venue Wi-Fi still need rehearsal.

## Implemented

- Required QR/link profile setup; accent-tolerant paper-name matching; one posting identity per paper profile; private name/town and public username/bio/appearance.
- Shared, ordered conversations with replies, quoted reply context, member profile browsing, own-conversation priority and latest activity ordering for other conversations.
- Locally retained drafts including stance, reply target and correction choice. A pending send retains its exact payload. Authenticated receipts resolve lost confirmations; retries cannot create a second copy or silently substitute different text.
- Reconnecting with the same browser restores the team. An interrupted join checks whether the claim already succeeded. Explicit team viewers remain read-only; no anonymous observer entry.
- Authenticated host previews and confirmations, pause/resume, atomic 7/14/21 incident releases, disputes, reveal, corrections and private recovery choices. A saved response returns after reload; the host sees aggregate totals, never participant-facing totals.
- Moderation, isolated rehearsal reset, session expiry, explicit deletion, private export, restart persistence, database-backed health checks and controlled shutdown.
- Config validation, production HTTPS origin checks and secure host cookies. Production defaults to listening on all interfaces. Local development stays on loopback unless explicitly opened to the LAN.

## Settings to fill later

Use `.env.example` as a list of settings. Keep actual credentials in the host's private environment settings. The server reads environment variables; copying the template alone does not load it.

| Setting | Value to supply |
| --- | --- |
| `NODE_ENV` | `production` |
| `PUBLIC_ORIGIN` | Final HTTPS origin, for example `https://forum.example.org`; no path, query or credentials. A trailing slash is normalized. |
| `DATABASE_URL` | PostgreSQL connection URL supplied by the chosen database, with its required TLS settings. Keep certificate verification enabled. |
| `HOST_PASSWORD` | A unique private host password. |
| `PORT` | The web service's assigned port. Defaults to 4173. |
| `HOST` | Optional override; production defaults to `0.0.0.0`. |

`DATA_DIR` is only for local PGlite storage and must be outside this source checkout. Production requires external PostgreSQL and does not silently fall back to local storage.

## Service contract

- Runtime: Node.js 20 or newer, with this repository as the service root.
- Install: `npm ci --ignore-scripts` (or `npm ci --omit=dev --ignore-scripts` for the deployed runtime).
- Configuration validation: `npm run check:config`. This checks values without connecting to the database or printing secrets.
- Build: none; the app serves its checked-in browser assets.
- Start: `npm start`.
- Health check: `GET /api/health`. It performs a database query; healthy is HTTP 200 with `{"ok":true}`. A storage failure is HTTP 503.
- Routes: participant `/`, private host `/host`, presenter `/?s=SESSION_ID&presenter=1`.
- Proxy: forward the whole origin to this Node service. HTTPS terminates at the host. The application checks writes against `PUBLIC_ORIGIN` and does not trust arbitrary forwarded IP headers. A room's teams may share one network address.
- Storage: startup runs the existing idempotent SQL migration transactionally. The database account needs schema/table creation permission on first start and normal table read/write thereafter. Use one service instance for the initial startup/migration. Session row locks protect subsequent writes.
- Operations: `SIGTERM`/`SIGINT` stops accepting requests, allows up to ten seconds to finish, and closes storage. Configure a shutdown grace period longer than ten seconds.

A static-only host cannot run this application. No provider-specific code is required for a conventional Node web service with PostgreSQL. This handoff does not include a serverless-functions adapter.

## Checks after configuration

These verify the selected infrastructure; they cannot be completed before it exists:

1. Run `npm run check:config`, start the service, and verify `/api/health` and the HTTPS host login.
2. Create a disposable rehearsal on the configured database. Run the seven-team sequence in the [rehearsal guide](open-circle-rehearsal.md), including replies, lost connections, moderation, reveal and recovery.
3. Restart the web service and confirm the same browser tokens, posts and phase return. Check the database provider's backup and restore process using a separate rehearsal database.
4. Open the final URL and scan its projector QR using actual phones on the intended network. Check updates, keyboard use and projector readability.
5. Choose the live session's expiry, prepare the seven paper cards, and create a clean live session. Clear the disposable rehearsal. Set provider backup retention to the chosen policy.

The source includes automated local checks (`npm test`, `npm run test:browser`). External PostgreSQL, the final HTTPS origin and the venue network have not been exercised by this preparation. No new forum feature development is currently identified as a prerequisite for the specified seven-team experience; the remaining work is infrastructure configuration and its live rehearsal.
