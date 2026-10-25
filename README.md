# Hacked: Who Speaks for You?

A small English social app for Workshop 2 at Nordic Youth Conference, exploring privacy, identity and the freedom to participate.

## Run locally

Requires Node.js 20 or newer. No build step is needed.

```sh
npm ci --ignore-scripts
npm start
```

Open http://localhost:4173. To let phones on the same network connect:

```sh
npm run dev:lan
```

Use the network URL printed by the server. A localhost link only works on the computer running the server. `PORT` and `HOST` can override the listening address.

## Current experience

1. A welcome popup invites the participant to reveal a fictional identity.
2. Their assigned name, handle, avatar and cover are shown clearly.
3. **Begin** opens the shared feed.
4. Participants can post, discover others and view profiles.
5. They can edit their bio, avatar palette and cover, while keeping their assigned name.

The feed updates every two seconds. Session identity is stored in the browser. All workshop data lives in server memory: restarting the server clears posts and invalidates identities. No participant data is written to disk.

The app is a workshop foundation. The privacy exposure, impersonation incident and guided recovery exercise are not implemented in this simplified version.

## Presenter and QR

Open `/?presenter=1`, or use the hidden entry in the top-right corner. Keyboard focus reveals the entry. The presenter page displays a QR code, participant link and joined count.

The default prototype host password is `password`. Set `HOST_PASSWORD` when running outside a local demonstration. Host access is checked by the server with expiring HttpOnly sessions. Participant access requires no real name, email or password.

## Design

White outer canvas with CSA palette section colors, varied profile themes and lightweight motion that respects reduced-motion preferences. The visible app does not use the Cybersecurity Academy name or logo.

## Development

```sh
npm test
```

- `server.mjs`: HTTP server, workshop API and host access.
- `dist/participant.js`: participant experience and identity welcome.
- `dist/social-ui.js`: profile and navigation templates.
- `dist/profile-themes.js`: seven profile themes and appearance assignment.
- `dist/app.js`: presenter page and entry routing.
- `dist/styles.css`: responsive design and animation.
- `host-login.html`: server-gated host login template.
- `tests/`: shared-feed, profile and host-access integration tests.

Text-only posts are limited to 500 characters. The server assigns authors, validates profile changes and rejects unrelated cross-origin writes. Posts are rendered as text. This is a facilitated workshop prototype, not a production social network.

## Hosting

Publishing the repository does not deploy the app. Shared posts need the Node server or an equivalent backend; static hosting of `dist` alone will not work. No public app deployment or custom domain is configured.

## Third-party notices

Profile and navigation structure is adapted from [Munia](https://github.com/leandronorcio/munia), revision `577868b63adf2b3d61e25809bd665f8c7687c141`, Copyright 2023 Leandro Norcio, MIT. See `dist/vendor/MUNIA-LICENSE.txt`. This app does not use Munia's full framework/backend stack.

QR generation uses qrcode-generator 1.4.4. Its MIT license header is retained in `dist/vendor/qrcode.js`.

## Preview

![Identity welcome](docs/identity-welcome.png)

![Shared social feed](docs/csa-color-sections.png)
