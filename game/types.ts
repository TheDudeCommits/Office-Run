export type GameScreen = "menu" | "playing" | "paused" | "gameover";

export type PowerUpKind =
  | "coffee"
  | "headphones"
  | "pto"
  | "inbox"
  | "wfh";

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

export type AvatarProfile = {
  dataUrl: string | null;
  accent: string;
  title: string;
  custom: boolean;
};

export type GameStats = {
  screen: GameScreen;
  score: number;
  best: number;
  sanity: number;
  streak: number;
  multiplier: number;
  quarter: number;
  fiscalYear: number;
  tasksAvoided: number;
  distance: number;
  powerUp: PowerUpKind | null;
  powerRemaining: number;
  review: string;
  newBest: boolean;
  bossActive: boolean;
};

export type GameCommand =
  | { type: "start" }
  | { type: "jump" }
  | { type: "jump-release" }
  | { type: "duck"; active: boolean }
  | { type: "pause" }
  | { type: "use-powerup" }
  | { type: "settings"; settings: Settings }
  | { type: "avatar"; avatar: AvatarProfile }
  | { type: "hydrate-best"; best: number };

export type GameCallbacks = {
  onStats: (stats: GameStats) => void;
};

export const DEFAULT_SETTINGS: Settings = {
  music: true,
  sfx: true,
  reducedMotion: false,
  hardcore: false,
};

export const DEFAULT_AVATAR: AvatarProfile = {
  dataUrl: null,
  accent: "#63d9ff",
  title: "Spreadsheet Sprinter",
  custom: false,
};

export const INITIAL_STATS: GameStats = {
  screen: "menu",
  score: 0,
  best: 0,
  sanity: 3,
  streak: 0,
  multiplier: 1,
  quarter: 1,
  fiscalYear: 1,
  tasksAvoided: 0,
  distance: 0,
  powerUp: null,
  powerRemaining: 0,
  review: "",
  newBest: false,
  bossActive: false,
};
