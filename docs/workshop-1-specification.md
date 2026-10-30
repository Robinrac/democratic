# Workshop 1 direction and app preparation

Workshop 1 explores a societal question: **What happens to democracy when digital
information and systems affect whose voices are heard?** Six fictional youth
associations take part in a municipal consultation about a central youth center,
with different interests and procedural information.

Robin supplied the current material on 30 October 2026 and asked for documentation
first, preparing for an addition to this app. The workshop content is maintained
in the Nordic Youth Conference workspace:

- [Workshop overview and open decisions](../../nyc/knowledge/workshops/workshop-1.md)
- [Six participant association cards](../../nyc/materials/workshop-1/association-cards.md)
- [Facilitator guide and source voting notices](../../nyc/materials/workshop-1/facilitator-guide.md)
- [App preparation brief](../../nyc/materials/workshop-1/app-preparation.md)
- [Original supplied material](../../nyc/inbox/2026-10-30-workshop-1/workshop-1-original.txt)

These links require the sibling `nyc` workspace. The overview and materials are
the working content reference; this file is an app-facing entry point, not a
second copy of the workshop plan.

## Current implementation

On 30 October Robin requested a first implementation inside the existing app:
a separate Workshop 1 room, a workshop selector in the host menu displaying the
Hacked title for Workshop 2, the same general design and QR flow, no participant
posting, and no browsing of other associations. He explicitly deferred the news
feed itself at that stage. His later request now adds organization-specific
news, as detailed in the [news guide](workshop-1-news.md). Other future ideas
in the preparation brief remain outside the implementation.

- Host creation and saved-session labels show both workshop numbers and titles.
- Workshop 1 has six associations. Each team enters its organization name
  on one shared device; refresh reconnects that device to its association.
- The name-only join form immediately previews the matching banner, name, and
  member count. The same card appears in the top-left sidebar after joining.
  There is no directory, profile editor, composer, reply, or recovery response form.
- Both workshops use the Circle News name across participant, projector, and host
  screens. The feed is labeled News feed. Workshop 1 has no News sidebar link
  or ‘Whose voice is heard?’ sidebar box.
- Each organization receives eight complete news articles on joining: four
  tailored pieces and four shared pieces, including a common budget explainer.
  The edition has 28 articles and seven original generated editorial images.
  Category filters and an accessible article reader work on phones and desktops.
  Audience selection is server-side; private framing notes remain in the host
  guide and export. No original voting notices or staged news releases are added.
- The same projector and QR generator produce the selected room's link. Room
  links remain separate so Workshop 1 and Workshop 2 can run independently.
- Host controls include readiness, ending the room, export, deletion, and rehearsal
  reset, plus activating and closing voting. Reset preserves the workshop type,
  clears ballots, and invalidates existing team access.
- The server rejects Workshop 1 forum writing, profile lookups, and Workshop 2 incident
  actions. Old saved sessions default to Workshop 2.

Organization names identify assigned paper profiles; they are not secret
credentials. Matching accepts capitalization differences, optional “The”,
“and” or “&”, and unique name words. Ambiguous or unknown names never select
a profile. The preview returns only the matching name, banner, size, and card ID,
without claim state, ballots, or a list of other organizations. Six complete
banners are copied from the NYC graphics pack into `assets/association-banners/`. A claimed association
cannot be claimed by another device. Extra-device sharing is outside this first scope.

## Weighted voting

Robin's next instruction adds host-activated voting with a mandate based on
association size, choices of For, Against, and Vote blank, a private host overview,
and a prominent leading result. This supersedes the earlier proposal for equally
weighted association responses and an Undecided option.

| Organization | Members | Mandate |
|---|---:|---:|
| Creative and Cultural Collective | 180 | 180 |
| Suburban and Rural Youth Network | 240 | 240 |
| Local Sports Alliance | 350 | 350 |
| Gaming and Tech Society | 210 | 210 |
| Student Union and Youth Council | 300 | 300 |
| Environmental and Climate Action Group | 160 | 160 |
| Total | 1440 | 1440 |

The source documents supply member counts, not a conversion formula. The
implementation uses one member as one unit of voting weight. It uses the sports
profile's explicit 350 active members rather than its vague “thousands” wording.

Voting is initially inactive. **Activate voting** reveals the Vote sidebar and
navigation entry. On phones up to 760 pixels wide, an announcement opens once
for the active ballot and links to that section. **Start voting** opens the
case question and the three choices. **Submit vote** records one
ballot for the signed-in organization, which the team cannot change itself. The confirmation states the choice and
number of members represented; **Back to feed** returns focus and scroll to News feed.

The server supplies the weight from the association record; a client cannot
choose its weight or vote for another organization's identity. Repeated identical
requests return the original receipt, including after closing, without counting
again, unless the host deleted the ballot. Deleted request IDs are rejected. Pending submissions survive reloads and reconcile against the team's
private receipt after a lost response. Only that organization's ballot appears
in its participant response. Other organizations’ ballots and aggregate results are host-only.

The host table distinguishes not joined, not voted, For, Against, and Blank.
The main lead compares weighted For and Against totals. Zero substantive votes
shows no lead; equal nonzero totals show a tie. Blank votes count toward weighted
turnout but do not support either side. This is a lead, not a declared legal or
binding municipal decision. No quorum or adoption threshold is imposed.

Closing voting or ending the session stops new votes. Pausing the room blocks
new submissions until resumed. Existing receipts remain retrievable. Rehearsal
reset clears all votes and activation; closed voting is not reopened independently.
Existing Workshop 1 rooms without stored voting state begin inactive.

## Host vote controls

Robin requested the ability to delete an organization's vote or mark it as
“does not count” to influence the workshop outcome. Each submitted ballot now
has host controls in its row:

- **Does not count** retains the choice and membership but excludes its full
  weight from For, Against or Blank totals and the leading result.
- **Count vote** reverses that exclusion without asking the team to vote again.
- **Delete vote** confirms the organization, choice and weight before removing
  the current ballot. The team can submit a new ballot only while voting is
  open and unpaused. A delayed retry of the removed ballot cannot restore it.

These controls work in open, paused, closed and ended rooms until expiry. They
do not reopen voting. The host sees submitted weight, counted weight and excluded
weight separately, plus “Vote deleted” on cleared rows. Deleted votes are no
longer part of current participation. Teams see only their own exclusion or
deletion status; they cannot read the host history or another organization's vote.

Each adjustment records the organization, action, choice, weight, previous
counting status and time in the private history and session export. Delete means
removal of the current ballot, not erasure of this workshop history. Rehearsal
reset clears votes and history. Existing votes default to counted. Host retries
are idempotent; session versions and ballot identities protect replacement votes
from stale controls. Participant polling follows server versions instead of
restoring an old locally cached confirmation.

## Verification and remaining work

Server checks cover isolation, rejected writing, invalid joins, duplicate joins,
legacy Workshop 2 sessions, reset, and persisted access after restart. Browser
checks cover host selection, phone and desktop layouts, QR links, reconnecting,
resetting, and switching rooms while a response is delayed. The existing full
Workshop 2 rehearsal and conversation tests also pass.

Voting checks cover membership weights, privacy, ties, blanks, concurrency,
retries, pause/close, reset, restart persistence, mobile navigation, and lost
responses. News checks cover all six selections, credential isolation, host
framing notes, media, article readers and filters. Simulated barriers, accessible
facilitator-entered ballots, and final timing remain future work. No Point implementation record
has been created for Workshop 1. No public deployment or commit was made.
