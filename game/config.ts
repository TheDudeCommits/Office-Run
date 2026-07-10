import type { EnemyKind, PowerUpKind } from "./types";

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;
export const GROUND_Y = 438;
export const QUARTER_SECONDS = 28;

export type EnemyDefinition = {
  kind: EnemyKind;
  label: string;
  phrases: readonly string[];
  width: number;
  height: number;
  family: "people" | "email" | "machine" | "boss";
  unlockAt: number;
  points: number;
  cue: string;
};

export const ENEMIES: Record<EnemyKind, EnemyDefinition> = {
  "small-talk": {
    kind: "small-talk",
    label: "SMALL TALK",
    phrases: ["Weekend plans?", "Got a minute?", "Busy day, huh?"],
    width: 38,
    height: 58,
    family: "people",
    unlockAt: 0,
    points: 80,
    cue: "WALKER",
  },
  chair: {
    kind: "chair",
    label: "CHAIR",
    phrases: ["ERGONOMIC!", "WHEEEE", "HOT DESK"],
    width: 40,
    height: 28,
    family: "machine",
    unlockAt: 8,
    points: 100,
    cue: "FAST + LOW",
  },
  calendar: {
    kind: "calendar",
    label: "INVITE",
    phrases: ["Quick sync?", "15 mins?", "Optional*"],
    width: 42,
    height: 34,
    family: "email",
    unlockAt: 16,
    points: 110,
    cue: "AIR LANE",
  },
  printer: {
    kind: "printer",
    label: "PRINTER JAM",
    phrases: ["PC LOAD LETTER", "OUT OF CYAN", "WHY."],
    width: 66,
    height: 54,
    family: "machine",
    unlockAt: 26,
    points: 140,
    cue: "WIDE",
  },
  "follow-up": {
    kind: "follow-up",
    label: "FOLLOW-UP",
    phrases: ["Friendly reminder", "Bumping this!", "Per my last..."],
    width: 44,
    height: 30,
    family: "email",
    unlockAt: 34,
    points: 150,
    cue: "ZIGZAG",
  },
  hr: {
    kind: "hr",
    label: "HR",
    phrases: ["Safe space!", "Tiny check-in", "We're a family"],
    width: 42,
    height: 58,
    family: "people",
    unlockAt: 44,
    points: 170,
    cue: "MIRRORS JUMP",
  },
  meeting: {
    kind: "meeting",
    label: "MEETING",
    phrases: ["Take it offline", "Parking lot!", "Let's unpack"],
    width: 54,
    height: 50,
    family: "people",
    unlockAt: 52,
    points: 180,
    cue: "CHANGES LANE",
  },
  micromanager: {
    kind: "micromanager",
    label: "MICROMANAGER",
    phrases: ["Just checking in", "Status?", "Can you share screen?"],
    width: 46,
    height: 66,
    family: "people",
    unlockAt: 66,
    points: 220,
    cue: "FOLLOWS",
  },
  "reply-all": {
    kind: "reply-all",
    label: "REPLY ALL",
    phrases: ["Thanks!", "+1", "Remove me"],
    width: 36,
    height: 26,
    family: "email",
    unlockAt: 76,
    points: 120,
    cue: "SWARM",
  },
  boss: {
    kind: "boss",
    label: "CIRCLE-BACK BOSS",
    phrases: ["REVISIT IN Q4", "MORE SYNERGY", "CAN YOU OWN THIS?"],
    width: 82,
    height: 94,
    family: "boss",
    unlockAt: 84,
    points: 1200,
    cue: "EXECUTIVE EVENT",
  },
};

export const POWER_UPS: Record<
  PowerUpKind,
  { label: string; shortLabel: string; color: number; description: string }
> = {
  coffee: {
    label: "COFFEE OVERDRIVE",
    shortLabel: "COFFEE",
    color: 0xffd447,
    description: "Temporary immunity and double score",
  },
  headphones: {
    label: "NOISE-CANCELING",
    shortLabel: "HEADPHONES",
    color: 0x9d7bff,
    description: "Ignore people problems",
  },
  pto: {
    label: "PTO APPROVED",
    shortLabel: "PTO",
    color: 0x67e8a5,
    description: "Slow the office down",
  },
  inbox: {
    label: "INBOX ZERO",
    shortLabel: "INBOX 0",
    color: 0x63d9ff,
    description: "Delete all email hazards",
  },
  wfh: {
    label: "WORK FROM HOME",
    shortLabel: "WFH",
    color: 0xff82c8,
    description: "Phase through corporate reality",
  },
};

export const QUARTERS = [
  { name: "CUBICLE ONBOARDING", wall: 0x17213b, accent: 0x63d9ff },
  { name: "MEETING ROOM MAZE", wall: 0x222044, accent: 0x9d7bff },
  { name: "EXECUTIVE FLOOR", wall: 0x2e1c34, accent: 0xffd447 },
  { name: "SYNERGY SINGULARITY", wall: 0x310f2d, accent: 0xff5c8a },
] as const;

export const PERFORMANCE_REVIEWS = [
  "EXCEEDED EXPECTATIONS (FOR A FLIGHT RISK)",
  "STRONG ESCALATION AVOIDANCE SKILLS",
  "NEEDS IMPROVEMENT: ANSWERED ZERO EMAILS",
  "PROMOTION DENIED. VIBES IMMACULATE.",
  "CULTURE FIT: QUESTIONABLE. SPEED: ELITE.",
  "SUCCESSFULLY DELEGATED ALL CONSEQUENCES",
] as const;

export function getDifficulty(elapsedSeconds: number) {
  const absoluteQuarter = Math.floor(elapsedSeconds / QUARTER_SECONDS);
  const quarter = (absoluteQuarter % 4) + 1;
  const fiscalYear = Math.floor(absoluteQuarter / 4) + 1;
  const speed = Math.min(660, 280 + elapsedSeconds * 2.25 + absoluteQuarter * 13);
  const spawnGap = Math.max(0.78, 1.82 - elapsedSeconds * 0.0065);

  return { absoluteQuarter, quarter, fiscalYear, speed, spawnGap };
}

export function getMultiplier(streak: number) {
  return Math.min(5, 1 + Math.floor(streak / 5));
}

export function getPerformanceReview(score: number, tasksAvoided: number) {
  const index = Math.abs(Math.floor(score / 100) + tasksAvoided * 3) % PERFORMANCE_REVIEWS.length;
  return PERFORMANCE_REVIEWS[index];
}

export function getUnlockedEnemies(elapsedSeconds: number): EnemyKind[] {
  return (Object.values(ENEMIES) as EnemyDefinition[])
    .filter((enemy) => enemy.kind !== "boss" && enemy.unlockAt <= elapsedSeconds)
    .map((enemy) => enemy.kind);
}
