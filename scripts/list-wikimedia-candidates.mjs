const api = "https://commons.wikimedia.org/w/api.php";
const queries = process.argv.slice(2);

for (const query of queries) {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `file:${query}`,
    gsrnamespace: "6",
    gsrlimit: "5",
    prop: "imageinfo",
    iiprop: "url|mime|size",
    iiurlwidth: "1200",
    format: "json",
    origin: "*",
  });
  const response = await fetch(`${api}?${params}`, { headers: { "User-Agent": "GameStationAssetFetcher/1.0" } });
  const data = await response.json();
  console.log(`\n## ${query}`);
  for (const page of Object.values(data.query?.pages || {})) {
    const info = page.imageinfo?.[0];
    if (!info?.mime?.startsWith("image/")) continue;
    console.log(`${page.title.replace(/^File:/, "")} | ${info.width}x${info.height}`);
    console.log(info.thumburl || info.url);
  }
}
