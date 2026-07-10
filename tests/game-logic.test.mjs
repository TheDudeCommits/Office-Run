import assert from "node:assert/strict";
import test from "node:test";

import {
  ENEMIES,
  POWER_UPS,
  QUARTER_SECONDS,
  getDifficulty,
  getMultiplier,
  getPerformanceReview,
  getUnlockedEnemies,
} from "../game/config.ts";
import { hashPixels, profileFromHash, quantizeChannel } from "../app/lib/avatar.ts";

test("difficulty ramps while preserving the four-quarter fiscal cycle", () => {
  const start = getDifficulty(0);
  const q4 = getDifficulty(QUARTER_SECONDS * 3 + 1);
  const yearTwo = getDifficulty(QUARTER_SECONDS * 4 + 1);
  const late = getDifficulty(1_000);

  assert.deepEqual(
    { quarter: start.quarter, fiscalYear: start.fiscalYear, speed: start.speed },
    { quarter: 1, fiscalYear: 1, speed: 280 },
  );
  assert.equal(q4.quarter, 4);
  assert.equal(yearTwo.quarter, 1);
  assert.equal(yearTwo.fiscalYear, 2);
  assert.ok(q4.speed > start.speed);
  assert.ok(q4.spawnGap < start.spawnGap);
  assert.equal(late.speed, 660);
  assert.equal(late.spawnGap, 0.78);
});

test("the roster contains distinct enemy families and all agreed power-ups", () => {
  assert.ok(Object.keys(ENEMIES).length >= 10);
  assert.deepEqual(Object.keys(POWER_UPS).sort(), ["coffee", "headphones", "inbox", "pto", "wfh"]);
  assert.deepEqual(getUnlockedEnemies(0), ["small-talk"]);
  assert.ok(getUnlockedEnemies(80).includes("reply-all"));
  assert.ok(!getUnlockedEnemies(1_000).includes("boss"));
  assert.ok(new Set(Object.values(ENEMIES).map((enemy) => enemy.cue)).size >= 9);
});

test("streak multiplier is bounded and performance reviews are deterministic", () => {
  assert.equal(getMultiplier(0), 1);
  assert.equal(getMultiplier(5), 2);
  assert.equal(getMultiplier(999), 5);
  assert.equal(getPerformanceReview(4_200, 21), getPerformanceReview(4_200, 21));
});

test("avatar palette helpers are deterministic and safely quantized", () => {
  assert.equal(quantizeChannel(-10), 0);
  assert.equal(quantizeChannel(255), 255);
  assert.equal(quantizeChannel(127), 102);
  const pixels = new Uint8ClampedArray([12, 34, 56, 255, 200, 145, 90, 255]);
  const hash = hashPixels(pixels);
  assert.equal(hash, hashPixels(pixels));
  assert.deepEqual(profileFromHash(hash), profileFromHash(hash));
  assert.match(profileFromHash(hash).accent, /^#[0-9a-f]{6}$/i);
});
