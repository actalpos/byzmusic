import { test, assertEqual, summary } from "./runner.js";

// copy function (important: same as production)
function normalizeTitle(str) {
  return str
    .replace(/[\n\r\t]+/g, " ")
    .replace(/\(\s*\*\*.*?\*\*\s*\)/g, "")
    .replace(/\*\*/g, "")
    .replace(/[*]/g, "")
    .replace(/["“”]/g, "")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/^(the|a|an)\s+/i, "");
}

test("removes THE", () => {
  assertEqual(
    normalizeTitle("THE FOURTH EOTHINON"),
    "fourth eothinon"
  );
});

test("removes (** comment **)", () => {
  assertEqual(
    normalizeTitle("TITLE (**note here**)"),
    "title"
  );
});

test("handles newline split titles", () => {
  assertEqual(
    normalizeTitle("FOURTH\nEOTHINON"),
    "fourth eothinon"
  );
});

summary();