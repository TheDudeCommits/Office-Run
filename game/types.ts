export type GameScreen =
  | "menu"
  | "playing"
  | "paused"
  | "gameover"
  | "levelcomplete"
  | "gamecomplete";

export type PowerUpKind = "bestie" | "headphones" | "pto" | "inbox" | "wfh";

export type EnemyKind =
  | "small-talk"
  | "chair"
  | "calendar"
  | "printer"
  | "follow-up"
  | "hr"
  | "meeting"
  | "micromanager"
  | "reply-all"
  | "boss";

export type Settings = {
  music: boolean;
  sfx: boolean;
  reducedMotion: boolean;
  hardcore: boolean;
};

export type GameStats = {
  screen: GameScreen;
  score: number;
  best: number;
  socialBattery: number;
  streak: number;
  multiplier: number;
  level: number;
  levelName: string;
  levelProgress: number;
  unlockedLevel: number;
  tasksAvoided: number;
  distance: number;
  coffees: number;
  bestieActive: boolean;
  powerUp: PowerUpKind | null;
  powerRemaining: number;
  review: string;
  newBest: boolean;
  bossActive: boolean;
};

export type GameCommand =
  | { type: "start"; level?: number }
  | { type: "menu" }
  | { type: "jump" }
  | { type: "jump-release" }
  | { type: "duck"; active: boolean }
  | { type: "pause" }
  | { type: "use-powerup" }
  | { type: "settings"; settings: Settings }
  | { type: "hydrate-progress"; best: number; unlockedLevel: number };

export type GameCallbacks = {
  onStats: (stats: GameStats) => void;
};

export const DEFAULT_SETTINGS: Settings = {
  music: true,
  sfx: true,
  reducedMotion: false,
  hardcore: false,
};

export const INITIAL_STATS: GameStats = {
  screen: "menu",
  score: 0,
  best: 0,
  socialBattery: 100,
  streak: 0,
  multiplier: 1,
  level: 1,
  levelName: "CUBICLE ONBOARDING",
  levelProgress: 0,
  unlockedLevel: 1,
  tasksAvoided: 0,
  distance: 0,
  coffees: 0,
  bestieActive: false,
  powerUp: null,
  powerRemaining: 0,
  review: "",
  newBest: false,
  bossActive: false,
};
