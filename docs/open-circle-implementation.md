# Point implementation record — 27 October 2026

Working requirements: `C:\Users\robin\ws\patchpoint\point\features\democratic-workshop-two-open-circle-20261027\feature.md`, `plan.md`, `tasks.md`. Implementation followed the dependency order: durable storage and identity; debate; host controls and transactional incident; reveal/recovery; moderation/reset/retention; local rehearsal and operations documentation.

## Task status

| Point task | Local result | Remaining verification |
| --- | --- | --- |
| T-001 | PostgreSQL-backed transactional session aggregate, startup migration, row locks, PGlite rehearsal adapter, restart recovery | External Postgres connection and provider restart/restore |
| T-002 | Seven seeded roles, neutral handles, one-use hashed codes, own private role card, observer/viewer scopes | Physical team-card distribution |
| T-003 | Pinned question, editable bio/style, stance/reason, replies, two-second shared feed, responsive participant path | Physical devices and venue network |
| T-004 | Private host route, previews, confirmation, pause/resume, phase/version checks, isolated projector | Projector placement in the room |
| T-005 | Atomic exposure and forgery, fixed launch targets and first-stance source, retry keys, 7/14 counts | Hosted database rehearsal |
| T-006 | Three pre-seeded reaction accounts, 21 reactions, seven compact threads, own-thread priority, persistent disputes | Facilitator readability check at room scale |
| T-007 | Separately confirmed reveal after reflection, server-side provenance projection, preserved originals | Facilitator review of reveal timing |
| T-008 | Corrections, incident notice, private response choices, discussion/closing prompts | Workshop content sign-off |
| T-009 | Host moderation, rehearsal-only reset, independent sessions, expiry, explicit clearing, failure/late-join messaging | Final event retention decision |
| T-010 | Production environment validation, Postgres adapter, migration, health endpoint and operations guide prepared | Provider selection/configuration and deployment deliberately not performed |
| T-011 | Automated seven-browser-context rehearsal at 360px and desktop, observed screenshots, reconnect/cancel/pause/retry checks | Public HTTPS QR, physical phones/laptop and venue Wi-Fi rehearsal |
| T-012 | Local readiness and paper fallback documented | Version freeze, clean live session and venue checks deliberately not performed |

## Specification decisions and material conflicts

1. **Local implementation versus hosted prerequisite.** Point puts hosted Postgres before the full deployed rehearsal; the current request explicitly excludes deployment. The source supports `pg` for production and uses PGlite's real Postgres transactions locally. All local tests use the actual SQL engine, not an in-memory JavaScript mock. Recommendation: complete the same rehearsal against external Postgres/HTTPS before declaring live readiness. No claim is made that local verification completes T-010–T-012.
2. **Private identity versus named portrait files.** Existing portrait filenames disclose fictional names. Assets are preserved byte-for-byte and served only through neutral `/portraits/1.png`–`7.png` routes. Source documents and original named asset routes are not public. Recommendation: retain this server-side asset boundary rather than renaming workshop source material or relying on hidden UI labels.
3. **Late-join wording.** The workflow allows role claiming during setup/debate; the edge-case section says late arrivals become observers, while the frozen-target clause could be read as permitting later role claims without incident threads. The implementation closes unclaimed codes at launch and provides observer/catch-up. Existing claimed teams can reconnect at any phase. Recommendation: use this stricter interpretation for a coherent seven-team exercise.
4. **Expiry versus implicit background work.** The user has not authorized an external scheduled cleanup service. Deadlines immediately deny access; expiry cleanup is performed on session access or host session listing. Explicit host clearing is the recommended end-of-event operation. Recommendation: if exact unattended physical deletion is required, separately configure and test an authorized cleanup job and provider backup retention policy.
5. **Proposed relational tables versus small session aggregate.** The plan labels its tables as design proposals. This implementation stores a bounded seven-team session in one JSONB aggregate protected by `SELECT ... FOR UPDATE`, plus a host-cookie revocation table. Claims, post retries, flags, targets, waves and phase changes share the same transaction. This keeps concurrent Node instances consistent with a small migration surface. Recommendation: normalize only if the app grows beyond the bounded workshop scope; cap is 2,000 posts per session.
6. **Original prototype contracts.** Random public full-name identities, unlimited browser claims, default password and restart-clears-everything behavior conflict with the agreed privacy and persistence requirements. Those tests were replaced with the new contracts. Existing prototype UI source and third-party notices are retained but obsolete entry points are not served.

## Verification evidence

- `npm test`: ten integration scenarios passed, exercising seven unique claims and competing claims for one code; own-card/public-profile separation; anonymous and scoped viewer reads; direct-source/asset denial; host authorization; cross-origin writes; validation; actor-derived authorship; replies; concurrent wave/post retry; pause/order/version rejection; exact 7/14/21 counts; recorded stance inversion; no-post fallback; target freezing; disputes; reveal; correction; discussion/closing/end; session isolation; moderation; reset; expiry and deletion. Startup checks reject default secrets, missing production infrastructure and data folders inside source.
- A database trigger deliberately raises an exception during the exposure update. The test verifies the entire release rolls back, phase/count remain unchanged, and the original request succeeds exactly once after the trigger is removed.
- A disk-backed database is closed and reopened twice. Team access, posts, disputes, phase and wave retry survive; explicit host sign-out remains revoked after restart.
- Playwright with installed Microsoft Edge: seven independent team contexts, one 360×800 phone viewport and desktop viewports; host UI session creation/code distribution, genuine posts, cancellation, pause, wave order, host refresh, team offline/reconnect, disputes, reveal and a double-clicked correction. Observer sees 49 posts after the incident and 50 after one correction, grouped into seven conversations. Projector shows no buttons or private role text. Screens have no horizontal overflow. Keyboard focus is reachable. No browser JavaScript errors were reported.
- Phone, projector and private host screenshots were visually inspected. Automated browser checks are not a substitute for a full screen-reader audit or physical QR scan.

The seven role portraits and existing role-card document are used as supplied, with no edits. Pre-existing `.gitignore` and README additions and the existing workshop specification were retained. No Git commit, push, deployment or live-runtime change was performed.
