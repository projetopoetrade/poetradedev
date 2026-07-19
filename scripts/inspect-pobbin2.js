const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const allUrls = [];

  page.on("response", async (resp) => {
    const url = resp.url();
    if (url.includes("poecdn") || url.includes("2DItems") || url.includes("pobb.in")) {
      allUrls.push(url);
    }
  });

  await page.goto("https://pobb.in/mt8Dgu1nxC2G", { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(5000);

  console.log("All captured URLs:");
  for (const url of allUrls) {
    console.log("  " + url);
  }
  
  // Also check img elements
  const imgs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("img")).map(i => i.src);
  });
  console.log("\nIMG elements:");
  for (const src of imgs) {
    console.log("  " + src);
  }

  await browser.close();
})();
