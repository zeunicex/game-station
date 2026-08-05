import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = join(process.cwd(), "public/questions/zoom");
const only = new Set(process.argv.slice(2));

const items = [
  ["zipper", "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Plastic_watertight_drysuit_zipper_tooth_and_seal_edge_detail_P8110020.jpg/1280px-Plastic_watertight_drysuit_zipper_tooth_and_seal_edge_detail_P8110020.jpg", 0.24],
  ["airpods-case", "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Here_One_earbuds_in_white_charging_case.jpg/1280px-Here_One_earbuds_in_white_charging_case.jpg", 0.26],
  ["rubiks-cube", "https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Rubiks_Cube_%2811913429076%29.jpg/1280px-Rubiks_Cube_%2811913429076%29.jpg", 0.24],
  ["honeycomb", "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Honey_comb_with_capped_honey.jpg/1280px-Honey_comb_with_capped_honey.jpg", 0.24],
  ["toothpaste", "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Close-up_of_a_toothbrush_with_toothpaste_%2849842101773%29.jpg/1280px-Close-up_of_a_toothbrush_with_toothpaste_%2849842101773%29.jpg", 0.24],
  ["remote-control", "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Hidden_Dusts_in_TV_Remotes_02.jpg/1280px-Hidden_Dusts_in_TV_Remotes_02.jpg", 0.22],
  ["paintbrush", "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Brush_Bristles.jpg/1280px-Brush_Bristles.jpg", 0.22],
  ["pencil-tip", "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Pencil_Tip_Macro.jpg/1280px-Pencil_Tip_Macro.jpg", 0.22],
  ["stapler", "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/AGR-10_stapler.jpg/1280px-AGR-10_stapler.jpg", 0.2],
  ["sewing-needle", "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Sewing_needle_eye_with_thread.jpg/1280px-Sewing_needle_eye_with_thread.jpg", 0.24],
  ["bottle-cap", "https://upload.wikimedia.org/wikipedia/commons/1/14/BottleCapSmile.jpg", 0.24],
  ["tea-bag", "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Tisane_tea_bag_steeping_close-up.jpg/1280px-Tisane_tea_bag_steeping_close-up.jpg", 0.24],
];

function cropZoom(src, dest, factor) {
  const info = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", src], { encoding: "utf8" });
  const width = Number(info.match(/pixelWidth:\s+(\d+)/)?.[1] || 800);
  const height = Number(info.match(/pixelHeight:\s+(\d+)/)?.[1] || 800);
  const crop = Math.max(160, Math.floor(Math.min(width, height) * factor));
  execFileSync("sips", ["-c", String(crop), String(crop), src, "--out", dest], { stdio: "ignore" });
  execFileSync("sips", ["-Z", "900", dest, "--out", dest], { stdio: "ignore" });
}

mkdirSync(outDir, { recursive: true });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

for (const [slug, url, factor] of items) {
  if (only.size && !only.has(slug)) continue;
  const answer = join(outDir, `${slug}-answer.jpg`);
  const zoom = join(outDir, `${slug}-zoom.jpg`);
  let response;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    response = await fetch(url, { headers: { "User-Agent": "GameStationAssetFetcher/1.0" } });
    if (response.ok || response.status !== 429) break;
    await sleep(6000 + attempt * 4000);
  }
  if (!response.ok) throw new Error(`${slug}: ${response.status}`);
  writeFileSync(answer, Buffer.from(await response.arrayBuffer()));
  cropZoom(answer, zoom, factor);
  console.log(`updated ${slug}`);
  await sleep(1800);
}
