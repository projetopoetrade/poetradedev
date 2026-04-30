const fs = require('fs');
const data = JSON.parse(fs.readFileSync('ninja.json', 'utf8'));

const testNames = ["Mavens Orb", "Maven's Orb", "Foulborn Exalted Orb", "Tainted Divine Orb"];

const lines = data.lines?.filter(i => testNames.includes(i.currencyTypeName) || testNames.includes(i.name));
const details = data.currencyDetails?.filter(i => testNames.includes(i.name) || testNames.includes(i.id));

console.log('LINES:', JSON.stringify(lines, null, 2));
console.log('DETAILS:', JSON.stringify(details, null, 2));
