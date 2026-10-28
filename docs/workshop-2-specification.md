# Workshop 2 specification

Democratic's planned Open Circle experience is specified in Point record
`democratic-workshop-two-open-circle-20261027`. In this workspace, the record is
at `../point/features/democratic-workshop-two-open-circle-20261027/`
from the Democratic repository root. The Point record is the source of truth for
requirements, acceptance criteria, technical decisions, and implementation tasks.
It is the requirements record for the current local implementation. The app now
implements the seven-team debate, host-led simulated incident, provenance reveal,
and recovery flow. Public hosting, physical device rehearsal, and venue checks
remain open; see [the implementation record](open-circle-implementation.md) and
[operations guide](open-circle-rehearsal.md) for verified status.

## Workshop flow

| Minute | What happens |
| --- | --- |
| 0–12 | Opening presentation: privacy and independent thought; freedom of expression and safe participation; the Open Circle case and fictional-role instructions. |
| 12–30 | Teams enter their paper-role name and home town privately, receive an anonymous username, add a public bio, choose a picture and banner, and post genuine opinions. Setup and posting overlap; teams that finish early post immediately. |
| 30–33 | The host triggers a post under each team's profile that exposes its role-card full name and town. |
| 33–38 | The host triggers two contradictory posts and three tagged scripted reactions per account. |
| 38–43 | Teams discuss which words are theirs and how the incident affects participation. |
| 43–48 | The app reveals provenance; teams correct the record and consider account, forum, and organizer responses. |
| 48–54 | Whole-room discussion. |
| 54–59 | Closing: one insight and one safeguard per team. |
| 59–60 | Buffer. |

The forum's one question is: **Should Open Circle require public real names on
every post, or allow public usernames?** Participants speak as fictional people
from Iceland, the Faroe Islands, Norway, Åland, Sweden, and Finland. Teams receive
an automatically assigned public username; paper-role name and home town remain private. Joining uses the room QR/link without a host code. The app does not ask for email or password. The seven complete role cards and exact
incident wording are in Point's `feature.md`. The participant-facing text and
seven separate cartoon portraits are in [the role cards](workshop-2-role-cards.md).

## Build map

| Capability | Point requirements |
| --- | --- |
| Session, seven private roles, anonymous public profiles, private name/town and appearance choices, QR/link and required profile setup | R-002, R-003, R-011, R-012 |
| Pinned question, bio, stance, shared posts and replies | R-001, R-004, R-005 |
| Private host controls and projected presenter view | R-006 |
| Exposure, forged posts, reactions, flags and readable threads | R-007, R-008 |
| Provenance reveal, correction and forum notice | R-009 |
| Moderation, reset, expiry, accessibility and rehearsal | R-010, R-013, R-014 |
| Public HTTPS service, persistent data and operational runbook | R-015 |

The existing Node server and PostgreSQL adapter are ready for hosting configuration.
See [deployment readiness](deployment-readiness.md) for required settings and
verification. No hosting provider or database has been provisioned.

Run Point's checks from the Point repository:

```powershell
py -3 scripts/feature_record.py validate democratic-workshop-two-open-circle-20261027
py -3 scripts/feature_record.py analyze democratic-workshop-two-open-circle-20261027 --json
```

The earlier prototype baseline was
`628cfd12bd2a64cab6b20766420481b5c2c170ce`. The current local app is at
`a1e8c167bdeb428622ddd2bfc3936972b253509e`; verify the checkout before
continuing. Point remains the requirements source of truth, while the
implementation record reports which requirements have been exercised locally.
