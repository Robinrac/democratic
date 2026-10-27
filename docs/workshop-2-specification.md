# Workshop 2 specification

Democratic's planned Open Circle experience is specified in Point record
`democratic-workshop-two-open-circle-20261027`. In this workspace, the record is
at `../patchpoint/point/features/democratic-workshop-two-open-circle-20261027/`
from the Democratic repository root. The Point record is the source of truth for
requirements, acceptance criteria, technical decisions, and implementation tasks.
It is a **draft plan**; none of the new features described here is implemented yet.

## Workshop flow

| Minute | What happens |
| --- | --- |
| 0–12 | Opening presentation: privacy and independent thought; freedom of expression and safe participation; the Open Circle case and fictional-role instructions. |
| 12–30 | Teams join, read one of seven fictional roles, build a public username profile, and post genuine opinions. Setup and posting overlap; teams that finish early post immediately. |
| 30–33 | The host triggers a post under each team's handle that exposes its fictional full name and town. |
| 33–38 | The host triggers two contradictory posts and three tagged scripted reactions per account. |
| 38–43 | Teams discuss which words are theirs and how the incident affects participation. |
| 43–48 | The app reveals provenance; teams correct the record and consider account, forum, and organizer responses. |
| 48–54 | Whole-room discussion. |
| 54–59 | Closing: one insight and one safeguard per team. |
| 59–60 | Buffer. |

The forum's one question is: **Should Open Circle require public real names on
every post, or allow public usernames?** Participants speak as fictional people
from Iceland, the Faroe Islands, Norway, Åland, Sweden, and Finland. Their real
attendee identities are not requested. The seven complete role cards and exact
incident wording are in Point's `feature.md`. The participant-facing text and
seven separate cartoon portraits are in [the role cards](workshop-2-role-cards.md).

## Build map

| Capability | Point requirements |
| --- | --- |
| Session, seven private roles, generated public handles, QR/link and observers | R-002, R-003, R-011, R-012 |
| Pinned question, bio, stance, shared posts and replies | R-001, R-004, R-005 |
| Private host controls and projected presenter view | R-006 |
| Exposure, forged posts, reactions, flags and readable threads | R-007, R-008 |
| Provenance reveal, correction and forum notice | R-009 |
| Moderation, reset, expiry, accessibility and rehearsal | R-010, R-013, R-014 |
| Public HTTPS service, persistent data and operational runbook | R-015 |

The recommended hosting path in Point's `plan.md` is the existing Node server
on [Render](https://render.com/docs/free) with a [Neon Postgres
database](https://neon.com/blog/neon-free-plan-1-gb-per-project). Render Free is
suitable for rehearsal but can spin down or restart during a live session. The
host should decide whether to use an always-on paid web-service tier for the
event. [Vercel](https://vercel.com/docs/functions) requires adapting this
server to functions and adding an external database; its free
[Hobby plan](https://vercel.com/docs/plans/hobby) is limited to personal,
non-commercial use. No hosting provider or database has been provisioned by
this specification.

Run Point's checks from the Point repository:

```powershell
py -3 scripts/feature_record.py validate democratic-workshop-two-open-circle-20261027
py -3 scripts/feature_record.py analyze democratic-workshop-two-open-circle-20261027 --json
```

The current app remains the baseline at commit
`628cfd12bd2a64cab6b20766420481b5c2c170ce`. Its shared feed, profiles,
and presenter QR exist; the identity split, incident, recovery, and persistence
in this plan still need implementation.
