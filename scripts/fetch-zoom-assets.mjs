import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const outDir = join(process.cwd(), "public/questions/zoom");

const items = [
  ["velcro", ["velcro macro hook and loop fastener", "hook and loop fastener macro"]],
  ["zipper", ["zipper teeth macro close up", "zipper macro", "zip fastener teeth"]],
  ["pencil-tip", ["pencil tip macro graphite wood", "pencil point macro"]],
  ["stapler", ["stapler close up metal", "stapler macro", "staples close up"]],
  ["airpods-case", ["wireless earbuds case close up", "earbuds case", "charging case earbuds"]],
  ["rubiks-cube", ["Rubik's cube close up", "Rubiks cube close up"]],
  ["keyboard-switch", ["mechanical keyboard switch close up", "keyboard switch close up", "key switch keyboard"]],
  ["basketball", ["basketball close up texture", "basketball texture", "basketball macro"]],
  ["pinecone", ["pine cone macro close up", "pinecone close up"]],
  ["honeycomb", ["honeycomb close up", "honeycomb macro"]],
  ["toothpaste", ["toothpaste close up", "toothpaste macro", "toothpaste on toothbrush"]],
  ["corn", ["corn kernels close up", "maize kernels close up", "corn cob close up"]],
  ["sushi-roll", ["sushi roll close up", "maki sushi close up"]],
  ["book-pages", ["book pages close up edge", "book pages close up", "pages of book macro"]],
  ["umbrella", ["umbrella close-up", "umbrella canopy ribs", "umbrella mechanism"]],
  ["credit-card-chip", ["EMV chip", "smart card chip", "credit card microchip"]],
  ["remote-control", ["remote control close-up", "TV remote control buttons", "infrared remote control"]],
  ["lego-brick", ["Lego brick", "LEGO brick macro", "toy construction brick"]],
  ["cactus", ["cactus spines close-up", "cactus needles macro", "Opuntia spines"]],
  ["paintbrush", ["paintbrush bristles close-up", "paint brush bristles", "artist brush close-up"]],
];

const api = "https://commons.wikimedia.org/w/api.php";

function cropZoom(src, dest) {
  const info = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", src], { encoding: "utf8" });
  const width = Number(info.match(/pixelWidth:\s+(\d+)/)?.[1] || 800);
  const height = Number(info.match(/pixelHeight:\s+(\d+)/)?.[1] || 800);
  const crop = Math.max(220, Math.floor(Math.min(width, height) * 0.34));
  execFileSync("sips", ["-c", String(crop), String(crop), src, "--out", dest], { stdio: "ignore" });
  execFileSync("sips", ["-Z", "900", dest, "--out", dest], { stdio: "ignore" });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function searchImage(term) {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `file:${term}`,
    gsrnamespace: "6",
    gsrlimit: "12",
    prop: "imageinfo",
    iiprop: "url|mime|size",
    iiurlwidth: "1400",
    format: "json",
    origin: "*",
  });
  const response = await fetch(`${api}?${params}`, { headers: { "User-Agent": "GameStationAssetFetcher/1.0" } });
  if (!response.ok) throw new Error(`Search failed for ${term}`);
  const data = await response.json();
  const pages = Object.values(data.query?.pages || {});
  const image = pages
    .map((page) => page.imageinfo?.[0])
    .find((info) => info?.mime?.startsWith("image/") && info.width >= 500 && info.height >= 500);
  if (!image) throw new Error(`No image found for ${term}`);
  return { original: image.url, thumb: image.thumburl };
}

async function download(url, file) {
  const response = await fetch(url, { headers: { "User-Agent": "GameStationAssetFetcher/1.0" } });
  if (!response.ok) throw new Error(`Download failed ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  writeFileSync(file, bytes);
}

mkdirSync(outDir, { recursive: true });

const sources = [];
for (const [slug, terms] of items) {
  try {
    if (sources.some((item) => item.slug === slug)) continue;
    let urls;
    let usedTerm;
    for (const term of terms) {
      try {
        urls = await searchImage(term);
        usedTerm = term;
        break;
      } catch {
        await sleep(350);
      }
    }
    if (!urls) throw new Error(`No image found for ${terms.join(" / ")}`);
    const answer = join(outDir, `${slug}-answer.jpg`);
    const zoom = join(outDir, `${slug}-zoom.jpg`);
    try {
      await download(urls.original, answer);
    } catch {
      await download(urls.thumb, answer);
    }
    cropZoom(answer, zoom);
    sources.push({ slug, term: usedTerm, source: urls.original, answer: basename(answer), zoom: basename(zoom) });
    console.log(`ok ${slug}`);
  } catch (error) {
    console.error(`fail ${slug}: ${error.message}`);
  }
  await sleep(700);
}

writeFileSync(join(outDir, "new-asset-sources.json"), JSON.stringify(sources, null, 2));
