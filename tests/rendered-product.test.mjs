import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`https://office-run.example${pathname}`, {
      headers: {
        accept: "text/html",
        host: "office-run.example",
        "x-forwarded-host": "office-run.example",
        "x-forwarded-proto": "https",
      },
    }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server renders the finished Office Run product and social metadata", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();

  assert.match(html, /<title>Office Run — Escape the 9-to-5<\/title>/i);
  assert.match(html, /OFFICE RUN/);
  assert.match(html, /RUN FROM RESPONSIBILITY/);
  assert.match(html, /UPLOAD YOUR PHOTO/);
  assert.match(html, /YOUR PHOTO NEVER LEAVES THIS BROWSER/);
  assert.match(html, /https:\/\/office-run\.example\/og\.png/);
  assert.match(html, /manifest\.webmanifest/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|SkeletonPreview/i);
});

test("release assets and privacy-sensitive files have the expected shape", async () => {
  const root = new URL("../", import.meta.url);
  const required = [
    "public/og.png",
    "public/manifest.webmanifest",
    "public/sw.js",
    "public/assets/office/tileset.png",
    "public/assets/licenses/kenney-ui-audio-license.txt",
    "public/audio/jump.ogg",
    "docs/GDD.md",
    "ASSETS.md",
    "TODO.md",
  ];
  await Promise.all(required.map((path) => access(new URL(path, root))));

  const image = await stat(new URL("public/og.png", root));
  assert.ok(image.size > 100_000);

  const [component, gitignore, assetLedger] = await Promise.all([
    readFile(new URL("app/components/OfficeRun.tsx", root), "utf8"),
    readFile(new URL(".gitignore", root), "utf8"),
    readFile(new URL("ASSETS.md", root), "utf8"),
  ]);
  assert.match(component, /createPixelAvatar/);
  assert.doesNotMatch(component, /OPENAI_API_KEY|fetch\([^)]*avatar|\/api\/avatar/);
  assert.match(gitignore, /\.env\*/);
  assert.match(assetLedger, /Creative Commons Zero \(CC0/);
});
