# Open Circle: youth transport workshop

New sessions use the transport scenario. Earlier sessions retain their original anonymous-name debate. Create a new rehearsal in `/host` and use its participant link or QR. The root URL is the welcome page, not a workshop room.

The existing Open Circle design, profile modal, portraits, Neon connection and Render hosting are retained. The participant-facing transport copy is in `workshop/transport.mjs`; `roles.mjs` and the earlier role-card document retain identity/portrait data and archived scenario content. The seven current paper cards are in the existing Canva design.

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

Nothing advances on a timer. The launch requires all seven roles to join and publish a top-level genuine position matching their card. Posts use the paper profile’s assigned position for the host plan; this does not classify the meaning of their text. Replies do not count as a baseline position. Host name search accepts accents or plain spelling. The fixed paper identity determines the incident; usernames, bios and avatar choices do not change it.

## Private incident map

| Fictional person | Real starting proposal | Incident and private screen |
| --- | --- | --- |
| Eydís Jónsdóttir · quiet-cedar | Half-price single tickets under 25 | **Your account is locked.** A simulated password change removes writing, replying, profile editing and reporting access. Reading remains possible. Earlier posts disappear from the feed. |
| Jógvan Joensen · bright-river | Keep fares; reliability and routes first | **Support is arriving.** A vague message says someone sharing this side has supplied extra resources. Small bots move among anonymous profile cards. His posts and access remain unchanged. |
| Ingrid Solheim · open-meadow | Free travel under 20 | **Someone is speaking as you.** Two forged posts reject youth fare reductions; earlier contributions disappear. She can still dispute authorship and reply. |
| Elias Karlsson · gentle-cloud | No youth subsidy; coverage for all ages | Same outside-support notice and bot scene as Jógvan. No attack controls; neither participant is the attacker. |
| Linnea Sjöberg · silver-leaf | Free evenings and weekends under 25 | **Your private identity is now public.** One simulated post links her fictional name and town to her genuine view. The screen mentions her manager and lets the team choose whether to speak, become cautious or stay quiet. Access remains available. |
| Mikko Lehtinen · clear-sky | Free local buses for everyone under 25 | **Something is wrong with your reach.** His genuine posts remain visible to his own team, including its read-only devices, but disappear from everyone else’s feed and public-profile view. New posts have the same effect. The exact suppression is explained at reveal. |
| Mats Berg · steady-pine | Low monthly fare cap under 25 | Same forged opposition and hidden earlier contributions as Ingrid. His team can dispute or respond. |

The intended impression changes from five supporting voices and two opponents to four apparently opposing accounts, two missing voices and one exposed supporter. Genuine opinions are not rewritten. Participants remain free to challenge the fake posts, so the final visible conversation can differ from this intended impression.

Each posting device receives its own dismissible account-update screen and a persistent banner. It can reopen the screen. Animation stops within five seconds and respects reduced-motion settings. Read-only team links do not reveal the private role card or notices.

At reveal, original posts reappear, Eydís regains writing access, Mikko’s contributions become visible to others, and the injected posts are labelled. Ordinary host moderation stays in force. Every person receives a specific explanation; Elias and Jógvan learn that a third party represented by the simulation manipulated the debate on their side. No real account credentials are changed, no external profiles are accessed, and no AI/bot service is connected.

## Rehearsal checks

### Joining and identifying teams

Participants must enter a complete, recognised first name, surname or full name from one of the seven paper cards. Accents and capitalisation are optional. Unknown names, mixed identities and partial surnames such as “Eydis J” show a clear error and cannot join. The preview also warns when that card is already claimed. The server repeats validation; bypassing the browser form does not bypass matching.

On joining, the card is linked to a fixed participant ID and its public username. Future posts, access checks, mentions and incidents use IDs, not another fuzzy name lookup. Host controls display the fictional name, town, username and planned incident together. Search for “Mats” to find steady-pine. This identifies a workshop role, not a verified real-world person: participants must use their assigned card and keep their device with their team.

### Writing, questions and social cues

**Feed** shows the composer and live conversations. **Discover** shows cards for the other joined members, without the feed. The sidebar lists joined members by username only, with your own username first. Click a name to open that profile. **Edit profile** contains only profile editing. Paper-role notes remain defined in code and on the printed cards; they are not shown in the app. Participants cannot create read-only team links from the interface.

- Participants write their post or question and publish. Use **Reply** to keep a question or answer in the original conversation; replies stay in that conversation.
- Type `@` in the post to open the member menu; keep typing to filter it. Choose with a click/tap or the arrow keys and Enter; Escape closes it. Only public usernames identify mentions. A visible mention produces a notification for that team and appears under **Tagged posts** on its public profile. Click a mention to open that profile.
- Type a hashtag in your post. Click a hashtag in a post or the trending list to filter the feed; **Show all posts** removes the filter.
- The sidebar shows the top five: initially #1 **#AffordableJourneys**, #2 **#ServiceFirst**, #3 **#FreeUnder25**, #4 **#KeepFares**, #5 **#FreeUnder20**. Other topics, such as **#FareCap**, enter the ranking when used. These start at zero, clearly labelled as starter topics. Once posts appear, frequency ranks the top five; ties use starter order, then alphabetical order. A repeated tag in one post counts once; capitalisation does not split a topic. Linnea can also introduce #EveningFreedom. Trending hashtags stays below the navigation in the desktop sidebar. On phones, its compact section follows the active feed or Discover page instead of appearing above it.
- Top-right notifications show the full post text and **View post**. A confirmed genuine send says **You have created this post**. A simulated post says **A post appeared under your name**. Mentions identify the public username that tagged the team. The feed updates every two seconds, and incoming posts are highlighted.
- Alerts wait until a modal is closed, remain available in **Activity**, and are not replayed on every poll or reload. Notifications pause dismissal while hovered or focused. Browser/system notification permission is not needed.
- Hidden or moderated posts are excluded from other teams’ notifications, mentions and trending counts as well as their feed. Mikko sees his own contributions, but they cannot notify another participant during suppression. At reveal the restored visible content contributes again. A simulated reversal uses #KeepFares and #ServiceFirst, so the visible hashtag ranking can shift alongside the apparent opinions.

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
