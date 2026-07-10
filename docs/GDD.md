# Office Run — Game Design Document

**Version:** 1.0
**Status:** Production baseline
**Genre:** Endless runner / workplace satire
**Platforms:** Desktop and mobile web
**Audience:** Anyone who has survived a “quick sync” that was neither quick nor a sync

## 1. High concept

Office Run is a fast, replayable pixel-art endless runner about escaping an increasingly absurd workday. The player controls Chip Deadline, an exhausted office worker sprinting through cubicles, meeting rooms, executive floors, and eventually a surreal corporate nightmare. Coworkers, bosses, calendar invites, follow-up emails, printer jams, and weaponized small talk become distinct mechanical hazards.

The game takes the immediate readability of the offline dinosaur runner as a genre reference, then adds its own identity: multiple defensive moves, sanity points, power-ups, enemy behaviors, milestone “quarters,” boss events, punch-line speech bubbles, local avatar creation, and a dense retro office world.

## 2. Design pillars

1. **Readable at full panic.** Every hazard has a strong silhouette, color, movement tell, and reliable counter.
2. **One more quarterly report.** Restarts are instant, runs are score-driven, and difficulty rises smoothly enough to make each failure feel beatable.
3. **Corporate absurdism as mechanics.** A meeting is not just a reskinned cactus: it blocks space, follows, mirrors, swarms, interrupts, or changes the rules in a way that matches its joke.
4. **Personal without being invasive.** Players can turn a photo into a local pixel avatar; the image stays on their device and is never sent to a server.
5. **Juicy, not noisy.** Screen shake, particles, callouts, and sound make actions satisfying while reduced-motion and mute controls keep the game comfortable.

## 3. Player fantasy and tone

The fantasy is not “winning at work.” It is maintaining just enough sanity to make it out of the building while the corporation collapses into calendar-colored chaos behind you.

The humor is chaotic, ironic, and mocking rather than realistic or mean-spirited. Copy targets recognizable phrases:

- “Got a minute?”
- “Let’s take this offline.”
- “Friendly reminder.”
- “Per my last email.”
- “Can you own this?”
- “Let’s circle back.”
- “Quick sync?”
- “We’re a family.”

No real companies, trademarks, or identifiable coworkers appear in the game.

## 4. Core loop

1. Start a run as Chip Deadline or a locally generated custom avatar.
2. Automatically sprint through the current office quarter.
3. Jump, double-jump, duck, and use timed power-ups to avoid hazards.
4. Earn distance, task-avoidance points, close-call bonuses, and streak multipliers.
5. Cross a quarter milestone; the environment, enemy mix, speed, and music intensity change.
6. Survive boss events and increasingly hostile obstacle combinations.
7. Lose all three sanity points, receive a satirical performance review, and restart instantly.

## 5. Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Start / jump | Space, W, or Arrow Up | Tap JUMP |
| Double-jump | Press jump again while airborne | Tap JUMP again |
| Duck / slide | S or Arrow Down | Hold DUCK |
| Pause | P or Escape | Tap pause |
| Activate held power-up | E or Enter | Tap power-up badge |
| Mute | M | Tap audio button |

The game is landscape-first but remains playable on portrait mobile screens with a reduced-height HUD and large thumb controls.

## 6. Player systems

### Movement

- Constant forward motion is represented by the office moving from right to left.
- Base speed starts at roughly 280 world units per second.
- Speed increases continuously and receives a step increase at each quarter.
- Jump uses a consistent arc; releasing early shortens the first jump.
- One mid-air double-jump provides recovery without trivializing low hazards.
- Duck reduces the collision height and becomes a slide while moving.

### Sanity

- The player begins with three sanity points.
- A collision removes one point and grants a short invulnerability period.
- At zero sanity, the run ends.
- Hardcore mode unlocks after a milestone and makes every collision terminal.

### Scoring

- Distance score rises continuously.
- Avoided hazards award task-avoidance points based on difficulty.
- Close calls award a small bonus.
- Consecutive clean avoids build a multiplier up to 5×.
- Taking damage resets the multiplier.
- Best score and recent runs are stored locally on the device.

## 7. Enemy roster

| Hazard | Corporate joke | Behavior | Primary counter |
| --- | --- | --- | --- |
| Small-Talk Coworker | “Any plans this weekend?” | Standard ground walker with an early speech tell | Jump |
| Rolling Office Chair | Abandoned ergonomic liability | Small, very fast ground hazard | Jump early |
| Flying Calendar Invite | “Quick sync?” | Alternates between high and mid air lanes | Duck or jump by lane |
| Printer Jam | “PC LOAD LETTER” | Wide stationary hitbox with smoke tell | Double-jump |
| Follow-Up Email | “Friendly reminder” | Zigzags vertically and accelerates | Read lane, then commit |
| HR Representative | “Safe space check-in” | Mirrors the player’s first jump after a delay | Fake or double-jump |
| Meeting Manager | “Let’s take this offline” | Slides laterally and changes lane once | Delay jump |
| Micromanager | “Just checking in” | Chases from behind until cleanly avoided | Maintain momentum |
| Reply-All Storm | “Thanks!” | A short staggered swarm of email projectiles | Rhythm jumps and ducks |
| Circle-Back Boss | “Let’s revisit in Q4” | Large hitbox; hops, sends invites, and forces patterns | Read multi-step tells |

Enemy colors communicate families: people are coral/purple, email hazards are cyan, machinery is yellow/red, and bosses use white with warning magenta.

## 8. Power-ups

| Power-up | Effect | Duration / use |
| --- | --- | --- |
| Coffee | Faster score gain and collision immunity | Short automatic burst |
| Noise-Canceling Headphones | Ignores people and speech hazards | Timed shield |
| PTO Request | Slows the world without slowing the player | Timed slow motion |
| Inbox Zero | Clears current email hazards | Instant |
| Work From Home | Phases through all hazards in a glitchy home-office overlay | Rare timed state |

Only one held power-up can be stored. Coffee activates on pickup; the others may be activated immediately through the power-up control.

## 9. Progression and pacing

Runs are endless, divided into repeating corporate quarters:

1. **Q1 — Cubicle Onboarding:** teaches one hazard at a time.
2. **Q2 — Meeting Room Maze:** adds lane changes, air hazards, and pairs.
3. **Q3 — Executive Floor:** introduces chasers, mimics, and reduced spawn gaps.
4. **Q4 — Synergy Singularity:** surreal palette shift, mixed patterns, and a boss event.

Each quarter lasts approximately 25–35 seconds depending on speed. After Q4, the cycle continues as “Fiscal Year 2+” with higher speed, denser combinations, and shorter warning windows. Difficulty is capped at a level that remains visually parsable.

### Difficulty model

- World speed = base speed + elapsed-time ramp + quarter bonus, capped.
- Minimum spawn gap shrinks gradually but never below the reaction-time floor.
- Complex enemy types unlock by elapsed time.
- Pattern selection rejects impossible combinations using estimated jump and duck windows.
- Boss events temporarily replace ordinary spawning with authored patterns.

## 10. Avatar personalization

The default protagonist is **Chip Deadline**: loosened tie, laptop bag, coffee-powered running form, and the emotional posture of someone who has seen 47 unread Slack threads.

Players may upload a photo. The browser:

1. center-crops the image;
2. reduces it to a small pixel grid;
3. quantizes the colors;
4. creates a face tile used by the runner;
5. derives a cosmetic shirt accent and a playful, randomized corporate title from a non-identifying image hash;
6. stores the resulting small pixel avatar locally.

The source photo is not uploaded, persisted, or sent to an AI provider. The custom avatar can be reset at any time.

## 11. Art direction

- 16-bit-inspired pixel art rendered with nearest-neighbor scaling.
- Internal game canvas: 960 × 540, responsive fit.
- Deep navy office interiors with warm cream paper, hazard coral, coffee yellow, mint highlights, electric cyan email effects, and magenta executive warnings.
- Parallax layers: skyline, fluorescent wall panels, desks/windows, floor tiles, and foreground clutter.
- Sprites are code-drawn from hard-edged pixel rectangles for a coherent original cast.
- Licensed CC0 office art is used as environmental dressing and tiny framed portraits.
- CRT scanlines and dithered gradients are decorative and reduced or disabled with reduced-motion mode.

## 12. Audio direction

- Short CC0 UI sounds are repurposed for jumps, hits, pickups, menus, and milestones.
- Background music is a lightweight procedural chiptune generated with the Web Audio API so it can react to speed without shipping an unclear music license.
- Music and sound effects have separate toggles.
- Browsers begin audio only after the first player gesture.

## 13. Interface

### Start screen

- Strong OFFICE RUN title lockup.
- “Escape the 9-to-5. Keep your sanity.”
- Primary RUN FROM RESPONSIBILITY button.
- Avatar card with Chip/default and photo upload.
- Compact controls and accessibility settings.

### In-run HUD

- Score, best, current quarter/fiscal year.
- Three sanity indicators.
- Streak multiplier.
- Held power-up and timer.
- Pause, audio, and reduced-motion controls.

### Game-over review

- Final score, distance, tasks avoided, quarter reached, and best score.
- Randomized satirical performance-review headline.
- Instant “TRY ANOTHER QUARTER” action.

## 14. Accessibility

- Keyboard and touch parity.
- Visible focus styles and semantic buttons outside the canvas.
- Reduced-motion mode disables shake, heavy parallax, and rapid CRT flicker.
- No gameplay meaning is communicated by color alone.
- Text and controls meet high-contrast targets.
- Music and SFX can be muted independently.
- Pausing does not punish the player.

## 15. Technical design

- React / TypeScript shell with Phaser for the game runtime.
- Game state is emitted to React for accessible HUD and overlays.
- LocalStorage stores preferences, avatar output, and high scores only.
- No authentication, analytics, backend, or API key is required.
- Static/serverless-compatible build suitable for a global edge host.
- Unit tests cover deterministic helpers, asset paths, and rendered product metadata.
- Browser verification covers start, jump, duck, pause, restart, avatar upload, responsive layout, and console health.

## 16. Definition of done

- Playable on current desktop and mobile browsers.
- Distinct enemy behaviors, progressive speed, bosses, power-ups, scoring, sanity, pause, and restart all work.
- Default and custom local avatars work without external data transmission.
- Audio, accessibility settings, and local high scores persist.
- GDD, phased TODO, asset/license ledger, README, tests, and deployment configuration are present.
- Repository is pushed to `AmirTheDude69/Office-Run`.
- A public live URL loads and supports a complete run.
