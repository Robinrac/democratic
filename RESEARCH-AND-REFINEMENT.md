---
provenance: Robin's workshop requirements and primary research reviewed 2026-10-19
captured: 2026-10-19
sensitivity: personal-private
status: proposed refinement for review, not an approved implementation plan
---

# Workshop 2 research and proposed improvements

For **Hacked: Who Speaks for You?**, build a short fictional consultation experience in which groups submit a contribution, investigate the private account information an intruder could see, discover an altered submission, and work out how to restore the person's voice. Keep the central learning about **privacy and independent thought (topic 3)** and **freedom of expression and safe participation (topic 2)**.

The strongest improvement is to give the character a civic purpose before the incident and give participants a useful response afterwards. A four-day build is plausible for a scripted static app with two small profile variants. The main uncertainties are the story's clarity, mobile usability and facilitation timing; more generated code cannot settle those.

## Evidence worth adapting

These examples support particular design choices. None establishes that this proposed workshop will change democratic participation or produce lasting behavior change.

| Example | Evidence and limits | Adaptation for this workshop |
| --- | --- | --- |
| [iBuddy privacy simulation](https://link.springer.com/article/10.1007/s11423-023-10309-x) | Evaluated with 978 students across 52 sessions. Strong enjoyment and perceived-usefulness feedback. No controlled pre/post competence assessment; only 124 of 563 contacted students answered the follow-up. Its real-device data collection is unsuitable for our design. | Borrow a visible revelation followed by substantial debriefing. Use entirely fictional account material and explain that the exercise is a simulation. |
| [Tactical Tech workshops](https://www.theglassroom.org/workshops/) and [youth co-design experience](https://tacticaltech.org/news/stories/building-together/) | Established discussion and activity formats; the organization describes international testing and revisions prompted by youth/partner feedback. This is practitioner evidence rather than controlled effectiveness evidence. | Ask whose access matters and why; end with actions participants can explain. Test wording with people unfamiliar with the design. |
| [Bad News controlled study](https://research.vu.nl/en/publications/good-news-about-bad-news-gamified-inoculation-boosts-confidence-a/) and [extended replications](https://pmc.ncbi.nlm.nih.gov/articles/PMC10573624/) | The 196-person original controlled study reported improved misinformation judgments. Four later replications found reduced belief in true as well as false material, with little evidence of improved discrimination. These findings concern misinformation, not this privacy exercise. | Use active choices and feedback, but reward justified distinctions. Include supported observations alongside unsupported inferences. Increased distrust is not our success measure. |
| [Desperate John privacy escape room](https://link.springer.com/article/10.1007/s10207-025-01037-9) | An 81-adult pre/post study reported questionnaire improvements and included practical tasks. It lacked a separate control group. Sessions required at least 90 minutes; 21 of 27 groups finished within the game time. | Make participants apply a remedy, but keep the route to the learning reveal independent of puzzle-solving skill. A full escape room would consume too much of our hour. |

## Weaknesses in the earlier concept

1. **The democracy connection can arrive too late.** Browsing someone's likes and contacts can feel like a general privacy lesson. Start with an actual contribution to a fictional youth consultation and return to whether that contribution can still be heard accurately.
2. **A dossier can reward overconfident profiling.** A reading history cannot establish a person's beliefs. Replace personality guessing with three evidence judgments: supported, plausible but uncertain, and unsupported. Do not score participants for inferring sensitive identities or political affiliations.
3. **A surprise without ownership may feel artificial.** Let groups choose a profile and endorse a short proposal before the incident. The reveal then changes something they remember choosing.
4. **A hacking puzzle can become the whole activity.** State that an unauthorized session has occurred. Let everyone reach the relevant account view without password guessing, coding, or a timer that locks them out.
5. **Exposure and editing can become two unrelated stories.** Use one compromised account with explicitly stated permissions to view private activity and edit submissions. Reading access alone must not be presented as automatically granting editing rights.
6. **A frightening ending can undermine the intended lesson.** Add a recovery decision and a credible route to continued participation. Ask what support the person needs, allowing different answers about whether they would continue immediately.
7. **Four tabs and five actor discussions can overload the hour.** Cap each profile at six to eight short account items. Give each group one contrasting pair of actors, then compare answers across the room.

## Revised app sequence

### 1 Choose a person and contribute

The presenter view displays a large generated QR code and readable link. Participants work in pairs or small groups on one device. They choose between two fictional profiles in the same fictional consultation. Both profiles use the same interaction sequence, with a small amount of different content.

Each profile has a clear goal. For example, one wants the youth centre open until 21:00 on two evenings each week. The group chooses between two prepared proposal versions and confirms its submission. This avoids a lengthy writing exercise while making the contribution theirs to defend. All proposed names, issues and text remain open for Robin's review.

### 2 Investigate what an intruder could see

Show a clearly labeled simulation of a compromised account. Six to eight short items cover follows, saved or read articles, memberships and messages inside this fictional platform. Do not imply the platform can read unrelated apps or the whole phone.

For example:

- A saved article about noise around the youth centre.
- A private message asking whether the final bus would still run after an evening meeting.
- Membership of a consultation discussion group.

Groups judge three possible claims. The record can support that an article was saved, but cannot by itself show agreement with it. The group membership is exposed even if outsiders' conclusions about the member are wrong. This distinction keeps privacy valuable without treating all inference as accurate.

### 3 Reveal the loss of control

On Robin's spoken cue, groups press Continue. The app first shows their selected conclusions beside the evidence and the limits of that evidence. Then it shows the original proposal beside the version currently appearing under the profile's name.

Example: the original requests two later opening evenings; the altered version requests ending evening opening. An outsider has used the saved noise article to claim that this version reflects the person's wishes. The change is scripted and occurs only in the fictional exercise.

The intended realization is: **Private activity can be used to tell a misleading story about me, while an altered account can put words in my name that I never chose. What would let me participate with confidence again?**

Do not reveal a supposedly definitive hidden political identity. Use additional context only where it genuinely resolves an ambiguity, and leave other conclusions uncertain. Explain the difference between privacy exposure, false inference, and unauthorized editing.

### 4 Restore the person's voice

Offer a small set of response cards and ask groups to select an immediate response and a platform improvement, explaining what each helps with and what remains unresolved.

In this fictional system, restoring the account and correcting the submission can address impersonation; a correction process must also reach the consultation organizer. A version record can help establish what changed but does not itself stop access. Reducing unnecessary activity storage limits future exposure but cannot retrieve information already copied. Monitoring everyone's private messages would introduce a different privacy problem.

Use brief authored explanations, with no universal score for the best political or privacy preference. Keep implementation-specific recovery guidance for the later facilitator material, checked against the chosen technical scenario.

### 5 Discuss access and participation

Move the main discussion into the room. Assign each group one actor comparison, for example a friend versus an employer, or an app service versus a political organization. Ask what information is needed, for what purpose, with whose knowledge, and with what consequences. Consensual service use and unauthorized access should remain distinct.

Close by asking what the person, platform and consultation organizer each need to do to protect continued participation.

## Coverage of the eight topics

| Topic | Place in this proposal |
| --- | --- |
| 1 Trustworthy information | Secondary: an attributed proposal may have been changed. Workshop 1 retains the wider information-manipulation focus. |
| 2 Safe expression and participation | Core: confidence to speak, organize and contribute after an incident. |
| 3 Privacy and independent thought | Core: private exploration and relationships, including the limits of inference. |
| 4 Social engineering | Optional single-sentence incident cause. No phishing subgame. |
| 5 Democratic organizations | Recovery responsibility shared with the platform and consultation organizer. |
| 6 Trust in systems | What evidence and correction process would make participation trustworthy again? |
| 7 Digital inclusion | Phone layout, shared devices, clear English and printed fallback. |
| 8 Harmful security measures | One response comparison: protection should not require indiscriminate surveillance. |

## Provisional sixty minute workshop

The supplied draft schedule lists Cybersecurity academy in two one-hour Digital-track slots, 13:00-14:00 and 16:15-17:15. It does not assign titles, and its currency is unconfirmed. Use 60 minutes as the planning assumption.

| Minutes | Activity |
| --- | --- |
| 0-8 | Opening presentation and fictional scenario instructions. |
| 8-12 | Scan QR, form groups and choose profiles. |
| 12-16 | Choose and submit a proposal. |
| 16-25 | Investigate private activity and judge three claims. |
| 25-30 | Reveal, compare original and altered proposal, brief group reaction. |
| 30-38 | Choose responses and explain what each would fix. |
| 38-48 | Actor comparisons and whole-room democratic participation discussion. |
| 48-56 | Closing and a new short example to check learning. |
| 56-60 | Buffer, questions and transition. |

If the exercise runs late, reduce the number of report-backs rather than dropping the recovery or closing. The facilitator should be able to show the reveal directly on the projector if joining fails.

## Four day delivery boundary

| Day | Deliverable and completion check |
| --- | --- |
| 1 | Finalize one civic scenario, two small profiles, evidence cards and reveal wording. Walk through a paper or clickable draft with Robin and Hanna if available. Every interaction must serve a stated learning outcome. |
| 2 | Complete the working phone app: QR presenter view, profile choice, local proposal choice, evidence judgments, reveal, recovery cards and reset. Exercise the whole path on an actual phone. |
| 3 | Pilot with 3-5 people unfamiliar with the script, ideally including someone close to the participant age range. Observe without explaining away confusion. Revise content, pacing and usability; do not add another game. |
| 4 | Freeze features, finish facilitator notes and printable cards, verify the hosting/QR route when publication is authorized, rehearse the full hour and prepare a projector-only fallback. |

Must-have functionality is static and scripted. Answers stay on the device; no sign-in, database, live group synchronization, participant analytics or AI calls are needed. Stage transitions use spoken cues and local Continue buttons. That is facilitation, not a secure lock against skipping ahead.

Use AI for implementation, alternate wording, accessibility checks and test assistance. Review every fictional clue and conclusion before delivery. Live-generated profiles or chatbots would make the lesson less predictable and add cost and failure modes.

A free static host is a viable deployment route. [Cloudflare Pages documents a Free plan](https://developers.cloudflare.com/pages/platform/limits/) and [Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/) without requiring a public source repository. Publish only the standalone fictional app assets when authorized. The private LifeOS source and USER documents are not deployment inputs. Check ordinary host logging before making any participant-facing privacy statement.

## How to know the exercise works

Use a fresh closing example rather than repeating the exact in-app answers. Ask participants to identify one supported observation and one unsupported inference, explain a possible effect on democratic participation, and name one individual action plus one organizational responsibility.

In the pilot, check whether people can do this without facilitator hints and whether the exercise fits the allotted time. If they remember only that accounts can be hacked, strengthen the connection to voice and participation. If they conclude that all information is untrustworthy, improve the evidence distinctions. If they conclude that withdrawal is the only response, improve the recovery task.

These are practical acceptance checks for a workshop. Demonstrating lasting changes in behavior would require a separate evaluation design.
