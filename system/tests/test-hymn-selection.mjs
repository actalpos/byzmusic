/**
 * BYZMUSIC — test-hymn-selection.mjs
 * Version: 1.1.1
 * Updated: 2026-11-13
 * CHANGELOG:
 * 2026-11-13 | v1.1.1
 * - Moved test to system/test/ and updated relative import.
 * - Added descriptive output for each assertion.
 * - Corrected reported assertion count from 7 to 9.
 */
import assert from 'node:assert/strict';
import {
  contextFromPath,
  selectHymnVersions,
  isEligibleSingle,
  fitPdfWidth,
} from '../scripts/hymn-selection.js';

let passed = 0;
function test(description, assertion) {
  try {
    assertion();
    passed++;
    console.log(`PASS ${passed}: ${description}`);
  } catch (error) {
    console.error(`FAIL: ${description}`);
    throw error;
  }
}

const versions = [
  { periodId: 'menaion', feastId: '15-11', url: 'menaion' },
  { periodId: 'octoechos', feastId: 'Sunday', url: 'sunday' },
  { periodId: 'octoechos', feastId: 'Friday', url: 'friday' },
  { url: 'generic' },
];

const sunday = contextFromPath('/byzmusic/Service_Texts/2026/11%20November/15%20Feast/Nov%2015%20ORTHROS.html');
test('2026-11-15 is identified as Sunday', () => {
  assert.equal(sunday.weekday, 'Sunday');
});
test('Sunday selects the matching Sunday Octoechos version', () => {
  assert.deepEqual(selectHymnVersions(versions, sunday).map(x => x.url), ['sunday']);
});

const friday = contextFromPath('/byzmusic/Service_Texts/2026/11%20November/13%20Feast/Nov%2013%20ORTHROS.html');
test('2026-11-13 is identified as Friday', () => {
  assert.equal(friday.weekday, 'Friday');
});
test('Friday selects the matching Friday Octoechos version when no matching Menaion exists', () => {
  assert.deepEqual(selectHymnVersions(versions, friday).map(x => x.url), ['friday']);
});
test('Friday prefers the matching Menaion version over Octoechos', () => {
  assert.deepEqual(
    selectHymnVersions([{ periodId: 'menaion', feastId: '13-11', url: 'minei' }, ...versions], friday).map(x => x.url),
    ['minei']
  );
});
test('Saturday without a matching Menaion or Octoechos version selects nothing', () => {
  assert.deepEqual(selectHymnVersions(versions, contextFromPath('/Service_Texts/2026/11 November/14 Feast/x.html')), []);
});
test('A Menaion version for November 15 is not eligible for November 13', () => {
  assert.equal(isEligibleSingle({ periodId: 'menaion', feastId: '15-11', url: 'x' }, friday), false);
});
test('Invalid date February 30 is rejected', () => {
  assert.equal(contextFromPath('/Service_Texts/2026/02 February/30 Feast/x.html'), null);
});
test('PDF URL fragment #page=2 is replaced with #view=FitH', () => {
  assert.equal(fitPdfWidth('https://example.org/x.pdf#page=2'), 'https://example.org/x.pdf#view=FitH');
});

console.log(`\n${passed} assertions passed`);
