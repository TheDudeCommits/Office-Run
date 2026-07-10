import type { EnemyKind, PowerUpKind } from "./types";

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;
export const GROUND_Y = 438;

export type EnemyDefinition = {
  kind: EnemyKind;
  label: string;
  phrases: readonly string[];
  width: number;
  height: number;
  family: "people" | "email" | "machine" | "boss";
  points: number;
  cue: string;
};

export type LevelDefinition = {
  id: number;
  name: string;
  subtitle: string;
  targetDistance: number;
  baseSpeed: number;
  maxSpeed: number;
  spawnGap: number;
  minSpawnGap: number;
  wall: number;
  accent: number;
  enemies: readonly EnemyKind[];
  boss: boolean;
};

export const ENEMIES: Record<EnemyKind, EnemyDefinition> = {
  "small-talk": { kind: "small-talk", label: "SMALL TALK", phrases: ["Weekend plans?", "Got a minute?", "Busy day, huh?"], width: 38, height: 58, family: "people", points: 80, cue: "WALKER" },
  chair: { kind: "chair", label: "CHAIR", phrases: ["ERGONOMIC!", "WHEEEE", "HOT DESK"], width: 40, height: 28, family: "machine", points: 100, cue: "FAST + LOW" },
  calendar: { kind: "calendar", label: "INVITE", phrases: ["Quick sync?", "15 mins?", "Optional*"], width: 42, height: 34, family: "email", points: 110, cue: "AIR LANE" },
  printer: { kind: "printer", label: "PRINTER JAM", phrases: ["PC LOAD LETTER", "OUT OF CYAN", "WHY."], width: 66, height: 54, family: "machine", points: 140, cue: "WIDE" },
  "follow-up": { kind: "follow-up", label: "FOLLOW-UP", phrases: ["Friendly reminder", "Bumping this!", "Per my last..."], width: 44, height: 30, family: "email", points: 150, cue: "ZIGZAG" },
  hr: { kind: "hr", label: "HR", phrases: ["Safe space!", "Tiny check-in", "We're a family"], width: 42, height: 58, family: "people", points: 170, cue: "MIRRORS JUMP" },
  meeting: { kind: "meeting", label: "MEETING", phrases: ["Take it offline", "Parking lot!", "Let's unpack"], width: 54, height: 50, family: "people", points: 180, cue: "CHANGES LANE" },
  micromanager: { kind: "micromanager", label: "MICROMANAGER", phrases: ["Just checking in", "Status?", "Can you share screen?"], width: 46, height: 66, family: "people", points: 220, cue: "FOLLOWS" },
  "reply-all": { kind: "reply-all", label: "REPLY ALL", phrases: ["Thanks!", "+1", "Remove me"], width: 36, height: 26, family: "email", points: 120, cue: "SWARM" },
  boss: { kind: "boss", label: "CIRCLE-BACK BOSS", phrases: ["REVISIT IN Q4", "MORE SYNERGY", "CAN YOU OWN THIS?"], width: 82, height: 94, family: "boss", points: 1200, cue: "EXECUTIVE EVENT" },
};

export const POWER_UPS: Record<PowerUpKind, { label: string; shortLabel: string; color: number; description: string }> = {
  bestie: { label: "BESTIE BOB HAS YOUR BACK", shortLabel: "BESTIE", color: 0x67e8a5, description: "Bob runs with Joi and takes one hit for her" },
  headphones: { label: "NOISE-CANCELING", shortLabel: "HEADPHONES", color: 0x9d7bff, description: "Ignore people problems" },
  pto: { label: "PTO APPROVED", shortLabel: "PTO", color: 0x67e8a5, description: "Slow the office down" },
  inbox: { label: "INBOX ZERO", shortLabel: "INBOX 0", color: 0x63d9ff, description: "Delete all email hazards" },
  wfh: { label: "WORK FROM HOME", shortLabel: "WFH", color: 0xff82c8, description: "Phase through corporate reality" },
};

export const LEVELS: readonly LevelDefinition[] = [
  { id: 1, name: "CUBICLE ONBOARDING", subtitle: "Survive orientation without volunteering.", targetDistance: 180, baseSpeed: 270, maxSpeed: 345, spawnGap: 1.95, minSpawnGap: 1.35, wall: 0x17213b, accent: 0x63d9ff, enemies: ["small-talk", "chair", "calendar"], boss: false },
  { id: 2, name: "MEETING ROOM MAZE", subtitle: "Every door leads to a quick sync.", targetDistance: 230, baseSpeed: 315, maxSpeed: 400, spawnGap: 1.72, minSpawnGap: 1.18, wall: 0x222044, accent: 0x9d7bff, enemies: ["small-talk", "chair", "calendar", "printer", "follow-up"], boss: false },
  { id: 3, name: "OPEN-PLAN PANIC", subtitle: "No walls. No privacy. No mercy.", targetDistance: 285, baseSpeed: 355, maxSpeed: 450, spawnGap: 1.55, minSpawnGap: 1.02, wall: 0x1b2d38, accent: 0x67e8a5, enemies: ["chair", "calendar", "printer", "follow-up", "hr", "meeting"], boss: false },
  { id: 4, name: "EXECUTIVE ESCALATION", subtitle: "Visibility was a terrible career goal.", targetDistance: 340, baseSpeed: 400, maxSpeed: 510, spawnGap: 1.4, minSpawnGap: 0.9, wall: 0x2e1c34, accent: 0xffd447, enemies: ["printer", "follow-up", "hr", "meeting", "micromanager", "reply-all"], boss: false },
  { id: 5, name: "THE ALL-HANDS ESCAPE", subtitle: "Outrun the org chart. Log off forever.", targetDistance: 410, baseSpeed: 440, maxSpeed: 565, spawnGap: 1.28, minSpawnGap: 0.8, wall: 0x310f2d, accent: 0xff5c8a, enemies: ["small-talk", "chair", "calendar", "printer", "follow-up", "hr", "meeting", "micromanager", "reply-all"], boss: true },
] as const;

export const PERFORMANCE_REVIEWS = [
  "EXCEEDED EXPECTATIONS (FOR A FLIGHT RISK)",
  "STRONG ESCALATION AVOIDANCE SKILLS",
  "NEEDS IMPROVEMENT: ANSWERED ZERO EMAILS",
  "PROMOTION DENIED. VIBES IMMACULATE.",
  "CULTURE FIT: QUESTIONABLE. SPEED: ELITE.",
  "SUCCESSFULLY DELEGATED ALL CONSEQUENCES",
] as const;

export function getLevel(level: number) {
  return LEVELS[Math.max(0, Math.min(LEVELS.length - 1, Math.floor(level) - 1))];
}

export function getLevelDifficulty(level: number, progress: number) {
  const definition = getLevel(level);
  const normalized = Math.max(0, Math.min(1, progress));
  return {
    speed: definition.baseSpeed + (definition.maxSpeed - definition.baseSpeed) * normalized,
    spawnGap: definition.spawnGap + (definition.minSpawnGap - definition.spawnGap) * normalized,
  };
}

export function getMultiplier(streak: number) {
  return Math.min(5, 1 + Math.floor(streak / 5));
}

export function getPerformanceReview(score: number, tasksAvoided: number) {
  const index = Math.abs(Math.floor(score / 100) + tasksAvoided * 3) % PERFORMANCE_REVIEWS.length;
  return PERFORMANCE_REVIEWS[index];
}

export function getLevelEnemies(level: number): EnemyKind[] {
  return [...getLevel(level).enemies];
}
