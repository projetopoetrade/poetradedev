
const fs = require('fs');
const path = require('path');

async function testDownload() {
  const imageUrl = "https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvQ3VycmVuY3kvQ3VycmVuY3lSZXJvbGxNYWdpYyIsInNjYWxlIjoxfV0/6308fc8ca2/CurrencyRerollMagic.png";
  const dest = path.join(__dirname, 'test-image.png');
  
  try {
    const res = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      fs.writeFileSync(dest, Buffer.from(buffer));
      console.log("Download successful:", dest);
    } else {
      console.log("Download failed:", res.status);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

testDownload();
