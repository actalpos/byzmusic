import { test, assertEqual, summary } from "./runner.js";

/**
 * simulate SERVICE_ORDER logic
 */
const SERVICE_ORDER = {
  V: { LIHC: 1, AP: 2 }
};

function sortVersions(list) {
  return [...list].sort((a, b) => {
    const pa = SERVICE_ORDER[a.service]?.[a.moment] ?? 999;
    const pb = SERVICE_ORDER[b.service]?.[b.moment] ?? 999;
    return pa - pb;
  });
}

test("LIHC comes before AP", () => {
  const input = [
    { service: "V", moment: "AP" },
    { service: "V", moment: "LIHC" }
  ];

  const result = sortVersions(input);

  assertEqual(result[0].moment, "LIHC");
});

test("unknown moment goes last", () => {
  const input = [
    { service: "V", moment: "ZZZ" },
    { service: "V", moment: "AP" }
  ];

  const result = sortVersions(input);

  assertEqual(result[1].moment, "ZZZ");
});

summary();