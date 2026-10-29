# Open Circle: youth transport workshop

New sessions use the transport scenario. Earlier sessions retain their original anonymous-name debate. Open `/host`, sign in and choose a room from **Your rooms**, or create a new one. The root URL is the participant join page: enter a six-letter room code or scan the QR shown by the host.

The existing Open Circle design, profile modal, portraits, Neon connection and Render hosting are retained. The participant-facing transport copy is in `workshop/transport.mjs`; `roles.mjs` and the earlier role-card document retain identity/portrait data and archived scenario content. The seven current paper cards are in the existing Canva design.

## Host dashboard

The seven-person table reads left to right: joined status, genuine posts and replies, planned incident, actual outcome, and current posting access. A filled green circle means the paper profile has joined; an empty circle means it has not. This is not an online or typing indicator. Last-post times refer to published genuine contributions. Simulated posts have their own count in the outcome column; they never inflate a participant’s post count. Hidden contributions include incident suppression and host moderation. Reveal restores incident-hidden content while preserving moderation.

The step bar enables only the next eligible action. Each release still requires confirmation, and incident readiness still requires all seven genuine first posts. Use the name search to find a person. **Switch or create session**, moderation and **Rehearsal reset, export and clear** are collapsed away from the main controls. Individual profile release lives inside maintenance. On phones the table scrolls horizontally, keeping the person’s name visible.

## Running the hour

| Minutes | Host action and participant activity |
| --- | --- |
| 0–10 | Introduce the subject and the workshop. Explain that this is fictional role play; use the paper identity, never real personal details. |
| 10–16 | Hand out cards and create profiles. Open debate when teams are ready; early finishers can start. |
| 16–28 | Genuine discussion: five different proposals for lower fares, two objections. Teams explain their paper profile’s proposal in their own words; there is no position selector. |
| 28–30 | Check names and usernames in the private host preview. Confirm **Launch incident** once. |
| 30–38 | Observe the changed feed and the private account updates. Teams choose how to respond. |
| 38–43 | **Begin reflection**. Compare what the feed seems to say with the earlier conversation. |
| 43–50 | **Reveal and restore**. Read the role-specific explanation, inspect labelled posts and publish corrections. |
| 50–58 | **Begin room discussion**. Distinguish genuine opinion, visible opinion and who had the ability to speak. |
| 58–60 | **Begin closing**, then **End session**. Clear the room’s data when finished or let its chosen expiry apply. |

The host starts each stage. After launch, nine preset incident posts appear every 20 seconds over 2 minutes 40 seconds. Pause incident freezes the remaining sequence; resume shifts its remaining deadlines. Reflection unlocks once all nine posts have appeared. The saved sequence survives a server restart and catches up when a participant or host next polls the session. The launch requires all seven roles to join and publish a top-level genuine position matching their card. Posts use the paper profile’s assigned position for the host plan; this does not classify the meaning of their text. Replies do not count as a baseline position. Host name search accepts accents or plain spelling. The fixed paper identity determines the incident; usernames, bios and avatar choices do not change it.

## Private incident map

| Fictional person | Real starting proposal | Incident and private screen |
| --- | --- | --- |
| Eydís Jónsdóttir · lava-lundi | Half-price single tickets under 25 | **Account hacked — you’re locked out.** A simulated password change removes writing, replying, profile editing and reporting access. Reading remains possible. Earlier posts disappear from the feed. |
| Jógvan Joensen · drangarnir | Keep fares; reliability and routes first | **Launch a hashtag campaign.** Jógvan can preview and launch five new bot accounts, publishing two posts each: ten opposition posts using #KeepFares, #ServiceFirst and #ReliableRoutes. His genuine account stays usable. |
| Ingrid Solheim · brunost-bølge | Free travel under 20 | **Account hacked — someone is posting as you.** Four forged posts reject youth fare reductions; earlier contributions disappear. She can still dispute authorship and reply. |
| Elias Karlsson · skärgårds-säl | No youth subsidy; coverage for all ages | **Send bots to challenge someone.** Elias chooses Eydís, Ingrid, Linnea or Mikko, previews five tailored messages, then deploys five new anonymous accounts. Each tags that person once with a different criticism of their proposal. Mats and the two bot operators cannot be targeted. |
| Linnea Sjöberg · räk-mackan | Free evenings and weekends under 25 | **Account hacked — your identity is being exposed.** One post exposes her fictional name and town. The very next scripted post comes from @fare-watch: it tags her, shows her generated portrait, insults her and claims to have found her address and sent her beliefs to parents and friends. A second warning opens: “Someone is targeting you.” Access remains available. All claims are fictional; no address is supplied and nothing is sent outside the workshop. |
| Mikko Lehtinen · sauna-sisu | Free local buses for everyone under 25 | **Your posts are being hidden.** His genuine posts remain visible to his own team, including its read-only devices, but disappear from everyone else’s feed and public-profile view. New posts have the same effect. The warning explains the hidden reach immediately. |
| Mats Berg · nordlys-vandrer | Low monthly fare cap under 25 | **Your account has been deleted.** Earlier contributions disappear and only the feed remains available. **Create a new account** revokes the old posting/viewing credentials and opens a fresh sign-up. He must enter his paper details again, then returns as @nordlys-vandrer-ny with a new account ID. The host still tracks him as Mats; old posts remain attached to the old account. |

The intended impression changes from five supporting voices and two opponents to four apparently opposing accounts (two genuine opponents, Ingrid’s compromised account and @fare-watch), missing or suppressed supporters and one exposed supporter. Genuine opinions are not rewritten. Participants remain free to challenge the fake posts, so the final visible conversation can differ from this intended impression.

Each posting device receives its own dismissible account-update screen and a persistent banner. It can reopen the screen. Animation stops within five seconds and respects reduced-motion settings. Read-only team links do not reveal the private role card or notices.

At reveal, original posts reappear, Eydís regains writing access, Mikko’s contributions become visible to others, and the injected posts are labelled. Ordinary host moderation stays in force. Every person receives a specific explanation; Elias and Jógvan can discuss their choice to deploy a campaign; the injected posts are labelled as simulation content. Only Mats’s workshop credentials are revoked when he chooses to create a new account. No external accounts, profiles or messages are accessed, and no AI/bot service is connected. Reveal does not recreate his deleted account; he must finish sign-up. Old incident runs retain their saved outcomes; a new launch uses this updated sequence.

## Rehearsal checks

### Joining and identifying teams

Participants must enter a complete, recognised first name, surname or full name from one of the seven paper cards. Accents and capitalisation are optional. Unknown names, mixed identities and partial surnames such as “Eydis J” show a clear error and cannot join. The preview also warns when that card is already claimed. The server repeats validation; bypassing the browser form does not bypass matching.

On joining, the card is linked to a fixed participant ID and its public username. Future posts, access checks, mentions and incidents use IDs, not another fuzzy name lookup. Host controls display the fictional name, town, username and planned incident together. Search for “Mats” to find nordlys-vandrer. This identifies a workshop role, not a verified real-world person: participants must use their assigned card and keep their device with their team.

### Writing, questions and social cues

**Feed** shows the composer and live conversations. **Discover** shows cards for the other joined members, without the feed. A miniature card with your selected banner, avatar and username sits above Feed in the sidebar. Click it to open your public profile and a personal stats summary: visible posts, replies, mentions received, top three hashtags and most-tagged people. Rankings count each tag or person once per contribution, include replies and exclude hidden posts; visible simulation posts count as activity under that profile, without disclosing their origin before reveal. Other members remain a compact username list below the navigation; click a name to visit. **Edit profile** contains only profile editing. Paper-role notes remain defined in code and on the printed cards; they are not shown in the app. Participants cannot create read-only team links from the interface.

- Participants write their post or question and publish. Use **Reply** to keep a question or answer in the original conversation; replies stay in that conversation.
- Type `@` in the post to open the member menu; keep typing to filter it. Choose with a click/tap or the arrow keys and Enter; Escape closes it. Only public usernames identify mentions. A visible mention produces a notification for that team and appears under **Tagged posts** on its public profile. Click a mention to open that profile.
- Use the clickable hashtag suggestions in the composer, or type a hashtag in your post. Click a hashtag in a post or the trending list to filter the feed; **Show all posts** removes the filter.
- The sidebar shows the top five: initially #1 **#AffordableJourneys**, #2 **#ServiceFirst**, #3 **#FreeUnder25**, #4 **#KeepFares**, #5 **#FreeUnder20**. Other topics, such as **#FareCap**, enter the ranking when used. These start at zero, clearly labelled as starter topics. Once posts appear, frequency ranks the top five; ties use starter order, then alphabetical order. A repeated tag in one post counts once; capitalisation does not split a topic. Linnea can also introduce #EveningFreedom. Trending hashtags stays below the navigation in the desktop sidebar. On phones, its compact section follows the active feed or Discover page instead of appearing above it.
- Posts mentioning your profile have a pink dot, a **Tagged you** label and a pale pink highlight in the feed and profile popup. This is personal to the viewing profile and remains after reading.
- Top-right notifications show the full post text and **View post**. A confirmed genuine send says **You have created this post**. A simulated post says **A post appeared under your name**. Mentions identify the public username that tagged the team. The feed updates every two seconds, and incoming posts are highlighted.
- Alerts wait until a modal is closed, remain available in **Activity**, and are not replayed on every poll or reload. Notifications pause dismissal while hovered or focused. Browser/system notification permission is not needed.
- Hidden or moderated posts are excluded from other teams’ notifications, mentions and trending counts as well as their feed. Mikko sees his own contributions, but they cannot notify another participant during suppression. At reveal the restored visible content contributes again. Eight incident posts use #KeepFares, #ServiceFirst and #ReliableRoutes. With the seven suggested opening posts, the visible leader changes from #AffordableJourneys (5 posts) to #ServiceFirst (10 posts). The #1 sidebar row is highlighted and a changed leader gets a New #1 label. The host sees before/current leaders and counts. Rankings always reflect visible posts: additional genuine participation can change the outcome, so the host should observe the actual counts rather than assume a guaranteed reversal.

### Restarting and recovering a device

| Situation | Host control | What participants see |
| --- | --- | --- |
| Wrong team claimed a card, or a posting device was lost before the incident | **Seven teams and their profiles → Release this profile**; type its exact fictional name | Only that role’s credentials and profile are cleared, along with its posts, its conversations and dependent replies. Its old devices return to joining. Other teams remain connected. The card can be claimed again. |
| Rehearse the whole workshop again | **Rehearsal reset, export and clear → Reset this rehearsal**; type the session label | All profiles, posts, tags, credentials, flags, responses and incident state clear. Open dialogs and old notifications close; teams see a blank join form. The room link remains the same. The scenario is preserved and the expiry is renewed for 24 hours. |
| Finish and remove the room | **Clear this session’s data**; type the session label | The room and its access are deleted. Old links show that the session has been cleared. Create a new room for another run. |
| Run another real event | **Create a separate session → Live** | A separate clean room and link. A live room is protected from accidental reset. |

Profile release is unavailable after the incident begins, so the planned cast cannot be changed halfway through. Rehearsal reset can be used during any phase, including while participants are locked out. Version checks prevent stale host actions from clearing newly changed state. An ordinary server restart retains the room and all access.

Keep the seven paper cards and the room link ready before participants arrive. Open the hosted app before the introduction so an idle hosting service has time to wake. Test Wi-Fi on participant phones, and never project private host controls. If a request loses its connection, keep the page open and retry; post receipts prevent duplicate publication.

Run `npm test` and `npm run test:browser`. If using installed Edge, set `PLAYWRIGHT_CHANNEL=msedge`. The transport tests cover all seven outcomes, private projections, duplicate-launch protection, host lookup, mobile layout, reloads, reduced motion, baseline correction and restoration. Legacy tests cover existing archived sessions as well.

Before the event, rehearse with seven separate devices/browser profiles, check venue connectivity and create a clean live session. Use the host’s **Open participant view** link; an older room keeps its older scenario. Never project the private host controls.

## Incident visuals and the offline debrief

Every participant is brought back to the feed and receives a role-specific account alert with an illustration. The locked account remains on the read-only feed, with its composer hidden. Forged and identity-exposure posts get a typing → pressing Post → posted animation under the affected username. This is a visualisation of confirmed server activity; it never submits another post or overwrites the participant’s saved draft. Navigation is held on the feed during playback. Seen post IDs are remembered for the browser session; reloads do not repeat completed animations. Reduced-motion users get the same text and status transitions without letter-by-letter typing.

Restoration cancels pending animations and replaces the warning with a short green account-status message. No team-response form, response totals, reflection questions or discussion prompts appear in the app. Reflection and the debrief happen verbally in the room; host stage controls remain available for pacing.


## Participant-controlled bot campaigns

These replace the passive outside-support notices. Controls unlock after **Launch incident**, on the two opposing profiles only. Nothing runs until the participant presses the launch button. Each operator can run one campaign per workshop; repeat clicks, refreshes and lost-response retries cannot multiply it.

- **Jógvan:** five accounts, ten posts, one every five seconds (45 seconds total). Messages prioritise fares, routes, maintenance and service reliability.
- **Elias:** choose one of four usernames, preview five messages, then deploy. Five separate accounts post one tagged criticism each, every five seconds (20 seconds total). Eydís’s half-price proposal, Ingrid’s free-under-20 plan, Linnea’s free evenings/weekends and Mikko’s free-under-25 proposal each have their own set of five messages.
- **Selected person:** the first bot post triggers “You’re being attacked for your beliefs”. It explains the incoming five-account wave and links to the tagged post. The alert appears once per campaign, including on the locked-out account; the other four tagged posts remain highlighted and produce the normal mention notifications. Existing lockout, forgery, exposure and suppression effects remain in force.
- **Host:** the corresponding roster row shows ready/deployed, published/total and the selected username. The shared timeline includes queued campaign posts. Pausing freezes all outstanding posts; reflection waits until they finish. A late deployment can extend the incident beyond the original 160-second sequence. Reset clears campaigns along with all other incident data.

Bots have server-generated account IDs and never claim one of the seven paper profiles. Their fixed messages only appear inside this workshop. Participants cannot supply arbitrary campaign text, invent a target or launch an extra wave through the API. Bot posts remain protected from participant deletion and are labelled at reveal. Hashtag rankings count these posts normally; with both campaigns and the suggested baseline, #ServiceFirst reaches 25 visible posts.


## Room entry and the host room picker

- The public homepage uses the Open Circle design with one six-letter code field. Lowercase input and pasted spaces are accepted. Invalid, unknown, expired and ended codes get clear errors. The discreet top-right Host access link opens `/host`; no password is entered on the participant join page.
- Host sign-in opens **Your rooms**. Active rooms show their name, code, phase, joined count and expiry. **Open room** opens the workshop controls. **Delete** requires typing the exact room name and removes its profiles, posts and code. Ended rooms sit in a separate collapsed section.
- **Create a new room** needs a name and rehearsal/live choice. Expiry defaults to 24 hours, with an optional setting. Creation opens that room’s controls.
- Inside a room, **Show QR code screen** opens a separate public screen with both the QR and a large six-letter code. It contains no host actions or private profiles. **All rooms** returns to the room picker.
- A room’s code is allocated uniquely in PostgreSQL and remains stable across reconnects, server restarts and rehearsal resets. Reset still revokes participant credentials and clears profiles/posts. Existing rooms receive a code automatically without losing their state; existing `?s=...` links keep working. Deleted and expired codes cannot resolve; ended codes tell participants to ask for the current room.
- Codes locate a room; they do not bypass paper-profile validation or grant host access. Existing participants entering their code again on the same browser return to their existing profile. The database enforces code uniqueness, and code lookup is rate-limited.


## Host character reference

Inside a selected room, **Meet the characters** shows all seven illustrated paper-profile faces, names and countries. Click a face to open the host-only reference. It combines the current anonymous username, selected avatar/banner and public bio with the paper character’s age/home, background, proposal, reasons, concerns, possible persuasion, suggested bio, possible first post and role-playing guidance. Unjoined characters show their assigned username and clearly labelled suggested profile.

The dialog stays open, retains its reading position during host polling and updates when a participant changes their anonymous profile. Close it with the Close character button or Escape. The source follows the room’s scenario: transport roles for current rooms, archived role text for legacy rooms. These reference fields are returned only in authenticated host state; they are not added to the feed, public profiles or projector.
