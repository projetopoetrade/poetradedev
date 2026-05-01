
async function countItems() {
  try {
    const res = await fetch("https://www.pathofexile.com/api/trade/data/static", {
      headers: {
        "User-Agent": "PathOfTrade/1.0 (pathoftrade.net)"
      }
    });
    if (res.ok) {
      const data = await res.json();
      let count = 0;
      for (const group of data.result || []) {
        count += (group.entries || []).length;
      }
      console.log("Total items:", count);
    }
  } catch (err) {
    console.error(err);
  }
}
countItems();
