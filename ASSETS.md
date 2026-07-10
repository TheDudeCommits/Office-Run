# Asset and License Ledger

Office Run uses original code-drawn game art plus the following license-safe assets. External files are kept deliberately small and are used only where they strengthen the final game.

## OpenGameArt — Office 8×8 Tileset

- **Author:** Danielfib
- **Source:** https://opengameart.org/content/office-8x8-tileset
- **License:** Creative Commons Zero (CC0 / public domain dedication)
- **Retrieved:** 2026-07-10
- **Files used:**
  - `public/assets/office/tileset.png` from `tileset2.png`
  - `public/assets/office/player.png` from `player.png`
  - `public/assets/office/boss.png` from `boss.png`
- **Use:** tiny office décor and framed employee portraits within the parallax environment.
- **Modifications:** renamed; displayed with nearest-neighbor scaling, palette tinting, and scene composition.

## Kenney — UI Audio

- **Creator:** Kenney
- **Source:** https://kenney.nl/assets/ui-audio
- **License:** Creative Commons Zero (CC0)
- **Retrieved:** 2026-07-10
- **Files used:**
  - `public/audio/click.ogg` from `Audio/click1.ogg`
  - `public/audio/jump.ogg` from `Audio/switch15.ogg`
  - `public/audio/powerup.ogg` from `Audio/switch20.ogg`
  - `public/audio/hit.ogg` from `Audio/switch31.ogg`
  - `public/audio/milestone.ogg` from `Audio/switch35.ogg`
- **License copy:** `public/assets/licenses/kenney-ui-audio-license.txt`
- **Use:** menus, jumps, pickups, collisions, level clears, and boss stingers.
- **Modifications:** renamed; runtime volume and playback-rate variation only.

## Press Start 2P

- **Author:** The Press Start 2P Project Authors
- **Distribution:** `@fontsource/press-start-2p`
- **Source:** https://fontsource.org/fonts/press-start-2p
- **License:** SIL Open Font License 1.1
- **Use:** display type and game HUD text.
- **Modifications:** none.

## Original project assets

- Enemy sprites, Bestie Bob, power-up icons, particles, backgrounds, UI frames, and CRT treatment are original, deterministic code-drawn assets created for Office Run.
- The social preview card is an original generated promotional image created specifically for this repository and is not used as gameplay art.
- Procedural chiptune music is synthesized at runtime with the Web Audio API and does not sample a third-party recording.

## Joi protagonist artwork — supplied by the project owner

- **Source:** files supplied directly by the Office Run project owner on 2026-07-10.
- **License/rights:** user-provided artwork; not relicensed here. The project owner is responsible for confirming they hold the rights required for publication and distribution.
- **Original files:**
  - `public/assets/joi/source-running-right.gif`
  - `public/assets/joi/source-spritesheet.webp`
- **Runtime derivatives:**
  - `public/assets/joi/joi-run.png` — eight GIF frames arranged as one horizontal run sheet.
  - `public/assets/joi/joi-idle.png` — idle pose extracted from the supplied sprite sheet.
  - `public/assets/joi/joi-celebrate.png` — victory pose extracted from the supplied sprite sheet.
  - `public/assets/joi/joi-sad.png` — failure pose extracted from the supplied sprite sheet.
- **Use:** fixed playable protagonist and employee-file portrait.
- **Modifications:** deterministic frame extraction, transparent canvas normalization, and sprite-sheet assembly only; the character artwork itself was not regenerated.

## License policy

New third-party assets must be added to this ledger with creator, source URL, license, retrieval date, local filename, use, and modifications. Assets with unclear, non-commercial, or attribution-incompatible terms must not be committed.
