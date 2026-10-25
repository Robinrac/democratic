---
provenance: Robin direct message, 2026-10-19
captured: 2026-10-19
sensitivity: personal-private
status: draft concept for Robin to review
---

# App for Workshop 2: Hacked: Who Speaks for You?

This file records an earlier proposal-centered app concept. The latest privacy-led design proposal and 60-minute workshop structure are in `WORKSHOP-2-DESIGN-DRAFT.md`. Neither design is final.

## Confirmed intent

- Robin will personally focus only on Workshop 2.
- Robin intends to develop an app for the workshop.
- The app should be very simple and hosted for free.
- Robin wants to display a large QR code on the presentation screen that opens the app on participants' phones.
- Workshop 2 concerns the individual impact on democratic participation when a digital platform, participant information, or submitted proposals are accessed by someone else.
- Alex's fictional account was only a loose suggestion. Robin does not particularly like that direction. It must not be treated as the app specification.

## Core question

If a proposal is changed after it is submitted and the changed version appears under your profile, whose view reaches the decision-makers? What would it take to restore your voice and trust in the process?

## Chosen interaction

Robin chose a **fictional profile selected by each group** and an incident that **alters a proposal submitted in that profile's name**. This is a simulated unauthorized access event, not a real account breach or a hacking tutorial. The exact story and screen wording are still draft.

## Proposed three-screen experience

1. **Choose and submit.** A pair or small group selects one of two or three fictional youth profiles. Each profile has a short background and a ready-made proposal on a civic issue. The group reviews the proposal and taps Submit. No real name or free-text entry is required.
2. **See the public version.** The platform shows the proposal as other participants or decision-makers would see it after an incident. A meaningful part has been changed, while the fictional profile is still shown as author. The group identifies what changed and how it changes the person's position or the likely decision.
3. **Reveal and discuss.** A side-by-side view exposes the original and altered text. The app asks: Who is speaking for this person now? Who may be influenced? Would they feel safe participating again? What should the platform and organizers do to repair the process? Answers can be discussed aloud; the app need not collect them.

The app should take roughly 8-12 minutes of a workshop session, leaving the main learning to the facilitator-led comparison and discussion. This timing is a design estimate, not a confirmed agenda. The incident should be understandable without cybersecurity knowledge and work with participants sharing a device.

## Presenter entry screen

Add a separate presenter view with the workshop title, one large QR code pointing to the participant app, and the same destination as a readable short web address. The QR should be generated from the final published address, so Robin can put this view on the projector without preparing a separate image. The participant link should open directly at the start of the exercise. Someone who cannot scan can type the address or join a nearby pair. QR entry itself needs no accounts or participant tracking.

The latest proposed workshop exercise adds private activity exposure and a response decision. The current three-screen experience predates that detail and is under review in `APP-QUESTIONNAIRE.md`; do not treat its screen count as final.

## Smallest practical build

- A static browser app with two or three fictional profile/proposal data sets, one altered public version for each, and a side-by-side reveal.
- No sign-in, backend, database, participant accounts, analytics, or saved responses.
- Responsive layout for phones and laptops; keyboard-accessible controls and readable contrast.
- A printable backup of the original and altered proposal cards in case devices or Wi-Fi fail.
- Only invented people, organizations, and proposals. Private LifeOS context stays out of the public app.

## Free-hosting candidate, checked 2026-10-19

Cloudflare Pages currently has a Free plan and supports Direct Upload of static assets from a local computer. That would allow publishing the fictional-only app without placing this private LifeOS project in a public code repository. The service and account setup should be confirmed when deployment is actually planned. Sources: https://developers.cloudflare.com/pages/platform/limits/ and https://developers.cloudflare.com/pages/get-started/direct-upload/.

## Decisions needed before implementation

1. What civic issue should the proposals concern? Keep it distinct from Workshop 1's possible youth-center decision unless there is a reason to connect them.
2. How subtle should the change be, and what exact learning point should each profile reveal?
3. How many pairs/groups are expected, and will everyone have access to at least a shared phone or laptop?
4. Is the estimated 8-12 minute app activity a good fit once the final session time and audience are known?
5. Confirm the publishing account and free host when Robin is ready to deploy.

## Current boundary

Do not place LifeOS personal files or private project context in the app's public deployment. Publish only fictional exercise content after Robin has reviewed the final experience.
