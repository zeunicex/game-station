import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renders the Game Station home screen", async () => {
  const response = await render();
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.match(html, /<title>Game Station \| Team Play<\/title>/i);
  assert.match(html, /Welcome/);
  assert.match(html, /Enter team name/);
  assert.match(html, /View scoreboard/);
});

test("has exactly 65 unique, fully configured Zoom questions", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const zoomBlock = page.slice(page.indexOf("  zoom: ["), page.indexOf("  bible: ["));
  const ids = [...zoomBlock.matchAll(/id: "(z\d+)"/g)].map((match) => match[1]);
  const answers = [...zoomBlock.matchAll(/answer: "([^"]+)"/g)].map((match) => match[1]);

  assert.equal(ids.length, 65);
  assert.equal(new Set(ids).size, 65);
  assert.equal(answers.length, 65);
  assert.deepEqual(ids, Array.from({ length: 65 }, (_, index) => `z${index + 1}`));

  for (const required of [
    "Tennis ball", "Keyboard", "Padlock", "Recovery Version Bible",
    "Guitar strings", "Earbuds case", "Honeycomb", "Matcha", "Can opener",
    "Shower head", "Garlic press", "Binder clip", "Adjustable wrench",
    "Door hinge", "Potato masher", "Safety pin", "Clothespin",
    "Screw threads", "Comb teeth", "Grater", "Thimble", "Cork coaster",
    "Matchstick", "Rope", "Walnut shell", "Puzzle piece", "Measuring spoon",
    "Makeup brush", "Light bulb filament", "Seashell", "Staple remover",
    "Woven basket",
  ]) assert.ok(answers.includes(required), `Missing required question: ${required}`);

  for (const removed of [
    "Ring", "Rubik's Cube", "Keyboard switch", "Paintbrush",
    "Basketball", "Credit card chip", "Remote control", "Bottle cap", "Burr seed pod",
    "Tea bag", "Whisk", "Scissors", "Measuring tape", "Wristwatch",
    "Egg carton", "Kitchen tongs", "Push pin",
  ]) assert.ok(!answers.includes(removed), `Removed question still present: ${removed}`);
});

test("all local question images referenced by the app exist", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const paths = [...new Set(
    [...page.matchAll(/(?:src|image|answerImage): "(\/questions\/[^"]+)"/g)]
      .map((match) => match[1]),
  )];

  assert.ok(paths.length > 100);
  await Promise.all(paths.map((path) => access(new URL(`../public${path}`, import.meta.url))));
});

test("keeps skip rotation, answer locking, and final-question guards", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /const nextQueue = \[\.\.\.queue\.slice\(1\), queue\[0\]\]/);
  assert.match(page, /if \(queue\.length <= 1\) return/);
  assert.match(page, /if \(locked \|\| scoringLockRef\.current\) return/);
  assert.match(page, /disabled=\{queue\.length <= 1\}/);
  assert.match(page, /const nextQueue = queue\.slice\(1\)/);
  assert.match(page, /setGame\(otherGame\)/);
});

test("applies the requested extra zoom and edited deer answer", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  for (const answer of ["Palm tree", "Matcha", "Watermelon", "Fireworks", "Shoe sole", "Microphone", "Pencil tip", "Corn"]) {
    const line = page.split("\n").find((candidate) => candidate.includes(`answer: "${answer}"`));
    assert.match(line ?? "", /clueScale: [1-9]/, `${answer} needs extra zoom`);
  }

  assert.match(page, /answerImage: "\/questions\/zoom\/deer-answer\.png"/);
  await access(new URL("../public/questions/zoom/deer-answer.png", import.meta.url));
});

test("keeps the latest close-up clues boldly cropped", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  for (const answer of [
    "Camera lens", "Can opener", "USB flash drive", "Chess knight",
    "Corkscrew", "Key", "Salt shaker", "Spiral notebook", "Colander", "Pepper grinder",
  ]) {
    const line = page.split("\n").find((candidate) => candidate.includes(`answer: "${answer}"`));
    const scale = Number(line?.match(/clueScale: ([\d.]+)/)?.[1] ?? 0);
    assert.ok(scale >= 2.8, `${answer} needs a stronger close-up crop`);
  }

  assert.match(page, /image: "\/questions\/zoom\/bird-zoom\.jpg"[^\n]+answer: "Bird"/);
});
