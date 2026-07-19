/**
 * Intercept image requests on poe.ninja to discover CDN URL patterns
 * for base item types.
 *
 * Usage: npx playwright test --config=... or node script
 */
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const imageUrls = new Set();

  page.on("response", async (response) => {
    const url = response.url();
    const contentType = response.headers()["content-type"] || "";

    // Capture image requests from PoE CDN
    if (
      (contentType.startsWith("image/") || url.includes("poecdn.com") || url.includes("web.poecdn"))
    ) {
      imageUrls.add(url);
    }
  });

  // Go to poe.ninja economy page for Settlers league (current PoE standard)
  console.log("Opening poe.ninja...");
  await page.goto("https://poe.ninja/economy/settlers/unique-weapons", {
    waitUntil: "networkidle",
    timeout: 30000,
  });

  // Wait for item cards to load
  await page.waitForSelector(".item-card, .unique-item, [class*=item]", {
    timeout: 15000,
  }).catch(() => console.log("No item cards found, continuing..."));

  await page.waitForTimeout(3000);

  // Navigate to another page to get more variety
  await page.goto("https://poe.ninja/economy/settlers/unique-armours", {
    waitUntil: "networkidle",
    timeout: 15000,
  }).catch(() => {});

  await page.waitForTimeout(2000);

  console.log(`\nCaptured ${imageUrls.size} unique image URLs:`);
  const sorted = [...imageUrls].sort();
  for (const url of sorted.slice(0, 50)) {
    console.log(url);
  }

  // Also capture any network requests to API endpoints
  console.log("\n--- Additional: log API-like request URLs captured ---");

  await browser.close();
})();
