import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = join(process.cwd(), "public/questions/zoom");
const items = [
  ["honeycomb", "https://commons.wikimedia.org/wiki/Special:Redirect/file/Close-up%20of%20the%20Beehive.jpg?width=1400"],
  ["corn", "https://commons.wikimedia.org/wiki/Special:Redirect/file/Corn%20close-up.jpg?width=1400"],
  ["umbrella", "https://commons.wikimedia.org/wiki/Special:Redirect/file/Umbrella%20Ribs%20(27627990304).jpg?width=1400"],
  ["credit-card-chip", "https://commons.wikimedia.org/wiki/Special:Redirect/file/Masteracard%20EMV%20Paypass%20NFC.jpg?width=1400"],
  ["lego-brick", "https://commons.wikimedia.org/wiki/Special:Redirect/file/Lego%20bricks.jpg?width=1400"],
  ["cactus", "https://commons.wikimedia.org/wiki/Special:Redirect/file/Close%20up%20of%20a%20cactus%20thorns.jpg?width=1400"],
  ["paintbrush", "https://commons.wikimedia.org/wiki/Special:Redirect/file/Brush%2C%20paint%20(AM%201967.93-1).jpg?width=1400"],
];

function cropZoom(src, dest) {
  const info = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", src], { encoding: "utf8" });
  const width = Number(info.match(/pixelWidth:\s+(\d+)/)?.[1] || 800);
  const height = Number(info.match(/pixelHeight:\s+(\d+)/)?.[1] || 800);
  const crop = Math.max(220, Math.floor(Math.min(width, height) * 0.34));
  execFileSync("sips", ["-c", String(crop), String(crop), src, "--out", dest], { stdio: "ignore" });
  execFileSync("sips", ["-Z", "900", dest, "--out", dest], { stdio: "ignore" });
}

mkdirSync(outDir, { recursive: true });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

for (const [slug, url] of items) {
  const answer = join(outDir, `${slug}-answer.jpg`);
  const zoom = join(outDir, `${slug}-zoom.jpg`);
  if (existsSync(answer) && existsSync(zoom)) {
    console.log(`skip ${slug}`);
    continue;
  }
  let response;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    response = await fetch(url, { headers: { "User-Agent": "GameStationAssetFetcher/1.0" }, redirect: "follow" });
    if (response.ok || response.status !== 429) break;
    await sleep(2500 + attempt * 2500);
  }
  if (!response.ok) throw new Error(`${slug}: ${response.status}`);
  writeFileSync(answer, Buffer.from(await response.arrayBuffer()));
  cropZoom(answer, zoom);
  console.log(`ok ${slug}`);
  await sleep(1800);
}
