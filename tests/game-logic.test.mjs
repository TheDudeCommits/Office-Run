import assert from "node:assert/strict";
import test from "node:test";

import {
  ENEMIES,
  LEVELS,
  POWER_UPS,
  getLevel,
  getLevelDifficulty,
  getLevelEnemies,
  getMultiplier,
  getPerformanceReview,
} from "../game/config.ts";

test("the campaign has five finite, increasingly demanding levels", () => {
  assert.equal(LEVELS.length, 5);
  assert.deepEqual(LEVELS.map((level) => level.id), [1, 2, 3, 4, 5]);
  assert.ok(LEVELS.every((level) => level.targetDistance > 0));
  assert.ok(LEVELS.every((level, index) => index === 0 || level.targetDistance > LEVELS[index - 1].targetDistance));
  assert.equal(getLevel(99).id, 5);
  assert.equal(getLevel(-4).id, 1);
  assert.equal(LEVELS[4].boss, true);
});

test("difficulty ramps inside each level without removing reaction time", () => {
  for (const level of LEVELS) {
    const start = getLevelDifficulty(level.id, 0);
    const finish = getLevelDifficulty(level.id, 1);
    assert.equal(start.speed, level.baseSpeed);
    assert.equal(finish.speed, level.maxSpeed);
    assert.ok(finish.speed > start.speed);
    assert.ok(finish.spawnGap < start.spawnGap);
    assert.ok(finish.spawnGap >= 0.8);
  }
});

test("enemy variety expands by level and Bestie Bob is a real power-up", () => {
  assert.ok(Object.keys(ENEMIES).length >= 10);
  assert.deepEqual(Object.keys(POWER_UPS).sort(), ["bestie", "headphones", "inbox", "pto", "wfh"]);
  assert.deepEqual(getLevelEnemies(1), ["small-talk", "chair", "calendar"]);
  assert.ok(getLevelEnemies(5).includes("reply-all"));
  assert.ok(!getLevelEnemies(5).includes("boss"));
  assert.match(POWER_UPS.bestie.description, /one hit/i);
  assert.ok(new Set(Object.values(ENEMIES).map((enemy) => enemy.cue)).size >= 9);
});

test("streak multiplier is bounded and performance reviews are deterministic", () => {
  assert.equal(getMultiplier(0), 1);
  assert.equal(getMultiplier(5), 2);
  assert.equal(getMultiplier(999), 5);
  assert.equal(getPerformanceReview(4_200, 21), getPerformanceReview(4_200, 21));
});
