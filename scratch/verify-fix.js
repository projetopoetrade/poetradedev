
// Mocking the logic from route.ts and poe-static-data.ts to verify normalization
function normalize(name) {
    return name.toLowerCase().replace(/['\s]/g, '');
}

const staticData = [
    { text: "Atziri's Promise", image: "/gen/image/atziri.png" },
    { text: "Screaming Essence of Greed", image: "/gen/image/essence.png" }
];

const staticImageMap = new Map();
for (const entry of staticData) {
    const nameLower = entry.text.toLowerCase().trim();
    staticImageMap.set(nameLower, entry.image);
    
    const nameNormalized = nameLower.replace(/['\s]/g, "");
    staticImageMap.set(nameNormalized, entry.image);
}

const testItems = [
    { name: "Atziris Promise", expected: "/gen/image/atziri.png" },
    { name: "Atziri's Promise", expected: "/gen/image/atziri.png" },
    { name: "screaming essence of greed", expected: "/gen/image/essence.png" },
    { name: "Screaming Essence of Greed", expected: "/gen/image/essence.png" }
];

console.log("Testing Normalization Matching:");
for (const item of testItems) {
    const nameLower = item.name.toLowerCase().trim();
    const nameNormalized = nameLower.replace(/['\s]/g, '');
    
    const found = staticImageMap.get(nameLower) || staticImageMap.get(nameNormalized);
    console.log(`Item: "${item.name}" -> Found: ${found} (Expected: ${item.expected})`);
    if (found !== item.expected) {
        console.error("FAILED MATCH!");
    }
}

console.log("\nTesting URL Construction:");
function constructUrl(icon) {
    if (icon) {
        if (icon.startsWith('http') || icon.startsWith('//')) {
            return icon;
        } else if (icon.startsWith('/')) {
            if (!icon.startsWith('/images/')) {
                return `https://web.poecdn.com${icon}`;
            }
            return icon;
        } else {
            return `https://web.poecdn.com/${icon}`;
        }
    }
    return icon;
}

const urls = [
    { input: "/gen/image/123.png", expected: "https://web.poecdn.com/gen/image/123.png" },
    { input: "gen/image/456.png", expected: "https://web.poecdn.com/gen/image/456.png" },
    { input: "https://poe.ninja/icon.png", expected: "https://poe.ninja/icon.png" },
    { input: "/images/products/local.png", expected: "/images/products/local.png" }
];

for (const u of urls) {
    const result = constructUrl(u.input);
    console.log(`Input: "${u.input}" -> Result: ${result}`);
    if (result !== u.expected) {
        console.error(`FAILED URL! Expected: ${u.expected}`);
    }
}
