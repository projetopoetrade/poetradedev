const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const imageUrls = new Set();

  page.on("response", async (resp) => {
    const url = resp.url();
    const ct = resp.headers()["content-type"] || "";
    if ((ct.startsWith("image/") || url.includes("poecdn")) && url.includes("2DItems")) {
      imageUrls.add(url);
    }
  });

  await page.goto("https://pobb.in/mt8Dgu1nxC2G", { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(5000);

  console.log("Item art images:");
  for (const url of [...imageUrls].sort()) {
    console.log("  " + url);
  }

  await browser.close();
})();
