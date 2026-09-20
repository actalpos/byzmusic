/**
 * title-links.js
 *
 * Adaugă linkurile din titleLink.json în titlurile imnurilor.
 * Nu modifică layout-ul documentului.
 */

/*
 * AFTER-FEAST FILTER
 *
 * The same generic hymn title may exist for multiple feasts.
 * Use feastId (DD-MM), not the feast name, to select the
 * correct PDF version.
 *
 * Example:
 *
 *   Service Text 17-09 -> AFTER_FEAST_ID = "14-09"
 *   Holy Cross PDF     -> feastId = "14-09"
 *
 * Only versions with the matching feastId are kept.
 */
/*
 * ============================================================
 * UPDATE: 2026-09-18
 * ============================================================
 *
 * - feast-calendar.js este acum calendarul comun pentru
 *   title-links.js și layout-fixes-and-links.js.
 *
 * - title-links.js încarcă automat feast-calendar.js dacă
 *   pagina HTML nu îl încarcă deja.
 *
 * - SERVICE_DATE suportă foldere descriptive precum:
 *
 *     15 Dormition of the Theotokos
 *     29 Beheading of St John the Baptist
 *
 * - Versiunile Menaion din titleLink.json pot fi selectate
 *   automat când feastId corespunde cu SERVICE_DATE.
 *
 * - AFTER-FEAST rămâne o regulă separată și folosește
 *   AFTER_FEAST_ID.
 *
 * - Triodion/Pentecostarion nu sunt tratate încă de această
 *   logică.
 * ============================================================
 */
(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  ready(async () => {

    console.log("title-links.js loaded");

    /**********************
     * SERVICE TYPE
     **********************/
    function detectServiceType() {
      const path = window.location.pathname.toLowerCase();

      if (path.includes("vesp")) return "V";
      if (path.includes("orthros")) return "O";
      if (path.includes("litart")) return "LT";

      /*
      if (
        (path.includes("liturgy") || path.includes("divine")) &&
        !path.includes("variables")
      ) {
        return "L";
      }
      */

      if (
        (path.includes("liturgy") || path.includes("divine")) &&
        path.includes("variables")
      ) {
        return "LV";
      }

      return null;
    }

    const SERVICE = detectServiceType();

    /*
     * Definește ordinea aparițiilor când același titlu
     * există în mai multe momente ale aceluiași serviciu.
     */
    const SERVICE_ORDER = {
      V: {
        LIHC: 1,
        LT: 2,
        AP: 3
      }
    };

    /**********************
     * UTILS
     **********************/
    function normalizeTitle(str) {
      str = String(str || "")
        .replace(/[\n\r\t]+/g, " ")
        .replace(/\(\s*\*\*.*?\*\*\s*\)/g, "")
        .replace(/\*\*.*?\*\*/g, "")
        .replace(/[*]/g, "")
        .replace(/["“”]/g, "")
        .replace(/[,:;]+/g, "")
        .replace(/[–—]/g, "-")
        .replace(/\(\s*/g, "( ")
        .replace(/\s*\)/g, " )")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase()
        .replace(/^(the|a|an|sticheras|o)\s+/i, "")
        .replace(/\bin\s+tone\b/gi, "tone")
        .replace(/\bcanons\b/gi, "canon");


      const prefixMatch =
        str.match(/^((\[[a-z]+\]\s*)+)(.*)$/i);

      if (prefixMatch) {
        const prefixes = prefixMatch[1];
        let title = prefixMatch[3];

        title = title.replace(
          /^(the|a|an|festal|sticheras|verses)\s+/,
          ""
        );

        return `${prefixes} ${title}`.trim();
      }

      return str.replace(
        /^(the|a|an|festal)\s+/,
        ""
      );
    }

    function extractAutomelonFromText(text) {
      if (!text) {
        return "";
      }

      const match =
        text.match(/\(\s*\*\*(.*?)\*\*\s*\)/s);

      if (!match) {
        return "";
      }

      return normalizeTitle(match[1]);
    }

    function splitAutomelonKey(key) {
      const separator = "||";
      const index = key.lastIndexOf(separator);

      if (index === -1) {
        return {
          title: key.trim(),
          automelon: ""
        };
      }

      return {
        title: key.substring(0, index).trim(),
        automelon: key
          .substring(index + separator.length)
          .trim()
      };
    }

    /***************************************************************
    * SHARED FEAST CALENDAR
    * =============================================================
    *
    * Calendarul comun este:
    *
    *   /byzmusic/system/scripts/feast-calendar.js
    *
    * title-links.js este folosit în special de Service Texts
    * monolinguale.
    *
    * Unele pagini HTML noi pot încărca feast-calendar.js direct,
    * dar paginile vechi nu îl conțin întotdeauna.
    *
    * Pentru compatibilitate:
    *
    *   1. Dacă window.FeastCalendar există deja, îl folosim.
    *   2. Dacă nu există, îl încărcăm automat.
    *   3. Dacă încărcarea eșuează, title-links.js continuă să
    *      funcționeze fără filtrarea calendaristică.
    *
    * Astfel calendarul nu mai este duplicat în title-links.js și
    * layout-fixes-and-links.js.
    ***************************************************************/

    async function loadFeastCalendar() {

      if (window.FeastCalendar) {
        return window.FeastCalendar;
      }

      const base =
        window.location.pathname.includes("/byzmusic/")
          ? "/byzmusic"
          : "";

      return new Promise((resolve) => {

        const script =
          document.createElement("script");

        script.src =
          `${base}/system/scripts/feast-calendar.js`;

        script.onload = () => {

          console.log(
            "feast-calendar.js loaded automatically"
          );

          resolve(
            window.FeastCalendar || null
          );
        };

        script.onerror = () => {

          console.warn(
            "feast-calendar.js could not be loaded"
          );

          resolve(null);
        };

        document.head.appendChild(script);
      });
    }


    const FEAST_CALENDAR =
      await loadFeastCalendar();


    /***************************************************************
     * SERVICE DATE / FEAST CONTEXT
     * =============================================================
     *
     * SERVICE_DATE este dedus din URL-ul Service Text.
     *
     * Exemple:
     *
     *   /variableDate/2026/08/15/
     *
     *   /variableDate/2026/08/15 Dormition of the Theotokos/
     *
     * ambele produc:
     *
     *   SERVICE_DATE = "15-08"
     *
     * Descrierea de după zi poate rămâne în numele folderului.
     *
     * AFTER_FEAST_ID este separat de SERVICE_DATE.
     *
     * Exemplu:
     *
     *   SERVICE_DATE   = "17-09"
     *   AFTER_FEAST_ID = "14-09"
     *
     * deoarece 17 septembrie se află în perioada after-feast
     * a Elevation of the Holy Cross.
     ***************************************************************/

    const SERVICE_DATE =
      FEAST_CALENDAR
        ? FEAST_CALENDAR.detectServiceDate()
        : null;

    const AFTER_FEAST_ID =
      FEAST_CALENDAR
        ? FEAST_CALENDAR.detectAfterFeastId(SERVICE_DATE)
        : null;


    console.log(
      "Detected SERVICE_DATE:",
      SERVICE_DATE || "none"
    );

    console.log(
      "Detected AFTER_FEAST_ID:",
      AFTER_FEAST_ID || "none"
    );

    /**********************
     * LOAD TITLE LINKS
     **********************/
    const serviceIndex = {};
    const globalIndex = {};

    const serviceAutomelonIndex = {};
    const globalAutomelonIndex = {};

    const globalCount = {};
    const titleUsage = {};

    try {
      const base =
        window.location.pathname.includes("/byzmusic/")
          ? "/byzmusic"
          : "";

      const response = await fetch(
        `${base}/system/data/titleLink.json`
      );

      if (!response.ok) {
        throw new Error(
          `titleLink.json missing: HTTP ${response.status}`
        );
      }

      const raw = await response.json();

      for (const key in raw) {
        if (!Object.prototype.hasOwnProperty.call(raw, key)) {
          continue;
        }

        const item =
          typeof raw[key] === "string"
            ? {
              url: raw[key],
              name: null
            }
            : raw[key];

        const keyParts = splitAutomelonKey(key);

        const normalizedTitle =
          normalizeTitle(keyParts.title);

        const automelon =
          normalizeTitle(keyParts.automelon);

        /*
         * [SERVICE][MOMENT] TITLE
         *
         * Exemple:
         * [V][LIHC] TITLE
         * [V][AP] TITLE
         */
        let match =
          normalizedTitle.match(
            /^\[([a-z]+)\]\s+\[([a-z]+)\]\s+(.*)$/i
          );

        if (match) {
          const service =
            match[1].toUpperCase();

          const moment =
            match[2].toUpperCase();

          const title = match[3];

          const serviceKey =
            `[${service}] ${title}`;

          if (automelon) {
            const automelonKey =
              serviceKey + " || " + automelon;

            if (
              !serviceAutomelonIndex[automelonKey]
            ) {
              serviceAutomelonIndex[automelonKey] = [];
            }

            if (
              Array.isArray(
                serviceAutomelonIndex[automelonKey]
              )
            ) {
              serviceAutomelonIndex[
                automelonKey
              ].push({
                moment,
                item
              });
            } else {
              console.warn(
                "Mixed service and service-moment automelon key:",
                automelonKey
              );
            }
          }

          if (!serviceIndex[serviceKey]) {
            serviceIndex[serviceKey] = [];
          }

          serviceIndex[serviceKey].push({
            moment,
            item
          });

          globalCount[title] =
            (globalCount[title] || 0) + 1;

          continue;
        }

        /*
         * [SERVICE] TITLE
         *
         * Exemple:
         * [V] TITLE
         * [O] TITLE
         */
        match =
          normalizedTitle.match(
            /^\[([a-z]+)\]\s+(.*)$/i
          );

        if (match) {
          const service =
            match[1].toUpperCase();

          const title = match[2];

          const serviceKey =
            `[${service}] ${title}`;

          if (automelon) {
            const automelonKey =
              serviceKey + " || " + automelon;

            if (
              !serviceAutomelonIndex[automelonKey]
            ) {
              serviceAutomelonIndex[
                automelonKey
              ] = item;
            } else {
              console.warn(
                "Mixed service and service-moment automelon key:",
                automelonKey
              );
            }
          } else {
            serviceIndex[serviceKey] = item;
          }

          globalCount[title] =
            (globalCount[title] || 0) + 1;

          continue;
        }

        /*
         * GLOBAL TITLE
         */
        if (automelon) {
          const automelonKey =
            normalizedTitle + " || " + automelon;

          globalAutomelonIndex[
            automelonKey
          ] = item;
        } else {
          globalIndex[normalizedTitle] = item;
        }

        globalCount[normalizedTitle] =
          (globalCount[normalizedTitle] || 0) + 1;
      }

      /*
       * Sortează momentele în ordinea serviciului.
       */
      for (const key in serviceIndex) {
        if (
          !Object.prototype.hasOwnProperty.call(
            serviceIndex,
            key
          )
        ) {
          continue;
        }

        if (!Array.isArray(serviceIndex[key])) {
          continue;
        }

        const serviceMatch =
          key.match(/^\[([A-Z]+)\]/);

        const service =
          serviceMatch ? serviceMatch[1] : "";

        const order =
          SERVICE_ORDER[service] || {};

        serviceIndex[key].sort((a, b) => {
          return (
            (order[a.moment] || 999) -
            (order[b.moment] || 999)
          );
        });
      }

      for (
        const key in serviceAutomelonIndex
      ) {
        if (
          !Object.prototype.hasOwnProperty.call(
            serviceAutomelonIndex,
            key
          )
        ) {
          continue;
        }

        const entries =
          serviceAutomelonIndex[key];

        if (!Array.isArray(entries)) {
          continue;
        }

        const serviceMatch =
          key.match(/^\[([A-Z]+)\]/);

        const service =
          serviceMatch ? serviceMatch[1] : "";

        const order =
          SERVICE_ORDER[service] || {};

        entries.sort((a, b) => {
          return (
            (order[a.moment] || 999) -
            (order[b.moment] || 999)
          );
        });
      }

      /*
       * Elimină intrările globale care intră în
       * coliziune cu mai multe servicii.
       */
      for (const title in globalCount) {
        if (
          !Object.prototype.hasOwnProperty.call(
            globalCount,
            title
          )
        ) {
          continue;
        }

        if (globalCount[title] > 1) {
          delete globalIndex[title];
        }
      }
    } catch (error) {
      console.warn(
        "TitleLink load failed:",
        error.message
      );
    }

    /**********************
     * DETECT SERVICE MOMENT
     **********************/
    function detectMomentForParagraph(paragraph) {
      const paragraphs =
        Array.from(
          document.querySelectorAll("p")
        );

      const currentIndex =
        paragraphs.indexOf(paragraph);

      if (currentIndex === -1) {
        return "";
      }

      /*
       * Caută înapoi maximum 100 de paragrafe.
       */
      const startIndex =
        Math.max(0, currentIndex - 100);

      for (
        let index = currentIndex - 1;
        index >= startIndex;
        index--
      ) {
        const text =
          normalizeTitle(
            paragraphs[index].textContent || ""
          );

        if (text.includes("aposticha")) {
          return "AP";
        }

        if (
          text.includes("litia") ||
          text.includes("artoklasia")
        ) {
          return "LT";
        }

        if (
          text.includes("o lord i have cried") ||
          text.includes("lord i have cried")
        ) {
          return "LIHC";
        }
      }

      return "";
    }
    /**********************
     * SELECT MATCH
     **********************/
    function selectServiceMatch(
      match,
      serviceKey,
      htmlMoment
    ) {
      if (!Array.isArray(match)) {
        return match
          ? match.item || match
          : null;
      }

      const momentMatch =
        htmlMoment
          ? match.find(entry => {
            return (
              entry &&
              entry.moment === htmlMoment &&
              entry.item
            );
          })
          : null;

      if (momentMatch) {
        return momentMatch.item;
      }

      const usageKey =
        "SERVICE::" + serviceKey;

      const index =
        titleUsage[usageKey] || 0;

      const selected =
        match[
        Math.min(
          index,
          match.length - 1
        )
        ];

      titleUsage[usageKey] =
        index + 1;

      return selected && selected.item
        ? selected.item
        : null;
    }

    function selectAutomelonMatch(
      match,
      automelonKey,
      htmlMoment
    ) {
      if (!Array.isArray(match)) {
        return match
          ? match.item || match
          : null;
      }

      const momentMatch =
        htmlMoment
          ? match.find(entry => {
            return (
              entry &&
              entry.moment === htmlMoment &&
              entry.item
            );
          })
          : null;

      if (momentMatch) {
        return momentMatch.item;
      }

      const usageKey =
        "AUTOMELON::" + automelonKey;

      const index =
        titleUsage[usageKey] || 0;

      const selected =
        match[
        Math.min(
          index,
          match.length - 1
        )
        ];

      titleUsage[usageKey] =
        index + 1;

      return selected && selected.item
        ? selected.item
        : null;
    }

    /**********************
     * CREATE LINKS
     **********************/
    function createSingleLink(paragraph, item) {
      if (!item || !item.url) {
        return false;
      }

      const link =
        document.createElement("a");

      link.href = item.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      /*
       * Păstrează formatarea internă a paragrafului.
       */
      link.innerHTML = paragraph.innerHTML;

      if (item.name) {
        link.title = item.name;
      }

      paragraph.innerHTML = "";
      paragraph.appendChild(link);

      return true;
    }

    function createMultipleLinks(
      paragraph,
      item,
      htmlAutomelon,
      baseKey
    ) {
      if (
        !item ||
        item.type !== "multi" ||
        !Array.isArray(item.versions)
      ) {
        return false;
      }

      let versions = item.versions;

      /*
       * ============================================================
       * SUNDAY RESURRECTIONAL / MENAION FILTER
       * ============================================================
       *
       * Regula temporară pentru After Psalm 50:
       *
       * 1. Dacă serviciul este duminică:
       *      Resurrectional are prioritate.
       *
       * 2. Dacă NU este duminică:
       *      Menaion este selectat când:
       *        periodId === "menaion"
       *        feastId === SERVICE_DATE
       *
       * Excepțiile liturgice de duminică vor fi tratate ulterior.
       * ============================================================
       */

      if (IS_SUNDAY) {

        const resurrectionalVersions =
          versions.filter(version => {

            const path =
              String(version.path || "")
                .toLowerCase();

            return (
              !version.periodId &&
              !version.feastId &&
              path.endsWith(" / orthros")
            );
          });

        if (resurrectionalVersions.length > 0) {

          console.log(
            "Sunday Resurrectional version selected:",
            resurrectionalVersions.map(
              version => version.label
            )
          );

          versions = resurrectionalVersions;
        }

      } else if (SERVICE_DATE) {

        const feastVersions =
          versions.filter(version => {
            return (
              version.periodId === "menaion" &&
              version.feastId === SERVICE_DATE
            );
          });

        if (feastVersions.length > 0) {

          console.log(
            "Menaion feast version selected:",
            SERVICE_DATE,
            feastVersions.map(
              version => version.label
            )
          );

          versions = feastVersions;
        }
      }

      /*
       * AFTER-FEAST:
       * Dacă titlul HTML este un titlu After-feast,
       * păstrează numai versiunile care aparțin feast-ului
       * determinat din calendar.
       */
      if (
        /\bafter-feast\b/i.test(baseKey) ||
        /\bafter feast\b/i.test(baseKey)
      ) {
        versions = versions.filter(version => {
          return (
            version.feastId &&
            version.feastId === AFTER_FEAST_ID
          );
        });

        if (versions.length === 0) {
          console.warn(
            "No matching AFTER-FEAST version:",
            {
              baseKey,
              afterFeastId: AFTER_FEAST_ID
            }
          );

          return true;
        }
      }

      /*
       * Pentru titlurile cu automelon, afișează
       * numai versiunile acelui automelon.
       */
      if (htmlAutomelon) {
        versions = versions.filter(version => {
          return (
            normalizeTitle(
              version.automelon || ""
            ) === htmlAutomelon
          );
        });

        if (versions.length === 0) {
          console.warn(
            "No matching automelon version:",
            baseKey,
            htmlAutomelon
          );

          return true;
        }
      }

      const span =
        document.createElement("span");

      span.innerHTML =
        paragraph.innerHTML;

      versions.forEach(version => {
        if (!version.url) {
          return;
        }

        const space =
          document.createTextNode(" ");

        const link =
          document.createElement("a");

        link.href = version.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        link.textContent =
          `(${version.label || "PDF"})`;

        if (version.name) {
          link.title = version.name;
        }

        span.appendChild(space);
        span.appendChild(link);
      });

      paragraph.innerHTML = "";
      paragraph.appendChild(span);

      return true;
    }

    /**********************
     * FIND TITLE ITEM
     **********************/
    function findTitleItem(
      baseKey,
      htmlAutomelon,
      htmlMoment
    ) {
      let item = null;

      /*
       * Căutare specifică serviciului curent.
       */
      if (SERVICE) {
        const serviceKey =
          `[${SERVICE}] ${baseKey}`;

        /*
         * 1. SERVICE + AUTOMELON
         */
        if (htmlAutomelon) {
          const automelonKey =
            serviceKey +
            " || " +
            htmlAutomelon;

          const automelonMatch =
            serviceAutomelonIndex[
            automelonKey
            ];

          item = selectAutomelonMatch(
            automelonMatch,
            automelonKey,
            htmlMoment
          );
        }

        /*
         * 2. SERVICE + TITLE
         */
        if (!item) {
          const match =
            serviceIndex[serviceKey];

          item = selectServiceMatch(
            match,
            serviceKey,
            htmlMoment
          );
        }
      }

      /*
       * GLOBAL + AUTOMELON
       */
      if (!item && htmlAutomelon) {
        const automelonKey =
          baseKey +
          " || " +
          htmlAutomelon;

        item =
          globalAutomelonIndex[
          automelonKey
          ];
      }

      /*
       * GLOBAL TITLE
       */
      if (!item) {
        item = globalIndex[baseKey];
      }

      return item || null;
    }

    /**********************
     * APPLY TITLE LINKS
     **********************/
    document
      .querySelectorAll("p")
      .forEach(paragraph => {
        /*
         * Nu modifică paragrafele care au deja link.
         */
        if (paragraph.querySelector("a[href]")) {
          return;
        }

        const originalText =
          paragraph.textContent.trim();

        if (!originalText) {
          return;
        }

        const htmlAutomelon =
          extractAutomelonFromText(
            originalText
          );

        const baseKey =
          normalizeTitle(originalText);

        const htmlMoment =
          detectMomentForParagraph(
            paragraph
          );

        const item =
          findTitleItem(
            baseKey,
            htmlAutomelon,
            htmlMoment
          );

        if (!item) {
          return;
        }

        if (
          createMultipleLinks(
            paragraph,
            item,
            htmlAutomelon,
            baseKey
          )
        ) {
          return;
        }

        createSingleLink(
          paragraph,
          item
        );
      });

    /**********************
     * CLEAN LINK COLORS
     **********************/
    document
      .querySelectorAll("a font")
      .forEach(font => {
        font.removeAttribute("color");

        if (font.style) {
          font.style.color = "";
        }
      });

    document
      .querySelectorAll("a span")
      .forEach(span => {
        if (span.style) {
          span.style.color = "";
        }
      });

    console.log(
      "Title links applied successfully.",
      {
        service: SERVICE
      }
    );
  });
})();    