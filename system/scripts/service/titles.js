// Extras din convert-service.js v1.3.2; comportament păstrat.
import { execFileSync } from "node:child_process";

function clean(value) {

  return value

    .replace(/\u00a0/g, " ")

    .replace(/\s+/g, " ")

    .trim();

}



// ============================================================

// VALIDARE TITLU DIRECTOR

// ============================================================



function safeTitle(value) {

  const title = clean(value)

    .replace(/[\\/:*?"<>|]/g, "-")

    .replace(/[. ]+$/g, "");



  if (

    !title ||

    title === "." ||

    title === ".." ||

    title.length > 180

  ) {

    throw new Error("Titlu de director invalid: " + value);

  }



  return title;

}



// ============================================================

// COMPARĂ TITLURILE EXTRASE

// ============================================================



function comparable(value) {

  return clean(value)

    .toLowerCase()

    .replace(/[.,;:!?]/g, "")

    .replace(/\s+/g, " ");

}



// ============================================================

// EXTRAGE TITLUL DIN VESP SAU ORTHROS

// ============================================================



function extractTitle(rtfPath, date) {

  /*

   * Citește RTF cu textutil, fără Word.

   *

   * Exemplu:

   *   Great Vespers of November 9

   *   Nektarios of Aegina and Pentapolis, the Wonderworker

   *

   * Sau:

   *   Orthros on Sunday, November 8, 2026; Tone 6

   *   The Synaxis of the Archangels Michael, Gabriel & Raphael

   */



  const content = execFileSync(

    "/usr/bin/textutil",

    ["-convert", "txt", "-stdout", rtfPath],

    {

      encoding: "utf8",

      maxBuffer: 20 * 1024 * 1024,

    }

  );



  const lines = content

    .split(/\r?\n/)

    .map(clean)

    .filter(Boolean)

    .slice(0, 80);






  // ============================================================

  // IDENTIFICĂ ANTETUL SERVICIULUI

  //

  // Acceptă atât date calendaristice obișnuite, cât și

  // sărbători cu date multiple sau mobile.

  //

  // Exemplu:

  // Great Vespers of February 27, July 18 & First Saturday

  // in November

  // ============================================================



  const headingRegex =

    /\b(?:Vespers\s+of|Orthros\s+on)\b/i;



  const index = lines.findIndex((line) =>

    headingRegex.test(line)

  );



  if (index < 0) {

    throw new Error(

      "Antetul VESP/ORTHROS nu a fost identificat."

    );

  }



  const heading = lines[index];

  const subtitle = lines[index + 1];



  if (!subtitle || subtitle.length > 180) {

    throw new Error(

      "Subtitlul sărbătorii nu a fost identificat sigur."

    );

  }



  // Pentru duminici adaugă Sunday Tone N.

  const sunday = /\bSunday\b/i.test(heading);

  const tone = heading.match(/\bTone\s+(\d+)\b/i);



  const prefix = sunday

    ? `Sunday${tone ? ` Tone ${tone[1]}` : ""}, `

    : "";



  return safeTitle(prefix + subtitle);

}




export { clean, safeTitle, comparable, extractTitle };
