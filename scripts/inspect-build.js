const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const imageUrls = new Set();

  page.on("response", async (response) => {
    const url = response.url();
    const ct = response.headers()["content-type"] || "";
    if (ct.startsWith("image/") || url.includes("web.poecdn.com")) {
      imageUrls.add(url);
    }
  });

  const target = "https://poe.ninja/poe1/builds/mirage/character/heygyus-0416/ResurrectSanest?i=1";
  console.log("Loading", target);
  await page.goto(target, { waitUntil: "networkidle", timeout: 30000 });

  await page.waitForTimeout(5000);

  console.log(`\nCaptured ${imageUrls.size} unique image URLs:\n`);
  const sorted = [...imageUrls].sort();
  for (const url of sorted) {
    console.log(url);
  }

  await browser.close();
})();
