import fs from "fs";

let passed = 0;
let failed = 0;

export function test(name, fn) {
  try {
    fn();
    console.log("✅", name);
    passed++;
  } catch (e) {
    console.log("❌", name);
    console.error("   ", e.message);
    failed++;
  }
}

export function assertEqual(a, b) {
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    throw new Error(`Expected ${b} but got ${a}`);
  }
}

export function summary() {
  console.log("\n--- TEST SUMMARY ---");
  console.log("Passed:", passed);
  console.log("Failed:", failed);

  if (failed > 0) process.exit(1);
}