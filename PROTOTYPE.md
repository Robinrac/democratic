---
provenance: Robin's simplification request and verified local implementation, 2026-10-19
captured: 2026-10-19
sensitivity: personal-private
status: simplified shared-feed prototype ready for review
---

# Workshop 2 app location and prototype

The app lives at **C:\Users\robin\ws\nordic-youth-workshop**, outside the LifeOS source and private USER trees.

## Current version

Robin asked to remove many features and focus on everyone joining, receiving a name, posting and seeing each other's posts.

The English app now provides:
- One-click joining without email/password.
- A unique fictional name assigned to each browser identity.
- Short posts in a shared feed, updated automatically every two seconds.
- A presenter screen with a generated QR code and count of joined identities.
- Pink-led styling based on the supplied palette and Munia-inspired cards. Cybersecurity Academy branding was removed at Robin's request.

Each browser retains its name on reload. People sharing a browser/device share that identity. Posts and identities live in server memory and clear when the server restarts. No participant information is written to the app source or disk.

## Open and start

- App: http://localhost:4173/
- Current LAN presenter QR: http://192.168.1.75:4173/?presenter=1
- Phone-width preview: http://localhost:4173/phone-preview.html
- Start instructions: C:\Users\robin\ws\nordic-youth-workshop\README.md
- Verification: C:\Users\robin\ws\nordic-youth-workshop\VERIFICATION.md

Run npm start in the project folder for computer-only testing, or npm run dev:lan for devices on the same network. Use the active network adapter's address, which may change. The process is a manually started local server, not an installed service. Nothing is publicly deployed. Free hosting remains to be chosen; the shared feed now needs a backend rather than static-only hosting.

## Workshop boundary

The feed is the simpler foundation for Workshop 2. The opening discussion prompt concerns feeling safe expressing an opinion online. Posting alone does not yet demonstrate Topic 3 (privacy and independent thought) or Topic 2 (safe expression and participation). A minimal incident and reflection still need to be designed.

The earlier private-account exploration, proposal alteration, deadline and recovery simulation is preserved under archive/simulation-v1 in the app project and is no longer in the active flow. The individual perspective remains the target. No unequal information feeds, group misinformation or collective decision simulation have been added.

## Review status

Four integration tests pass. Two browser identities received distinct names, published posts, and saw each other's posts through automatic updates. Reload preserved the identity. A 390px mobile layout and LAN presenter QR were reviewed. Physical phone access and an audience pilot remain to be tested.

The earlier APP-CONCEPT, WORKSHOP-2-DESIGN-DRAFT and RESEARCH-AND-REFINEMENT files preserve earlier proposals. This file describes the current simplified implementation.


Domain and implementation clarification: Robin proposed godvana.se; it is under consideration and has not been configured. Munia was used as a visual reference, not as the app code base. The current shared-feed app was written separately. Robin noted that the appearance differs substantially from the reference.
Social profile update, 2026-10-19: Robin requested the Munia profile section. The app now includes Feed/Discover/My Profile navigation; cover, avatar, assigned name/handle, public bio, own posts, Posts/About tabs and a profile editor for bio and color presets. Unlike the earlier inspiration-only version, social-ui.js now ports the structure of Munia ProfileHeader and MenuBar components with MIT attribution. This is not the full Munia application stack. Eight integration tests pass; profile editing, posting, reload and viewing another participant on mobile were checked. The host QR page remains password protected. Open the profile at http://localhost:4173/#profile.
