
async function test() {
  try {
    const res = await fetch("https://www.pathofexile.com/api/trade/data/static", {
      headers: {
        "User-Agent": "PathOfTrade/1.0 (pathoftrade.net)",
      },
    });
    if (res.ok) {
      const data = await res.json();
      const firstGroup = data.result?.[0];
      const firstEntry = firstGroup?.entries?.[0];
      console.log("First Entry:", firstEntry);
    } else {
      console.log("Error status:", res.status);
    }
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

test();
