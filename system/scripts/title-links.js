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

    /**********************
     * AFTER-FEAST CALENDAR
     **********************/

    /*
     * Datele sunt în format:
     * DD-MM
     *
     * feast_day devine feastId.
     */
    const FEAST_CALENDAR = [
      {
        feast_name: "The Nativity of the Theotokos",
        pre_feast_start: "07-09",
        feast_day: "08-09",
        leave_taking: "12-09"
      },
      {
        feast_name: "The Elevation of the Holy Cross",
        pre_feast_start: "13-09",
        feast_day: "14-09",
        leave_taking: "21-09"
      },
      {
        feast_name: "The Entry of the Theotokos into the Temple",
        pre_feast_start: "20-11",
        feast_day: "21-11",
        leave_taking: "25-11"
      },
      {
        feast_name: "The Nativity of Christ (Christmas)",
        pre_feast_start: "20-12",
        feast_day: "25-12",
        leave_taking: "31-12"
      },
      {
        feast_name: "The Theophany of Our Lord (Epiphany)",
        pre_feast_start: "02-01",
        feast_day: "06-01",
        leave_taking: "14-01"
      },
      {
        feast_name: "The Meeting of Our Lord in the Temple",
        pre_feast_start: "01-02",
        feast_day: "02-02",
        leave_taking: "09-02"
      },
      {
        feast_name: "The Annunciation of the Theotokos",
        pre_feast_start: "24-03",
        feast_day: "25-03",
        leave_taking: "26-03"
      },
      {
        feast_name: "The Transfiguration of Our Lord",
        pre_feast_start: "05-08",
        feast_day: "06-08",
        leave_taking: "13-08"
      },
      {
        feast_name: "The Dormition of the Theotokos",
        pre_feast_start: "14-08",
        feast_day: "15-08",
        leave_taking: "23-08"
      }
    ];


    /*
     * Extrage data serviciului din pathname.
     *
     * variableDate/YYYY/MM/DD
     * fixDate/MM/DD
     *
     * Returnează:
     * DD-MM
     */
    function detectServiceDate() {
      const path =
        window.location.pathname;

      let match =
        path.match(
          /\/variableDate\/\d{4}\/(\d{2})\/(\d{2})(?:\/|$)/i
        );

      if (match) {
        return `${match[2]}-${match[1]}`;
      }

      match =
        path.match(
          /\/fixDate\/(\d{2})\/(\d{2})(?:\/|$)/i
        );

      if (match) {
        return `${match[2]}-${match[1]}`;
      }

      return "";
    }


    /*
     * Transformă DD-MM într-o valoare comparabilă.
     *
     * Exemplu:
     * 17-09 -> 917
     */
    function dateValue(date) {
      const match =
        String(date || "")
          .match(/^(\d{2})-(\d{2})$/);

      if (!match) {
        return null;
      }

      const day =
        Number(match[1]);

      const month =
        Number(match[2]);

      return month * 100 + day;
    }


    /*
     * Determină feastId pentru AFTER-FEAST.
     *
     * AFTER-FEAST începe DUPĂ feast_day
     * și continuă până la leave_taking inclusiv.
     *
     * Exemplu:
     *
     * serviceDate = 17-09
     *
     * Holy Cross:
     * feast_day    = 14-09
     * leave_taking = 21-09
     *
     * rezultat:
     * feastId = 14-09
     */
    function detectAfterFeastId(serviceDate) {
      const current =
        dateValue(serviceDate);

      if (current === null) {
        return "";
      }

      for (const feast of FEAST_CALENDAR) {
        const feastDay =
          dateValue(feast.feast_day);

        const leaveTaking =
          dateValue(feast.leave_taking);

        if (
          feastDay !== null &&
          leaveTaking !== null &&
          current > feastDay &&
          current <= leaveTaking
        ) {
          return feast.feast_day;
        }
      }

      return "";
    }


    const SERVICE_DATE =
      detectServiceDate();

    const AFTER_FEAST_ID =
      detectAfterFeastId(SERVICE_DATE);

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