// Version: 1.0
// Updated: 2026-11-13
// CHANGELOG: test feastId fixed/range, invalid, nested Arabic paths and @@ aliases.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../scripts/titleLink-generator.js'), 'utf8');
const ctx = vm.createContext({ Logger: { log() {} } });
vm.runInContext(source, ctx);
function check(p, id, feast) {
  const actual = ctx.extractFeastFromPath(p);
  assert.equal(actual.feastId, id, p);
  if (feast !== undefined) assert.equal(actual.feast, feast, p);
}
check('Byzantine Music / EnglishByzantineMusic / Menaion / 02 October / 11-17 Sunday of the Holy Fathers', '10-11-17', 'Sunday of the Holy Fathers');
check('MyPrivateEnglishMusic / Menaion / 11 July / 13-19 Sunday of the Holy Fathers', '07-13-19');
check('Byzantine Music / ArabicByzantineMusic / Menaion / 01 September / 14 Exaltation of the Holy Cross / Vespers', '14-09');
check('Byzantine Music / EnglishByzantineMusic / Menaion / 06 February / 02 Presentation of our Lord', '02-02');
check('Menaion / 02 October / 17-11 Invalid', '');
check('Menaion / 02 October / 32 Invalid', '');
check('Menaion / 02 October / 11-32 Invalid', '');
assert.equal(ctx.detectPeriodFromPath('Byzantine Music / EnglishByzantineMusic / Penticostarion / 12 Sunday of Pentecost'), 'penticostarion');
// @@: doua titluri pentru acelasi PDF, fara a dubla PDF-ul in Drive.
const pdf = {
 getDescription: () => '[O] TITLE A @@ TITLE B | Brief',
 getUrl: () => 'https://example.test/file.pdf',
 getName: () => 'example.pdf'
};
const empty = { hasNext: () => false };
let seen = false;
const folder = {
 getId: () => 'test-id', getName: () => '11-17 Sunday of the Holy Fathers',
 getFiles: () => ({ hasNext: () => !seen, next: () => { seen = true; return pdf; } }),
 getFolders: () => empty
};
const result = {}, entries = [];
ctx.scanFolder(folder, result, entries, 'Byzantine Music / EnglishByzantineMusic / Menaion / 02 October');
assert.equal(entries.length, 2);
assert.equal(result['[O] TITLE A'].versions[0].feastId, '10-11-17');
assert.equal(result['[O] TITLE B'].versions[0].feastId, '10-11-17');
assert.equal(result['[O] TITLE A'].versions[0].url, result['[O] TITLE B'].versions[0].url);
console.log('PASS: 10 verificari Menaion / Penticostarion / @@');
