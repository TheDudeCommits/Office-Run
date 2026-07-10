# Office Run Implementation Plan

This file is the authoritative build loop. A phase is complete only when every item is checked and the evidence listed beneath it exists.

## Phase 0 — Pre-production and legal safety

- [x] Lock the creative brief and recommended defaults.
- [x] Write the full game design document.
- [x] Research free assets and verify their licenses at the source.
- [x] Pull the selected CC0 office art and UI audio into the project.
- [x] Create `ASSETS.md` with source, author, license, file mapping, and modifications.
- [x] Define privacy behavior for photo avatars; do not require or expose an API key.

**Evidence:** `docs/GDD.md`, `ASSETS.md`, `public/assets/office/`, `public/audio/`.

## Phase 1 — Product shell and game foundation

- [x] Replace the starter preview with the Office Run title screen and responsive game shell.
- [x] Add Phaser as a client-only game runtime.
- [x] Create the 960×540 pixel-art world, parallax office, floor, lighting, and CRT treatment.
- [x] Add Chip Deadline with run, jump, double-jump, duck, and damage states.
- [x] Add keyboard and touch input with accessible external controls.
- [x] Establish React ↔ game state events for HUD and overlays.

**Exit gate:** a player can start, move, pause, resume, and restart a run without console errors.

## Phase 2 — Endless runner systems

- [x] Implement continuous speed ramp and safe procedural spawn scheduling.
- [x] Implement sanity, invulnerability, collisions, scoring, streaks, and close-call bonuses.
- [x] Add at least eight mechanically distinct office hazards.
- [x] Add readable speech tells and corporate copy.
- [x] Add quarter/fiscal-year progression and environment palette shifts.
- [x] Add game-over performance reviews and instant retry.

**Exit gate:** a complete run progresses, becomes harder, ends correctly, and can restart repeatedly.

## Phase 3 — Power-ups and boss pressure

- [x] Add Coffee, Headphones, PTO, Inbox Zero, and Work From Home.
- [x] Add held-power-up activation and HUD timers.
- [x] Add authored Reply-All Storm patterns.
- [x] Add Circle-Back Boss events with multi-step attacks.
- [x] Prevent impossible obstacle combinations at all supported speeds.

**Exit gate:** every power-up changes play, and at least one boss cycle can be reached and survived.

## Phase 4 — Personalization and persistence

- [x] Add local photo upload, crop, palette quantization, and pixel-avatar generation.
- [x] Keep processing entirely on-device and discard the source image after conversion.
- [x] Add custom cosmetic palette and playful local profile title.
- [x] Add reset-to-Chip behavior.
- [x] Persist avatar output, preferences, high score, and recent runs locally.

**Exit gate:** a user can create, play with, reload, and remove a custom avatar without a network upload.

## Phase 5 — Juice, audio, accessibility, and responsive polish

- [x] Integrate licensed CC0 SFX and procedural chiptune music.
- [x] Add particles, hit feedback, milestone stingers, and restrained screen shake.
- [x] Add separate music/SFX toggles, pause, and reduced-motion mode.
- [x] Add strong focus states, semantic controls, readable contrast, and non-color hazard cues.
- [x] Polish desktop, landscape mobile, and portrait fallback layouts.
- [x] Add site metadata, favicon, and bespoke social preview card.

**Exit gate:** the game is comfortable, readable, and polished across input modes and breakpoints.

## Phase 6 — Verification and release

- [x] Add deterministic unit tests for helpers and game data.
- [x] Replace starter tests with product-specific rendered-output checks.
- [x] Run lint, tests, and production build; resolve failures.
- [x] Verify the complete game flow in a real browser, including mobile layout and the local avatar conversion path.
- [x] Confirm zero secrets, starter artifacts, unclear-license assets, or broken links are committed.
- [x] Update README with controls, architecture, privacy, licenses, and local development.
- [x] Commit and push the completed project to `AmirTheDude69/Office-Run`.
- [x] Deploy publicly and verify the production URL.
- [x] Perform a requirement-by-requirement completion audit.

**Exit gate:** GitHub contains the verified source and the public URL supports a complete play session.
