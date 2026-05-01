const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const CDN_BASE = "https://web.poecdn.com";
const STATIC_DATA_URL = "https://www.pathofexile.com/api/trade/data/static";
const OUTPUT_DIR = path.join(__dirname, '../public/images/items');

function slugify(text) {
  return text.toLowerCase()
    .replace(/[']/g, '') // Remove apostrophes (standard for PoE)
    .replace(/[^a-z0-9]+/g, '-') // Replace other non-alphanumeric with hyphens
    .replace(/(^-|-$)/g, ''); // Trim hyphens
}

async function downloadAndConvert(url, destBase) {
  const destWebp = destBase.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  
  if (fs.existsSync(destWebp)) return true; // Skip if already exists
  
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      // Convert to WebP using sharp
      await sharp(Buffer.from(buffer))
        .webp({ quality: 85, effort: 6 })
        .toFile(destWebp);
      return true;
    }
    console.error(`Failed to download ${url}: ${res.status}`);
    return false;
  } catch (err) {
    console.error(`Error downloading/converting ${url}:`, err);
    return false;
  }
}

async function run() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log("Fetching static data...");
  const res = await fetch(STATIC_DATA_URL, {
    headers: { "User-Agent": "PathOfTrade/1.0 (pathoftrade.net)" }
  });
  if (!res.ok) {
    console.error("Failed to fetch static data");
    return;
  }

  const data = await res.json();
  const mapping = {};

  let count = 0;
  for (const group of data.result || []) {
    const groupLabel = group.label || group.id || "misc";
    const groupSlug = slugify(groupLabel);
    const groupDir = path.join(OUTPUT_DIR, groupSlug);
    
    if (!fs.existsSync(groupDir)) {
      fs.mkdirSync(groupDir, { recursive: true });
    }

    console.log(`Processing group: ${groupLabel}...`);
    for (const entry of group.entries || []) {
      if (entry.text && entry.image) {
        const itemSlug = slugify(entry.text);
        const webpFileName = `${itemSlug}.webp`;
        // File path relative to public/images/items/
        const relativeFilePath = `${groupSlug}/${webpFileName}`;
        const destWebp = path.join(groupDir, webpFileName);
        
        const url = entry.image.startsWith('http') ? entry.image : `${CDN_BASE}${entry.image.startsWith('/') ? '' : '/'}${entry.image}`;
        
        const success = await downloadAndConvert(url, destWebp);
        if (success) {
          mapping[entry.text.toLowerCase().trim()] = relativeFilePath;
          // Also map by ID if available
          if (entry.id) {
            mapping[entry.id.toLowerCase().trim()] = relativeFilePath;
          }
          count++;
        }
        
        // Small delay to be nice to CDN
        if (count % 20 === 0) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    }
  }

  fs.writeFileSync(path.join(OUTPUT_DIR, 'mapping.json'), JSON.stringify(mapping, null, 2));
  console.log(`Finished! Downloaded and converted ${count} images to WebP into categorized subdirectories.`);
}

run();
