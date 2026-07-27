# Office Run — Game Design Document

**Version:** 2.0

**Status:** Five-level campaign

**Genre:** Retro obstacle runner / workplace satire

**Platforms:** Desktop and mobile web

## 1. High concept

Office Run is a fast pixel-art campaign about Joi escaping an increasingly absurd workday. Coworkers, bosses, calendar invites, printer jams, follow-up emails, and weaponized small talk become mechanically distinct hazards. The immediate readability of a one-button runner is expanded with double-jumps, ducking, power-ups, a Social Battery, finite levels, and a final boss.

The comedy is chaotic corporate absurdism: familiar office phrases become threats, benefits become contraband, and Joi’s most reliable teammate is Bestie Bob.

## 2. Design pillars

1. **Readable at full panic.** Every hazard has a strong silhouette, motion tell, and reliable counter.
2. **Finite victories.** Each level has a finish line, a distinct enemy mix, and a meaningful completion state.
3. **Corporate jokes as mechanics.** Meetings change lanes, HR mirrors jumps, micromanagers chase, and Reply All arrives as a swarm.
4. **Recovery creates risk.** Coffee appears often but in demanding aerial lanes, forcing players to trade safety for Social Battery.
5. **Friendship is armor.** Bestie Bob visibly joins Joi and absorbs one collision before being dragged into the corporate void.

## 3. Core loop

1. Select any unlocked level.
2. Run automatically as Joi while the office scrolls right-to-left.
3. Jump, double-jump, duck, and deploy held benefits to avoid hazards.
4. Catch elevated coffee to restore 34% Social Battery.
5. Find Bestie Bob; he runs beside Joi until he sacrifices himself on the next unshielded collision.
6. Reach the level’s target distance, clear the results screen, and unlock the next stage.
7. Beat the level-five Circle-Back Boss to escape the org chart.

## 4. Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Start / jump | Space, W, or Arrow Up | JUMP |
| Double-jump | Jump again in the air | JUMP again |
| Duck / slide | S or Arrow Down | Hold DUCK |
| Pause | P or Escape | PAUSE |
| Activate held benefit | E or Enter | Held-asset button |

Space and arrow keys are captured during the game and never scroll the browser page.

## 5. Player systems

### Joi

Joi is the fixed protagonist. Her supplied transparent animation frames are used directly for running, idle, victory, and failure states. She keeps a consistent collision box independent of transparent sprite padding.

### Movement

- Constant forward motion is represented by the office moving past Joi.
- Each level has a starting and maximum speed, with a smooth ramp based on level progress.
- Releasing jump early shortens the arc.
- One mid-air double-jump provides recovery.
- Ducking shrinks Joi’s collision box and visual height.

### Social Battery

- Joi starts each level at 100%.
- A normal collision removes 34%, with a brief recovery window.
- Coffee restores 34%, capped at 100%.
- At 0%, the level ends in a satirical performance review.
- Optional one-hit mode makes a collision remove the full battery.

### Bestie Bob

- Bob is an automatic-use collectible, separate from the held-benefit slot.
- Once collected, a visible Bob companion runs behind Joi.
- On Joi’s next otherwise-damaging collision, Bob absorbs the hit, disappears in a sacrifice animation, and Joi loses no battery.
- Existing shields resolve before Bob so his save is not wasted.

### Scoring and persistence

- Distance raises score continuously.
- Clean avoids, close calls, and streak multipliers award bonuses up to 5×.
- Collisions reset streak.
- Best score, unlocked level, settings, and three recent attempts persist in localStorage.

## 6. Campaign

| Level | Theme | Distance | Speed | Enemy focus |
| --- | --- | ---: | --- | --- |
| 1. Cubicle Onboarding | Learn the escape route | 180m | 270–345 | Small talk, chairs, calendar invites |
| 2. Meeting Room Maze | Every door is a quick sync | 230m | 315–400 | Printer jams and zigzag follow-ups added |
| 3. Open-Plan Panic | No walls, privacy, or mercy | 285m | 355–450 | HR jump mirrors and moving meetings |
| 4. Executive Escalation | Visibility becomes a liability | 340m | 400–510 | Micromanagers and Reply-All swarms |
| 5. The All-Hands Escape | Outrun the org chart | 410m | 440–565 | Full roster plus Circle-Back Boss |

Spawn gaps tighten within each level but never fall below the reaction-time floor. The final boss begins around two-thirds through level five and must be survived before the campaign completes.

## 7. Hazard roster

| Hazard | Behavior | Primary counter |
| --- | --- | --- |
| Small-Talk Coworker | Standard walker | Jump |
| Rolling Office Chair | Fast, low ground hazard | Jump early |
| Flying Calendar Invite | High or mid air lane | Read lane, then duck or jump |
| Printer Jam | Wide hitbox | Double-jump |
| Follow-Up Email | Vertical zigzag | Commit after reading movement |
| HR Representative | Mirrors Joi’s first jump | Fake or double-jump |
| Meeting Manager | Changes lane | Delay movement |
| Micromanager | Alters speed to follow | Maintain clean momentum |
| Reply-All Storm | Three-message swarm | Rhythm jumps and ducks |
| Circle-Back Boss | Launches mixed email patterns | Survive the full all-hands event |

## 8. Collectibles and benefits

| Item | Behavior |
| --- | --- |
| Coffee | Frequent automatic pickup, placed in high-risk aerial lanes; restores 34% battery |
| Bestie Bob | Automatic companion; blocks one otherwise-damaging collision |
| Noise-Canceling Headphones | Held; temporarily ignores people hazards |
| PTO Request | Held; slows the office |
| Inbox Zero | Held; clears current email hazards |
| Work From Home | Held; temporarily phases through all hazards |

Only one manual benefit can be held. Coffee and Bob activate immediately and do not consume that slot.

## 9. Art and audio direction

- 16-bit-inspired interface at a 960×540 internal canvas with nearest-neighbor scaling.
- Deep navy interiors, cream paper, coffee yellow, mint friendship, cyan email effects, and magenta executive warnings.
- Joi’s user-supplied source art remains exact; no generative reinterpretation is used for gameplay.
- Code-drawn hazards and icons maintain clear silhouettes.
- CC0 office décor and UI sound effects are documented in `ASSETS.md`.
- A lightweight Web Audio chiptune reacts to speed.

## 10. Interface and accessibility

- Level-select menu shows five numbered stages and locked progression.
- In-level HUD shows score, level progress, Social Battery, streak, coffee count, Bob status, and boss alert.
- Completion, campaign-complete, and battery-empty screens have distinct copy and actions.
- Keyboard and touch parity, visible focus, high contrast, semantic shell controls, mute toggles, pause, and reduced motion are supported.
- Gameplay meaning is not conveyed by color alone.

## 11. Technical design

- React / TypeScript shell with Phaser for real-time play.
- Phaser emits accessible state to React for HUD and overlays.
- No backend, authentication, analytics, photo upload, or runtime secret.
- Static/serverless-compatible production build with offline asset caching.
- Tests cover campaign balance, enemy data, rendered product copy, and required Joi assets.

## 12. Definition of done

- All five levels start, escalate, finish, unlock, and replay correctly.
- Joi’s animation, jumping, ducking, collision, victory, and failure states work.
- Social Battery, coffee recovery, Bestie Bob, held benefits, scoring, pause, and persistence work.
- Space and arrow controls do not move the browser page.
- Current desktop/mobile browsers render a complete playable flow with no console errors.
- Source is pushed to `TheDudeCommits/Office-Run` and the public URL is updated.
