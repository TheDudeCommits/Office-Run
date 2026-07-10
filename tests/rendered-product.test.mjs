import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`https://office-run.example${pathname}`, {
      headers: { accept: "text/html", host: "office-run.example", "x-forwarded-host": "office-run.example", "x-forwarded-proto": "https" },
    }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server renders the Joi campaign and social metadata", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();

  assert.match(html, /<title>Office Run — Escape the 9-to-5<\/title>/i);
  assert.match(html, /A FIVE-LEVEL CORPORATE ESCAPE/);
  assert.match(html, /START LEVEL/);
  assert.match(html, /JOI/);
  assert.match(html, /SOCIAL BATTERY/);
  assert.match(html, /BESTIE BOB/);
  assert.match(html, /https:\/\/office-run\.example\/og-joi\.png/);
  assert.match(html, /manifest\.webmanifest/);
  assert.doesNotMatch(html, /UPLOAD YOUR PHOTO|Chip Deadline|codex-preview|Your site is taking shape/i);
});

test("release assets and Joi animation files have the expected shape", async () => {
  const root = new URL("../", import.meta.url);
  const required = [
    "public/og-joi.png",
    "public/manifest.webmanifest",
    "public/sw.js",
    "public/assets/office/tileset.png",
    "public/assets/joi/joi-run.png",
    "public/assets/joi/joi-idle.png",
    "public/assets/joi/joi-celebrate.png",
    "public/assets/joi/joi-sad.png",
    "public/assets/joi/source-running-right.gif",
    "public/assets/joi/source-spritesheet.webp",
    "public/assets/licenses/kenney-ui-audio-license.txt",
    "public/audio/jump.ogg",
    "docs/GDD.md",
    "ASSETS.md",
    "TODO.md",
  ];
  await Promise.all(required.map((path) => access(new URL(path, root))));

  const [image, runSheet] = await Promise.all([
    stat(new URL("public/og-joi.png", root)),
    stat(new URL("public/assets/joi/joi-run.png", root)),
  ]);
  assert.ok(image.size > 100_000);
  assert.ok(runSheet.size > 20_000);

  const [component, engine, gitignore, assetLedger] = await Promise.all([
    readFile(new URL("app/components/OfficeRun.tsx", root), "utf8"),
    readFile(new URL("game/createOfficeRunGame.ts", root), "utf8"),
    readFile(new URL(".gitignore", root), "utf8"),
    readFile(new URL("ASSETS.md", root), "utf8"),
  ]);
  assert.match(component, /stopGameScroll/);
  assert.match(engine, /joi-running/);
  assert.match(engine, /sacrificeBestie/);
  assert.match(engine, /spawnCoffee/);
  assert.doesNotMatch(component, /OPENAI_API_KEY|\/api\/avatar/);
  assert.match(gitignore, /\.env\*/);
  assert.match(assetLedger, /project owner/i);
});
