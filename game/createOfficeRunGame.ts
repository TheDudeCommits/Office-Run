import Phaser from "phaser";

import {
  ENEMIES,
  GAME_HEIGHT,
  GAME_WIDTH,
  GROUND_Y,
  POWER_UPS,
  QUARTERS,
  getDifficulty,
  getMultiplier,
  getPerformanceReview,
  getUnlockedEnemies,
} from "./config";
import {
  DEFAULT_AVATAR,
  DEFAULT_SETTINGS,
  INITIAL_STATS,
  type AvatarProfile,
  type EnemyKind,
  type GameCallbacks,
  type GameCommand,
  type GameScreen,
  type GameStats,
  type PowerUpKind,
  type Settings,
} from "./types";

type Hazard = {
  object: Phaser.GameObjects.Container;
  kind: EnemyKind;
  width: number;
  height: number;
  baseY: number;
  phase: number;
  speedFactor: number;
  passed: boolean;
  hit: boolean;
  minGap: number;
  velocityY: number;
  mirrored: boolean;
};

type Pickup = {
  object: Phaser.GameObjects.Container;
  kind: PowerUpKind;
  phase: number;
};

type ParallaxObject = {
  object: Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform;
  speed: number;
  resetX: number;
};

const COLORS = {
  ink: "#080c18",
  cream: "#f4e8ca",
  navy: "#11182d",
  blue: "#63d9ff",
  mint: "#67e8a5",
  yellow: "#ffd447",
  coral: "#ff6b6b",
  magenta: "#ff5c8a",
  purple: "#9d7bff",
  white: "#fff9e8",
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

class OfficeScene extends Phaser.Scene {
  private callbacks: GameCallbacks;
  private settings: Settings = { ...DEFAULT_SETTINGS };
  private avatar: AvatarProfile = { ...DEFAULT_AVATAR };

  private player!: Phaser.Physics.Arcade.Sprite;
  private ground!: Phaser.GameObjects.Rectangle;
  private wall!: Phaser.GameObjects.Rectangle;
  private glow!: Phaser.GameObjects.Rectangle;
  private floorTiles!: Phaser.GameObjects.TileSprite;
  private ceilingLights!: Phaser.GameObjects.TileSprite;
  private skyline!: Phaser.GameObjects.TileSprite;
  private homeOverlay!: Phaser.GameObjects.Rectangle;
  private statusText!: Phaser.GameObjects.Text;

  private hazards: Hazard[] = [];
  private pickups: Pickup[] = [];
  private parallax: ParallaxObject[] = [];
  private boss: Phaser.GameObjects.Container | null = null;

  private screen: GameScreen = "menu";
  private elapsed = 0;
  private score = 0;
  private best = 0;
  private sanity = 3;
  private streak = 0;
  private tasksAvoided = 0;
  private distance = 0;
  private review = "";
  private newBest = false;
  private heldPower: PowerUpKind | null = null;
  private powerRemaining = 0;
  private spawnTimer = 1.1;
  private pickupTimer = 8;
  private bossProjectileTimer = 0;
  private bossRemaining = 0;
  private lastAbsoluteQuarter = 0;
  private lastHazard: EnemyKind | null = null;
  private invulnerableRemaining = 0;
  private peopleShieldRemaining = 0;
  private slowRemaining = 0;
  private coffeeRemaining = 0;
  private wfhRemaining = 0;
  private jumpsUsed = 0;
  private ducking = false;
  private stateEmitTimer = 0;
  private runTime = 0;
  private worldSpeed = 280;
  private avatarLoadId = 0;

  private musicContext: AudioContext | null = null;
  private nextNoteAt = 0;
  private noteIndex = 0;

  constructor(callbacks: GameCallbacks) {
    super({ key: "office-run" });
    this.callbacks = callbacks;
  }

  preload() {
    this.load.image("office-tileset", "/assets/office/tileset.png");
    this.load.image("office-portrait", "/assets/office/player.png");
    this.load.image("boss-portrait", "/assets/office/boss.png");
    this.load.audio("sfx-click", "/audio/click.ogg");
    this.load.audio("sfx-jump", "/audio/jump.ogg");
    this.load.audio("sfx-power", "/audio/powerup.ogg");
    this.load.audio("sfx-hit", "/audio/hit.ogg");
    this.load.audio("sfx-milestone", "/audio/milestone.ogg");
  }

  create() {
    this.createTextures();
    this.createWorld();
    this.createPlayer();
    this.bindInputs();
    this.applyAvatar(this.avatar);
    this.emitStats(true);
  }

  private createTextures() {
    this.makeTexture("floor-pattern", 64, 32, (ctx) => {
      ctx.fillStyle = "#11182d";
      ctx.fillRect(0, 0, 64, 32);
      ctx.fillStyle = "#202a47";
      ctx.fillRect(0, 0, 30, 14);
      ctx.fillRect(34, 18, 30, 14);
      ctx.fillStyle = "#2d3657";
      ctx.fillRect(32, 0, 2, 32);
      ctx.fillRect(0, 16, 64, 2);
      ctx.fillStyle = "#63d9ff";
      ctx.fillRect(5, 4, 2, 2);
    });

    this.makeTexture("light-pattern", 160, 24, (ctx) => {
      ctx.fillStyle = "#10162a";
      ctx.fillRect(0, 0, 160, 24);
      ctx.fillStyle = "#fff9e8";
      ctx.fillRect(22, 6, 86, 5);
      ctx.fillStyle = "#ffd447";
      ctx.fillRect(25, 11, 80, 2);
    });

    this.makeTexture("skyline-pattern", 240, 150, (ctx) => {
      ctx.fillStyle = "#0b1020";
      ctx.fillRect(0, 0, 240, 150);
      const buildings = [
        [0, 62, 42, 88],
        [47, 30, 54, 120],
        [108, 75, 34, 75],
        [147, 48, 61, 102],
        [214, 84, 26, 66],
      ];
      ctx.fillStyle = "#151d36";
      buildings.forEach(([x, y, width, height]) => ctx.fillRect(x, y, width, height));
      ctx.fillStyle = "#ffd447";
      for (let x = 8; x < 232; x += 18) {
        for (let y = 58; y < 140; y += 18) {
          if ((x + y) % 3 !== 0) ctx.fillRect(x, y, 5, 4);
        }
      }
    });

    this.makeEnemyTextures();
    this.makePowerTextures();
    this.drawPlayerTexture();
  }

  private makeTexture(
    key: string,
    width: number,
    height: number,
    draw: (context: CanvasRenderingContext2D) => void,
  ) {
    if (this.textures.exists(key)) this.textures.remove(key);
    const texture = this.textures.createCanvas(key, width, height);
    if (!texture) return;
    const context = texture.getContext();
    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, width, height);
    draw(context);
    texture.refresh();
  }

  private makeEnemyTextures() {
    this.makeTexture("enemy-small-talk", 40, 60, (ctx) => {
      this.drawPerson(ctx, 40, 60, COLORS.purple, COLORS.blue, false);
      ctx.fillStyle = COLORS.cream;
      ctx.fillRect(29, 32, 8, 9);
      ctx.fillStyle = COLORS.yellow;
      ctx.fillRect(31, 30, 5, 3);
    });

    this.makeTexture("enemy-chair", 44, 30, (ctx) => {
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(4, 25, 7, 4);
      ctx.fillRect(31, 25, 7, 4);
      ctx.fillStyle = COLORS.blue;
      ctx.fillRect(13, 4, 18, 15);
      ctx.fillStyle = COLORS.purple;
      ctx.fillRect(8, 17, 27, 7);
      ctx.fillStyle = COLORS.white;
      ctx.fillRect(20, 22, 4, 6);
    });

    this.makeTexture("enemy-calendar", 44, 36, (ctx) => {
      ctx.fillStyle = COLORS.white;
      ctx.fillRect(2, 5, 40, 28);
      ctx.fillStyle = COLORS.coral;
      ctx.fillRect(2, 5, 40, 8);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(9, 2, 4, 8);
      ctx.fillRect(31, 2, 4, 8);
      ctx.fillStyle = COLORS.blue;
      ctx.fillRect(9, 18, 7, 5);
      ctx.fillRect(20, 18, 7, 5);
      ctx.fillRect(9, 26, 7, 4);
      ctx.fillStyle = COLORS.magenta;
      ctx.fillRect(31, 18, 6, 12);
    });

    this.makeTexture("enemy-printer", 68, 56, (ctx) => {
      ctx.fillStyle = "#8693a8";
      ctx.fillRect(6, 19, 56, 34);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(14, 27, 40, 16);
      ctx.fillStyle = COLORS.white;
      ctx.fillRect(17, 4, 35, 26);
      ctx.fillStyle = COLORS.coral;
      ctx.fillRect(10, 47, 48, 6);
      ctx.fillStyle = COLORS.blue;
      ctx.fillRect(51, 22, 6, 5);
      ctx.fillStyle = "#d5d8df";
      ctx.fillRect(24, 0, 28, 7);
    });

    this.makeTexture("enemy-follow-up", 46, 32, (ctx) => {
      ctx.fillStyle = COLORS.blue;
      ctx.fillRect(1, 3, 44, 27);
      ctx.fillStyle = COLORS.white;
      ctx.beginPath();
      ctx.moveTo(3, 5);
      ctx.lineTo(23, 20);
      ctx.lineTo(43, 5);
      ctx.fill();
      ctx.fillStyle = COLORS.magenta;
      ctx.fillRect(34, 0, 10, 10);
      ctx.fillStyle = COLORS.white;
      ctx.fillRect(38, 2, 2, 6);
      ctx.fillRect(38, 8, 2, 2);
    });

    this.makeTexture("enemy-hr", 44, 60, (ctx) => {
      this.drawPerson(ctx, 44, 60, COLORS.coral, COLORS.white, false);
      ctx.fillStyle = COLORS.cream;
      ctx.fillRect(27, 29, 13, 17);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(30, 33, 7, 2);
      ctx.fillRect(30, 38, 7, 2);
    });

    this.makeTexture("enemy-meeting", 56, 52, (ctx) => {
      ctx.fillStyle = COLORS.purple;
      ctx.fillRect(4, 29, 48, 14);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(8, 43, 6, 9);
      ctx.fillRect(42, 43, 6, 9);
      ctx.fillStyle = COLORS.cream;
      ctx.fillRect(19, 5, 18, 17);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(22, 10, 4, 5);
      ctx.fillRect(31, 10, 4, 5);
      ctx.fillStyle = COLORS.blue;
      ctx.fillRect(21, 22, 16, 8);
      ctx.fillStyle = COLORS.white;
      ctx.fillRect(9, 25, 11, 5);
      ctx.fillStyle = COLORS.yellow;
      ctx.fillRect(38, 23, 9, 7);
    });

    this.makeTexture("enemy-micromanager", 50, 70, (ctx) => {
      this.drawPerson(ctx, 50, 70, COLORS.magenta, COLORS.yellow, true);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(4, 3, 42, 8);
      ctx.fillStyle = COLORS.white;
      ctx.fillRect(7, 5, 6, 3);
      ctx.fillRect(37, 5, 6, 3);
    });

    this.makeTexture("enemy-reply-all", 38, 28, (ctx) => {
      ctx.fillStyle = COLORS.white;
      ctx.fillRect(1, 3, 36, 23);
      ctx.fillStyle = COLORS.purple;
      ctx.beginPath();
      ctx.moveTo(2, 5);
      ctx.lineTo(19, 18);
      ctx.lineTo(36, 5);
      ctx.fill();
      ctx.fillStyle = COLORS.coral;
      ctx.fillRect(28, 0, 9, 9);
    });

    this.makeTexture("enemy-boss", 86, 98, (ctx) => {
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(12, 0, 62, 11);
      ctx.fillStyle = COLORS.cream;
      ctx.fillRect(19, 8, 48, 35);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(28, 20, 7, 9);
      ctx.fillRect(51, 20, 7, 9);
      ctx.fillRect(36, 34, 15, 4);
      ctx.fillStyle = COLORS.white;
      ctx.fillRect(10, 43, 66, 45);
      ctx.fillStyle = COLORS.magenta;
      ctx.fillRect(38, 43, 10, 36);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(16, 88, 20, 10);
      ctx.fillRect(50, 88, 20, 10);
      ctx.fillStyle = COLORS.yellow;
      ctx.fillRect(4, 50, 12, 22);
      ctx.fillStyle = COLORS.coral;
      ctx.fillRect(70, 50, 12, 22);
    });
  }

  private drawPerson(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    jacket: string,
    accent: string,
    broad: boolean,
  ) {
    const inset = broad ? 5 : 8;
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(inset + 3, 0, width - inset * 2 - 6, 8);
    ctx.fillStyle = "#d5a173";
    ctx.fillRect(inset + 6, 6, width - inset * 2 - 12, 20);
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(inset + 10, 12, 4, 5);
    ctx.fillRect(width - inset - 14, 12, 4, 5);
    ctx.fillStyle = jacket;
    ctx.fillRect(inset, 25, width - inset * 2, height - 35);
    ctx.fillStyle = accent;
    ctx.fillRect(width / 2 - 3, 25, 6, height - 38);
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(inset + 3, height - 10, 9, 10);
    ctx.fillRect(width - inset - 12, height - 10, 9, 10);
  }

  private makePowerTextures() {
    this.makeTexture("power-coffee", 34, 34, (ctx) => {
      ctx.fillStyle = COLORS.white;
      ctx.fillRect(5, 7, 21, 23);
      ctx.fillStyle = "#7a4a2b";
      ctx.fillRect(8, 9, 15, 7);
      ctx.fillStyle = COLORS.yellow;
      ctx.fillRect(8, 20, 15, 7);
      ctx.strokeStyle = COLORS.white;
      ctx.lineWidth = 4;
      ctx.strokeRect(24, 12, 8, 12);
    });
    this.makeTexture("power-headphones", 36, 36, (ctx) => {
      ctx.strokeStyle = COLORS.purple;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(18, 18, 12, Math.PI, 0);
      ctx.stroke();
      ctx.fillStyle = COLORS.white;
      ctx.fillRect(2, 17, 9, 16);
      ctx.fillRect(25, 17, 9, 16);
    });
    this.makeTexture("power-pto", 36, 36, (ctx) => {
      ctx.fillStyle = COLORS.mint;
      ctx.fillRect(3, 5, 30, 27);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(9, 10, 18, 3);
      ctx.fillRect(9, 17, 12, 3);
      ctx.fillRect(9, 24, 15, 3);
      ctx.fillStyle = COLORS.white;
      ctx.fillRect(25, 22, 5, 7);
    });
    this.makeTexture("power-inbox", 36, 36, (ctx) => {
      ctx.fillStyle = COLORS.blue;
      ctx.fillRect(3, 6, 30, 25);
      ctx.fillStyle = COLORS.white;
      ctx.beginPath();
      ctx.moveTo(5, 8);
      ctx.lineTo(18, 20);
      ctx.lineTo(31, 8);
      ctx.fill();
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(15, 23, 6, 3);
    });
    this.makeTexture("power-wfh", 38, 36, (ctx) => {
      ctx.fillStyle = COLORS.magenta;
      ctx.fillRect(3, 15, 32, 18);
      ctx.beginPath();
      ctx.moveTo(1, 16);
      ctx.lineTo(19, 2);
      ctx.lineTo(37, 16);
      ctx.fill();
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(15, 21, 8, 12);
      ctx.fillStyle = COLORS.blue;
      ctx.fillRect(7, 19, 6, 6);
      ctx.fillRect(25, 19, 6, 6);
    });
  }

  private drawPlayerTexture(image?: HTMLImageElement) {
    const accent = this.avatar.accent || DEFAULT_AVATAR.accent;
    this.makeTexture("chip-player", 38, 62, (ctx) => {
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(8, 0, 24, 7);
      ctx.fillRect(4, 4, 30, 5);
      ctx.fillStyle = "#c98f62";
      ctx.fillRect(8, 7, 22, 19);
      if (image) {
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(image, 8, 6, 22, 22);
        ctx.restore();
      } else {
        ctx.fillStyle = COLORS.ink;
        ctx.fillRect(12, 13, 4, 5);
        ctx.fillRect(23, 13, 4, 5);
        ctx.fillRect(16, 21, 8, 3);
      }
      ctx.fillStyle = COLORS.white;
      ctx.fillRect(5, 26, 28, 24);
      ctx.fillStyle = accent;
      ctx.fillRect(17, 26, 6, 24);
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(7, 50, 10, 12);
      ctx.fillRect(23, 50, 10, 12);
      ctx.fillStyle = "#7a4a2b";
      ctx.fillRect(0, 31, 7, 22);
      ctx.fillStyle = COLORS.yellow;
      ctx.fillRect(1, 32, 5, 6);
    });
    if (this.player) this.player.setTexture("chip-player");
  }

  private createWorld() {
    this.cameras.main.setBackgroundColor(0x080c18);
    this.wall = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, QUARTERS[0].wall);
    this.wall.setDepth(-20);
    this.glow = this.add.rectangle(GAME_WIDTH / 2, 205, GAME_WIDTH, 290, QUARTERS[0].accent, 0.06);
    this.glow.setDepth(-19);

    this.skyline = this.add.tileSprite(GAME_WIDTH / 2, 248, GAME_WIDTH, 240, "skyline-pattern");
    this.skyline.setDepth(-18).setAlpha(0.85);
    this.ceilingLights = this.add.tileSprite(GAME_WIDTH / 2, 32, GAME_WIDTH, 24, "light-pattern");
    this.ceilingLights.setDepth(-8);
    this.floorTiles = this.add.tileSprite(GAME_WIDTH / 2, 487, GAME_WIDTH, 104, "floor-pattern");
    this.floorTiles.setDepth(-5);

    const wallBand = this.add.rectangle(GAME_WIDTH / 2, 316, GAME_WIDTH, 8, 0x44506f);
    wallBand.setDepth(-9);
    const baseboard = this.add.rectangle(GAME_WIDTH / 2, GROUND_Y + 3, GAME_WIDTH, 8, 0x63708e);
    baseboard.setDepth(-4);

    for (let index = 0; index < 5; index += 1) {
      const x = 150 + index * 225;
      const frame = this.add.rectangle(x, 210, 56, 56, index % 2 ? 0xffd447 : 0x63d9ff);
      frame.setStrokeStyle(5, 0x080c18).setDepth(-11);
      const portrait = this.add.image(x, 210, index % 2 ? "boss-portrait" : "office-portrait");
      portrait.setScale(5).setDepth(-10);
      this.parallax.push(
        { object: frame, speed: 0.28, resetX: GAME_WIDTH + 150 },
        { object: portrait, speed: 0.28, resetX: GAME_WIDTH + 150 },
      );
    }

    for (let index = 0; index < 4; index += 1) {
      const decor = this.add.image(220 + index * 330, 378, "office-tileset");
      decor.setOrigin(0.5, 1).setScale(2.2).setAlpha(0.85).setDepth(-6);
      this.parallax.push({ object: decor, speed: 0.62, resetX: GAME_WIDTH + 260 });
    }

    this.ground = this.add.rectangle(GAME_WIDTH / 2, GROUND_Y + 10, GAME_WIDTH, 20, 0x080c18, 0);
    this.physics.add.existing(this.ground, true);

    this.homeOverlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x2f1246, 0);
    this.homeOverlay.setDepth(30);
    this.statusText = this.add
      .text(GAME_WIDTH / 2, 82, "", {
        fontFamily: "'Press Start 2P'",
        fontSize: "16px",
        color: COLORS.white,
        backgroundColor: COLORS.ink,
        padding: { x: 12, y: 8 },
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(40)
      .setAlpha(0);
  }

  private createPlayer() {
    this.player = this.physics.add.sprite(148, GROUND_Y - 31, "chip-player");
    this.player.setDepth(15).setOrigin(0.5);
    this.player.setGravityY(1720).setCollideWorldBounds(true);
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(28, 54).setOffset(5, 6);
    this.physics.add.collider(this.player, this.ground);
  }

  private bindInputs() {
    const keyboard = this.input.keyboard;
    if (keyboard) {
      const jump = (event: KeyboardEvent) => {
        if (!event.repeat) this.handleJump();
      };
      keyboard.on("keydown-SPACE", jump);
      keyboard.on("keydown-W", jump);
      keyboard.on("keydown-UP", jump);
      keyboard.on("keyup-SPACE", () => this.releaseJump());
      keyboard.on("keyup-W", () => this.releaseJump());
      keyboard.on("keyup-UP", () => this.releaseJump());
      keyboard.on("keydown-DOWN", () => this.setDucking(true));
      keyboard.on("keydown-S", () => this.setDucking(true));
      keyboard.on("keyup-DOWN", () => this.setDucking(false));
      keyboard.on("keyup-S", () => this.setDucking(false));
      keyboard.on("keydown-P", () => this.togglePause());
      keyboard.on("keydown-ESC", () => this.togglePause());
      keyboard.on("keydown-E", () => this.usePowerUp());
      keyboard.on("keydown-ENTER", () => {
        if (this.screen === "menu" || this.screen === "gameover") this.startRun();
        else this.usePowerUp();
      });
    }

    this.game.events.on("office-command", this.handleCommand, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off("office-command", this.handleCommand, this);
      this.musicContext?.close().catch(() => undefined);
    });
  }

  private handleCommand(command: GameCommand) {
    switch (command.type) {
      case "start":
        this.startRun();
        break;
      case "jump":
        this.handleJump();
        break;
      case "jump-release":
        this.releaseJump();
        break;
      case "duck":
        this.setDucking(command.active);
        break;
      case "pause":
        this.togglePause();
        break;
      case "use-powerup":
        this.usePowerUp();
        break;
      case "settings":
        this.settings = { ...command.settings };
        break;
      case "avatar":
        this.applyAvatar(command.avatar);
        break;
      case "hydrate-best":
        this.best = Math.max(this.best, command.best);
        this.emitStats(true);
        break;
    }
  }

  private startRun() {
    this.clearRunObjects();
    this.screen = "playing";
    this.elapsed = 0;
    this.runTime = 0;
    this.score = 0;
    this.sanity = this.settings.hardcore ? 1 : 3;
    this.streak = 0;
    this.tasksAvoided = 0;
    this.distance = 0;
    this.review = "";
    this.newBest = false;
    this.heldPower = null;
    this.powerRemaining = 0;
    this.spawnTimer = 1.2;
    this.pickupTimer = 7.5;
    this.lastAbsoluteQuarter = 0;
    this.lastHazard = null;
    this.invulnerableRemaining = 0;
    this.peopleShieldRemaining = 0;
    this.slowRemaining = 0;
    this.coffeeRemaining = 0;
    this.wfhRemaining = 0;
    this.jumpsUsed = 0;
    this.setDucking(false);
    this.player.clearTint().setAlpha(1).setAngle(0).setScale(1).setPosition(148, GROUND_Y - 31);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0).setEnable(true);
    this.physics.resume();
    this.setQuarterLook(1);
    this.showCallout("CLOCKED IN. BAD DECISION.", COLORS.blue);
    this.ensureMusic();
    this.playSfx("sfx-click", 0.55);
    this.emitStats(true);
  }

  private clearRunObjects() {
    this.hazards.forEach((hazard) => hazard.object.destroy());
    this.pickups.forEach((pickup) => pickup.object.destroy());
    this.hazards = [];
    this.pickups = [];
    this.boss?.destroy();
    this.boss = null;
    this.bossRemaining = 0;
    this.homeOverlay.setAlpha(0);
  }

  private handleJump() {
    if (this.screen === "menu" || this.screen === "gameover") {
      this.startRun();
      return;
    }
    if (this.screen === "paused") {
      this.togglePause();
      return;
    }
    if (this.screen !== "playing") return;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (body.blocked.down || body.touching.down) this.jumpsUsed = 0;
    if (this.jumpsUsed >= 2) return;
    this.setDucking(false);
    body.setVelocityY(this.jumpsUsed === 0 ? -650 : -555);
    this.jumpsUsed += 1;
    this.player.setAngle(this.jumpsUsed === 2 ? -5 : 0);
    this.burst(this.player.x - 4, this.player.y + 20, 0x63d9ff, this.jumpsUsed === 2 ? 8 : 5);
    this.playSfx("sfx-jump", 0.48, this.jumpsUsed === 2 ? 1.16 : 1);
  }

  private releaseJump() {
    if (!this.player?.body) return;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (body.velocity.y < -260) body.setVelocityY(body.velocity.y * 0.58);
  }

  private setDucking(active: boolean) {
    if (!this.player?.body || this.screen === "gameover") return;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const grounded = body.blocked.down || body.touching.down;
    this.ducking = Boolean(active && grounded && this.screen === "playing");
    if (this.ducking) {
      this.player.setScale(1.08, 0.68).setAngle(-4);
      body.setSize(30, 34).setOffset(4, 25);
    } else {
      this.player.setScale(1).setAngle(0);
      body.setSize(28, 54).setOffset(5, 6);
    }
  }

  private togglePause() {
    if (this.screen !== "playing" && this.screen !== "paused") return;
    this.screen = this.screen === "paused" ? "playing" : "paused";
    if (this.screen === "paused") {
      this.physics.pause();
      this.showCallout("STRATEGIC THINKING BREAK", COLORS.yellow);
    } else {
      this.physics.resume();
      this.showCallout("BACK TO THE GRIND", COLORS.mint);
      this.ensureMusic();
    }
    this.emitStats(true);
  }

  update(_time: number, deltaMs: number) {
    const rawDelta = Math.min(deltaMs / 1000, 0.04);
    this.updateBackdrop(rawDelta);
    this.updatePlayerVisuals();

    if (this.screen !== "playing") return;

    const difficulty = getDifficulty(this.elapsed);
    this.worldSpeed = difficulty.speed;
    const timeScale = this.slowRemaining > 0 ? 0.53 : 1;
    const delta = rawDelta * timeScale;

    this.elapsed += rawDelta;
    this.runTime += rawDelta;
    this.distance += this.worldSpeed * rawDelta * 0.015;
    const scoreBoost = this.coffeeRemaining > 0 ? 2 : 1;
    this.score += rawDelta * this.worldSpeed * 0.09 * getMultiplier(this.streak) * scoreBoost;

    this.tickEffects(rawDelta);
    this.tickQuarter(difficulty.absoluteQuarter, difficulty.quarter);
    this.tickSpawns(delta, difficulty.spawnGap);
    this.updateHazards(delta);
    this.updatePickups(delta);
    this.tickBoss(delta);
    this.tickMusic();

    this.stateEmitTimer -= rawDelta;
    if (this.stateEmitTimer <= 0) this.emitStats();
  }

  private updateBackdrop(delta: number) {
    const speed = this.screen === "playing" ? this.worldSpeed : 34;
    const slow = this.slowRemaining > 0 ? 0.53 : 1;
    this.skyline.tilePositionX += speed * delta * 0.04 * slow;
    this.ceilingLights.tilePositionX += speed * delta * 0.22 * slow;
    this.floorTiles.tilePositionX += speed * delta * 0.92 * slow;
    for (const item of this.parallax) {
      item.object.x -= speed * delta * item.speed * slow;
      if (item.object.x < -180) item.object.x += item.resetX + 260;
    }
  }

  private updatePlayerVisuals() {
    if (!this.player?.body) return;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const grounded = body.blocked.down || body.touching.down;
    if (grounded && !this.ducking) {
      this.jumpsUsed = 0;
      const bob = Math.sin(this.runTime * (9 + this.worldSpeed / 90));
      this.player.setAngle(bob * 1.7);
    } else if (!grounded && !this.ducking) {
      this.player.setAngle(clamp(body.velocity.y / 95, -7, 8));
    }
    if (this.invulnerableRemaining > 0 || this.wfhRemaining > 0) {
      this.player.setAlpha(Math.floor(this.runTime * 18) % 2 === 0 ? 0.38 : 1);
    } else {
      this.player.setAlpha(1);
    }
  }

  private tickEffects(delta: number) {
    this.invulnerableRemaining = Math.max(0, this.invulnerableRemaining - delta);
    this.peopleShieldRemaining = Math.max(0, this.peopleShieldRemaining - delta);
    this.slowRemaining = Math.max(0, this.slowRemaining - delta);
    this.coffeeRemaining = Math.max(0, this.coffeeRemaining - delta);
    this.wfhRemaining = Math.max(0, this.wfhRemaining - delta);
    this.powerRemaining = Math.max(
      this.peopleShieldRemaining,
      this.slowRemaining,
      this.coffeeRemaining,
      this.wfhRemaining,
    );

    const homeAlpha = this.wfhRemaining > 0 ? 0.1 + Math.sin(this.runTime * 8) * 0.04 : 0;
    this.homeOverlay.setAlpha(homeAlpha);
    if (this.coffeeRemaining > 0) this.player.setTint(0xffd447);
    else if (this.peopleShieldRemaining > 0) this.player.setTint(0x9d7bff);
    else if (this.wfhRemaining > 0) this.player.setTint(0xff82c8);
    else this.player.clearTint();
  }

  private tickQuarter(absoluteQuarter: number, quarter: number) {
    if (absoluteQuarter === this.lastAbsoluteQuarter) return;
    this.lastAbsoluteQuarter = absoluteQuarter;
    this.setQuarterLook(quarter);
    const fiscalYear = Math.floor(absoluteQuarter / 4) + 1;
    this.showCallout(`FY${fiscalYear} · Q${quarter}  ${QUARTERS[quarter - 1].name}`, COLORS.yellow);
    this.playSfx("sfx-milestone", 0.62, 0.92 + quarter * 0.04);
    if (quarter === 4) this.startBoss();
  }

  private setQuarterLook(quarter: number) {
    const look = QUARTERS[quarter - 1];
    this.wall.setFillStyle(look.wall);
    this.glow.setFillStyle(look.accent, quarter === 4 ? 0.13 : 0.07);
    if (!this.settings.reducedMotion) {
      this.cameras.main.flash(160, 99, 217, 255, false);
    }
  }

  private tickSpawns(delta: number, baseGap: number) {
    if (this.bossRemaining > 0) return;
    this.spawnTimer -= delta;
    this.pickupTimer -= delta;

    if (this.spawnTimer <= 0) {
      this.spawnPattern();
      const widePenalty = this.lastHazard === "printer" ? 0.35 : 0;
      this.spawnTimer = baseGap + widePenalty + Phaser.Math.FloatBetween(0.16, 0.58);
    }
    if (this.pickupTimer <= 0) {
      this.spawnPickup();
      this.pickupTimer = Phaser.Math.FloatBetween(12, 18);
    }
  }

  private spawnPattern() {
    const unlocked = getUnlockedEnemies(this.elapsed);
    let kind = Phaser.Utils.Array.GetRandom(unlocked);
    if (kind === this.lastHazard && unlocked.length > 1) {
      kind = Phaser.Utils.Array.GetRandom(unlocked.filter((candidate) => candidate !== this.lastHazard));
    }

    if (kind === "reply-all") {
      const lane = Phaser.Math.RND.pick([GROUND_Y - 38, GROUND_Y - 61]);
      for (let index = 0; index < 3; index += 1) {
        this.createHazard(kind, GAME_WIDTH + 50 + index * 92, lane, index === 0);
      }
      this.spawnTimer += 0.65;
    } else {
      this.createHazard(kind);
    }
    this.lastHazard = kind;
  }

  private createHazard(kind: EnemyKind, x = GAME_WIDTH + 60, explicitY?: number, showSpeech = true) {
    const definition = ENEMIES[kind];
    const sprite = this.add.image(0, 0, `enemy-${kind}`);
    sprite.setOrigin(0.5).setDepth(5);

    let y = explicitY ?? GROUND_Y - definition.height / 2;
    if (kind === "calendar" && explicitY === undefined) y = Phaser.Math.RND.pick([GROUND_Y - 60, GROUND_Y - 112]);
    if (kind === "follow-up" && explicitY === undefined) y = GROUND_Y - 82;
    if (kind === "meeting" && explicitY === undefined) y = GROUND_Y - definition.height / 2;

    const phrase = Phaser.Utils.Array.GetRandom([...definition.phrases]);
    const speech = this.add
      .text(0, -definition.height / 2 - 13, phrase, {
        fontFamily: "'Press Start 2P'",
        fontSize: "8px",
        color: COLORS.ink,
        backgroundColor: COLORS.cream,
        padding: { x: 5, y: 4 },
      })
      .setOrigin(0.5, 1)
      .setVisible(showSpeech);
    const cue = this.add
      .text(0, definition.height / 2 + 8, definition.cue, {
        fontFamily: "'Press Start 2P'",
        fontSize: "6px",
        color: COLORS.white,
      })
      .setOrigin(0.5, 0)
      .setAlpha(this.settings.reducedMotion ? 0.95 : 0.72);
    const container = this.add.container(x, y, [sprite, speech, cue]);
    container.setDepth(8);

    const speedFactor =
      kind === "chair" ? 1.52 : kind === "micromanager" ? 0.74 : kind === "follow-up" ? 1.16 : 1;
    this.hazards.push({
      object: container,
      kind,
      width: definition.width,
      height: definition.height,
      baseY: y,
      phase: Phaser.Math.FloatBetween(0, Math.PI * 2),
      speedFactor,
      passed: false,
      hit: false,
      minGap: Number.POSITIVE_INFINITY,
      velocityY: 0,
      mirrored: false,
    });
  }

  private updateHazards(delta: number) {
    const playerRect = this.getPlayerRect();

    for (const hazard of this.hazards) {
      let factor = hazard.speedFactor;
      if (hazard.kind === "micromanager") {
        factor = hazard.object.x > this.player.x + 185 ? 1.12 : 0.7;
      }
      hazard.object.x -= this.worldSpeed * delta * factor;
      hazard.phase += delta;

      if (hazard.kind === "follow-up") {
        hazard.object.y = hazard.baseY + Math.sin(hazard.phase * 4.5) * 40;
      } else if (hazard.kind === "calendar") {
        hazard.object.y = hazard.baseY + Math.sin(hazard.phase * 2.4) * 6;
      } else if (hazard.kind === "meeting") {
        const trigger = hazard.object.x < 650 && hazard.object.x > 350;
        hazard.object.y = hazard.baseY - (trigger ? Math.sin(hazard.phase * 3) * 22 : 0);
      } else if (hazard.kind === "hr") {
        const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
        if (!hazard.mirrored && hazard.object.x < 640 && playerBody.velocity.y < -180) {
          hazard.velocityY = -520;
          hazard.mirrored = true;
        }
        if (hazard.velocityY !== 0 || hazard.object.y < hazard.baseY) {
          hazard.velocityY += 1420 * delta;
          hazard.object.y = Math.min(hazard.baseY, hazard.object.y + hazard.velocityY * delta);
          if (hazard.object.y >= hazard.baseY) hazard.velocityY = 0;
        }
      }

      const hazardRect = new Phaser.Geom.Rectangle(
        hazard.object.x - hazard.width / 2 + 3,
        hazard.object.y - hazard.height / 2 + 3,
        hazard.width - 6,
        hazard.height - 5,
      );
      const horizontalGap = Math.abs(hazard.object.x - this.player.x) - (hazard.width + playerRect.width) / 2;
      hazard.minGap = Math.min(hazard.minGap, Math.abs(horizontalGap));

      if (!hazard.hit && Phaser.Geom.Intersects.RectangleToRectangle(playerRect, hazardRect)) {
        this.hitHazard(hazard);
      }

      if (!hazard.passed && hazard.object.x + hazard.width / 2 < this.player.x - 18) {
        hazard.passed = true;
        if (!hazard.hit) {
          const definition = ENEMIES[hazard.kind];
          const closeCall = hazard.minGap < 18 ? 45 : 0;
          this.tasksAvoided += 1;
          this.streak += 1;
          this.score += (definition.points + closeCall) * getMultiplier(this.streak);
          if (closeCall > 0 && this.streak % 3 === 0) this.showCallout("TOO CLOSE TO CIRCLE BACK", COLORS.mint);
        }
      }
    }

    const expired = this.hazards.filter((hazard) => hazard.object.x < -140);
    expired.forEach((hazard) => hazard.object.destroy());
    this.hazards = this.hazards.filter((hazard) => hazard.object.x >= -140);
  }

  private hitHazard(hazard: Hazard) {
    const family = ENEMIES[hazard.kind].family;
    const protectedByHeadphones = family === "people" && this.peopleShieldRemaining > 0;
    const protectedByPhase = this.invulnerableRemaining > 0 || this.wfhRemaining > 0 || this.coffeeRemaining > 0;
    if (protectedByHeadphones || protectedByPhase) {
      hazard.hit = true;
      hazard.object.setAlpha(0.35);
      this.score += 70;
      return;
    }

    hazard.hit = true;
    this.sanity -= 1;
    this.streak = 0;
    this.invulnerableRemaining = 1.45;
    this.player.setTint(0xff5c8a);
    this.burst(this.player.x + 8, this.player.y, 0xff6b6b, 11);
    this.playSfx("sfx-hit", 0.7, 0.92);
    if (!this.settings.reducedMotion) this.cameras.main.shake(135, 0.006);
    this.showCallout(this.sanity > 0 ? "SANITY -1" : "PERFORMANCE REVIEW DUE", COLORS.coral);
    if (this.sanity <= 0) this.endRun();
  }

  private getPlayerRect() {
    const height = this.ducking ? 30 : 50;
    const width = this.ducking ? 32 : 26;
    return new Phaser.Geom.Rectangle(
      this.player.x - width / 2,
      this.player.y - height / 2 + (this.ducking ? 11 : 1),
      width,
      height,
    );
  }

  private spawnPickup() {
    const kinds: PowerUpKind[] = ["coffee", "headphones", "pto", "inbox", "wfh"];
    const kind = Phaser.Utils.Array.GetRandom(kinds);
    const sprite = this.add.image(0, 0, `power-${kind}`);
    const label = this.add
      .text(0, 27, POWER_UPS[kind].shortLabel, {
        fontFamily: "'Press Start 2P'",
        fontSize: "6px",
        color: COLORS.white,
        backgroundColor: COLORS.ink,
        padding: { x: 4, y: 3 },
      })
      .setOrigin(0.5, 0);
    const object = this.add.container(GAME_WIDTH + 70, GROUND_Y - Phaser.Math.Between(65, 128), [sprite, label]);
    object.setDepth(10);
    this.pickups.push({ object, kind, phase: Phaser.Math.FloatBetween(0, Math.PI * 2) });
  }

  private updatePickups(delta: number) {
    const playerRect = this.getPlayerRect();
    for (const pickup of this.pickups) {
      pickup.object.x -= this.worldSpeed * delta;
      pickup.phase += delta * 4;
      pickup.object.y += Math.sin(pickup.phase) * delta * 7;
      pickup.object.angle = this.settings.reducedMotion ? 0 : Math.sin(pickup.phase) * 4;
      const pickupRect = new Phaser.Geom.Rectangle(pickup.object.x - 19, pickup.object.y - 19, 38, 38);
      if (Phaser.Geom.Intersects.RectangleToRectangle(playerRect, pickupRect)) {
        this.collectPowerUp(pickup);
        pickup.object.x = -300;
      }
    }
    const expired = this.pickups.filter((pickup) => pickup.object.x < -80);
    expired.forEach((pickup) => pickup.object.destroy());
    this.pickups = this.pickups.filter((pickup) => pickup.object.x >= -80);
  }

  private collectPowerUp(pickup: Pickup) {
    this.burst(pickup.object.x, pickup.object.y, POWER_UPS[pickup.kind].color, 12);
    this.playSfx("sfx-power", 0.62, 1.04);
    this.showCallout(POWER_UPS[pickup.kind].label, `#${POWER_UPS[pickup.kind].color.toString(16).padStart(6, "0")}`);
    if (pickup.kind === "coffee") {
      this.coffeeRemaining = 5.8;
      this.powerRemaining = this.coffeeRemaining;
    } else {
      this.heldPower = pickup.kind;
    }
    this.score += 125;
  }

  private usePowerUp() {
    if (this.screen !== "playing" || !this.heldPower) return;
    const power = this.heldPower;
    this.heldPower = null;
    this.playSfx("sfx-power", 0.7, 0.88);
    if (power === "headphones") {
      this.peopleShieldRemaining = 8;
      this.powerRemaining = 8;
    } else if (power === "pto") {
      this.slowRemaining = 7;
      this.powerRemaining = 7;
    } else if (power === "inbox") {
      let cleared = 0;
      for (const hazard of this.hazards) {
        if (ENEMIES[hazard.kind].family === "email" && !hazard.hit) {
          hazard.hit = true;
          hazard.object.setAlpha(0.22);
          hazard.object.x = -200;
          cleared += 1;
        }
      }
      this.score += cleared * 140;
      this.showCallout(`INBOX ZERO · ${cleared} DELETED`, COLORS.blue);
    } else if (power === "wfh") {
      this.wfhRemaining = 7;
      this.powerRemaining = 7;
      this.showCallout("COMMUTE: CANCELLED", COLORS.magenta);
    }
    this.emitStats(true);
  }

  private startBoss() {
    if (this.bossRemaining > 0) return;
    this.bossRemaining = 17;
    this.bossProjectileTimer = 1.2;
    const sprite = this.add.image(0, 0, "enemy-boss");
    const title = this.add
      .text(0, -66, "CIRCLE-BACK BOSS", {
        fontFamily: "'Press Start 2P'",
        fontSize: "10px",
        color: COLORS.white,
        backgroundColor: COLORS.magenta,
        padding: { x: 7, y: 5 },
      })
      .setOrigin(0.5);
    this.boss = this.add.container(GAME_WIDTH + 100, GROUND_Y - 54, [sprite, title]).setDepth(12);
    this.showCallout("MANDATORY ALL-HANDS", COLORS.magenta);
    this.playSfx("sfx-milestone", 0.78, 0.72);
  }

  private tickBoss(delta: number) {
    if (!this.boss || this.bossRemaining <= 0) return;
    this.bossRemaining = Math.max(0, this.bossRemaining - delta);
    this.bossProjectileTimer -= delta;
    this.boss.x = Phaser.Math.Linear(this.boss.x, 825, 0.055);
    this.boss.y = GROUND_Y - 54 - Math.abs(Math.sin(this.runTime * 1.8)) * 22;

    if (this.bossProjectileTimer <= 0) {
      const lane = Phaser.Math.RND.pick([GROUND_Y - 38, GROUND_Y - 64, GROUND_Y - 112]);
      const kind: EnemyKind = Phaser.Math.RND.pick(["calendar", "reply-all", "follow-up"]);
      this.createHazard(kind, 780, lane, true);
      this.bossProjectileTimer = Phaser.Math.FloatBetween(1.25, 1.85);
    }

    if (this.bossRemaining <= 0) {
      const bossX = this.boss.x;
      const bossY = this.boss.y;
      this.boss.destroy();
      this.boss = null;
      this.score += ENEMIES.boss.points * getMultiplier(this.streak);
      this.tasksAvoided += 1;
      this.burst(bossX, bossY, 0x67e8a5, 20);
      this.showCallout("MEETING COULD HAVE BEEN AN EMAIL", COLORS.mint);
      this.playSfx("sfx-milestone", 0.72, 1.24);
      this.spawnTimer = 2.2;
    }
  }

  private endRun() {
    this.screen = "gameover";
    this.physics.pause();
    this.review = getPerformanceReview(this.score, this.tasksAvoided);
    const finalScore = Math.floor(this.score);
    this.newBest = finalScore > this.best;
    this.best = Math.max(this.best, finalScore);
    this.player.setTint(0xff5c8a).setAngle(88).setAlpha(1);
    this.showCallout("LOGGED OFF INVOLUNTARILY", COLORS.coral);
    this.emitStats(true);
  }

  private playSfx(key: string, volume: number, rate = 1) {
    if (!this.settings.sfx || !this.cache.audio.exists(key)) return;
    this.sound.play(key, { volume, rate });
  }

  private burst(x: number, y: number, color: number, count: number) {
    if (this.settings.reducedMotion) return;
    for (let index = 0; index < count; index += 1) {
      const size = Phaser.Math.RND.pick([3, 4, 5, 7]);
      const particle = this.add.rectangle(x, y, size, size, color).setDepth(24);
      this.tweens.add({
        targets: particle,
        x: x + Phaser.Math.Between(-55, 55),
        y: y + Phaser.Math.Between(-58, 24),
        alpha: 0,
        angle: Phaser.Math.Between(-180, 180),
        duration: Phaser.Math.Between(260, 520),
        ease: "Quad.easeOut",
        onComplete: () => particle.destroy(),
      });
    }
  }

  private ensureMusic() {
    if (!this.settings.music || this.musicContext) {
      this.musicContext?.resume().catch(() => undefined);
      return;
    }
    const AudioContextClass = window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    this.musicContext = new AudioContextClass();
    this.nextNoteAt = this.musicContext.currentTime;
  }

  private tickMusic() {
    const context = this.musicContext;
    if (!context || !this.settings.music || context.state !== "running") return;
    if (context.currentTime < this.nextNoteAt) return;

    const melody = [261.63, 329.63, 392, 523.25, 392, 329.63, 293.66, 392];
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(melody[this.noteIndex % melody.length], now);
    gain.gain.setValueAtTime(0.022, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.13);
    this.noteIndex += 1;
    this.nextNoteAt = now + Math.max(0.105, 0.17 - this.worldSpeed / 16000);
  }

  private showCallout(message: string, color: string) {
    this.statusText.setText(message).setColor(color).setAlpha(1).setScale(1);
    this.tweens.killTweensOf(this.statusText);
    if (this.settings.reducedMotion) {
      this.time.delayedCall(950, () => this.statusText.setAlpha(0));
    } else {
      this.tweens.add({
        targets: this.statusText,
        y: { from: 82, to: 69 },
        alpha: { from: 1, to: 0 },
        scale: { from: 1.04, to: 0.96 },
        duration: 1500,
        ease: "Quad.easeOut",
      });
    }
  }

  private applyAvatar(avatar: AvatarProfile) {
    this.avatar = { ...avatar };
    const loadId = ++this.avatarLoadId;
    if (!avatar.dataUrl) {
      this.drawPlayerTexture();
      return;
    }
    const image = new Image();
    image.onload = () => {
      if (loadId === this.avatarLoadId) this.drawPlayerTexture(image);
    };
    image.onerror = () => this.drawPlayerTexture();
    image.src = avatar.dataUrl;
  }

  private emitStats(immediate = false) {
    if (!immediate && this.stateEmitTimer > 0) return;
    this.stateEmitTimer = 0.1;
    const difficulty = getDifficulty(this.elapsed);
    const stats: GameStats = {
      ...INITIAL_STATS,
      screen: this.screen,
      score: Math.floor(this.score),
      best: this.best,
      sanity: this.sanity,
      streak: this.streak,
      multiplier: getMultiplier(this.streak),
      quarter: difficulty.quarter,
      fiscalYear: difficulty.fiscalYear,
      tasksAvoided: this.tasksAvoided,
      distance: Math.floor(this.distance),
      powerUp: this.heldPower,
      powerRemaining: Math.ceil(this.powerRemaining),
      review: this.review,
      newBest: this.newBest,
      bossActive: this.bossRemaining > 0,
    };
    this.callbacks.onStats(stats);
  }
}

export function createOfficeRunGame(parent: HTMLElement, callbacks: GameCallbacks) {
  const scene = new OfficeScene(callbacks);
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: "#080c18",
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    render: {
      antialias: false,
      pixelArt: true,
      roundPixels: true,
    },
    fps: {
      target: 60,
      forceSetTimeOut: false,
    },
    scene,
  });
}

export function sendGameCommand(game: Phaser.Game | null, command: GameCommand) {
  game?.events.emit("office-command", command);
}
