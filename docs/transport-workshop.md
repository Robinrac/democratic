# Open Circle: youth transport workshop

New sessions use the transport scenario. Earlier sessions retain their original anonymous-name debate. Create a new rehearsal in `/host` and use its participant link or QR. The root URL is the welcome page, not a workshop room.

The existing Open Circle design, profile modal, portraits, Neon connection and Render hosting are retained. The participant-facing transport copy is in `workshop/transport.mjs`; `roles.mjs` and the earlier role-card document retain identity/portrait data and archived scenario content. The seven current paper cards are in the existing Canva design.

## Running the hour

| Minutes | Host action and participant activity |
| --- | --- |
| 0–10 | Introduce the subject and the workshop. Explain that this is fictional role play; use the paper identity, never real personal details. |
| 10–16 | Hand out cards and create profiles. Open debate when teams are ready; early finishers can start. |
| 16–28 | Genuine discussion: five different proposals for lower fares, two objections. Teams select the broad stance and explain their specific proposal in their own words. |
| 28–30 | Check names and usernames in the private host preview. Confirm **Launch incident** once. |
| 30–38 | Observe the changed feed and the private account updates. Teams choose how to respond. |
| 38–43 | **Begin reflection**. Compare what the feed seems to say with the earlier conversation. |
| 43–50 | **Reveal and restore**. Read the role-specific explanation, inspect labelled posts and publish corrections. |
| 50–58 | **Begin room discussion**. Distinguish genuine opinion, visible opinion and who had the ability to speak. |
| 58–60 | **Begin closing**, then **End session**. Clear the room’s data when finished or let its chosen expiry apply. |

Nothing advances on a timer. The launch requires all seven roles to join and publish a top-level genuine position matching their card. The latest unhidden genuine position is used, so an accidental selection can be corrected by publishing again. Replies do not count as a baseline position. Host name search accepts accents or plain spelling. The fixed paper identity determines the incident; usernames, bios and avatar choices do not change it.

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

Run `npm test` and `npm run test:browser`. If using installed Edge, set `PLAYWRIGHT_CHANNEL=msedge`. The transport tests cover all seven outcomes, private projections, duplicate-launch protection, host lookup, mobile layout, reloads, reduced motion, baseline correction and restoration. Legacy tests cover existing archived sessions as well.

Before the event, rehearse with seven separate devices/browser profiles, check venue connectivity and create a clean live session. Use the host’s **Open participant view** link; an older room keeps its older scenario. Never project the private host controls.
