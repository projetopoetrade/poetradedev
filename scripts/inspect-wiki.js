const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const imageUrls = new Set();

  page.on("response", async (resp) => {
    const url = resp.url();
    const ct = resp.headers()["content-type"] || "";
    if (ct.startsWith("image/") || url.includes("poecdn") || url.includes("2DItems")) {
      const size = (await resp.body()).length;
      imageUrls.add(url + " [" + size + "b]");
    }
  });

  await page.goto("https://www.poewiki.net/wiki/Warlock_Gloves", {
    waitUntil: "networkidle",
    timeout: 30000,
  });

  await page.waitForTimeout(3000);

  console.log("\nImages on Warlock Gloves page:");
  for (const url of [...imageUrls].sort()) {
    console.log("  " + url);
  }

  await browser.close();
})();
