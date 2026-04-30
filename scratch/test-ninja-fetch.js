
async function test() {
  try {
    const url = "https://poe.ninja/api/data/itemoverview?league=Standard&type=UniqueWeapon";
    // Let's also try poe2
    const url2 = "https://poe.ninja/api/data/itemoverview?league=Standard&type=UniqueWeapon";
    
    const res = await fetch("https://poe.ninja/api/data/itemoverview?league=Standard&type=UniqueWeapon", {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
    });
    console.log("Status:", res.status);
    if (res.ok) {
        const data = await res.json();
        console.log("Icon:", data.lines?.[0]?.icon);
    }
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

test();
