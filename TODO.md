# Office Run Implementation Plan

This checklist records the current five-level campaign build. A phase is complete only when its code, tests, and browser evidence agree.

## Phase 1 — Campaign model

- [x] Replace the endless fiscal-quarter loop with five finite levels.
- [x] Give every level a target distance, speed curve, spawn curve, palette, and enemy roster.
- [x] Add locked progression, level select, level-complete, and campaign-complete states.
- [x] Keep the Circle-Back Boss as the level-five finale.

## Phase 2 — Joi character integration

- [x] Preserve the supplied source GIF and WebP sprite sheet.
- [x] Build an eight-frame transparent Joi run sheet from the supplied GIF.
- [x] Extract idle, celebration, and failure poses from the supplied sprite sheet.
- [x] Replace Chip with Joi in the Phaser scene, menu, copy, and documentation.
- [x] Tune Joi’s display scale and collision box independently.

## Phase 3 — Social Battery and recovery

- [x] Replace heart/sanity HP with a 0–100% Social Battery.
- [x] Remove 34% on ordinary collision and preserve optional one-hit mode.
- [x] Spawn coffee frequently in demanding aerial lanes.
- [x] Restore 34% Social Battery per coffee, capped at 100%.
- [x] Add coffee count and battery state to HUD/results/accessibility output.

## Phase 4 — Bestie Bob

- [x] Add Bob as an automatic-use collectible.
- [x] Render Bob running alongside Joi after collection.
- [x] Resolve existing shields before Bob’s save.
- [x] Make Bob absorb one otherwise-damaging collision and play a sacrifice exit.
- [x] Surface Bob’s active status in the HUD.

## Phase 5 — Input and interface polish

- [x] Capture Space, Arrow Up, and Arrow Down inside Phaser.
- [x] Add a capture-phase browser guard so gameplay keys cannot scroll the page.
- [x] Update menu, HUD, result screens, controls, recent attempts, and mobile layout.
- [x] Keep pause, audio, reduced motion, touch controls, and held benefits working.

## Phase 6 — Verification and release

- [x] Update GDD, README, asset ledger, manifest, service worker, and product metadata.
- [x] Update deterministic campaign and rendered-product tests.
- [x] Run the complete typecheck, lint, build, and test suite.
- [x] Verify menu, Joi animation, jump/duck, no-scroll controls, retry, and responsive layout in a real browser.
- [x] Push the verified update to `AmirTheDude69/Office-Run`.
- [x] Redeploy and verify the public production URL.
