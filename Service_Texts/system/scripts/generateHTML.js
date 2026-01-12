const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/divine_liturgy.json');
const rawData = fs.readFileSync(dataPath, 'utf8');
const liturgyData = JSON.parse(rawData);

console.log(liturgyData.sections[0].title); // testează dacă merge
