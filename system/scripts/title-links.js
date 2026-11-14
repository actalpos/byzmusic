/**
 * title-links.js
 *
 * Adaugă linkurile din titleLink.json în titlurile imnurilor.
 * Nu modifică layout-ul documentului.
 * UPDATE 2026-11-11: potrivire strictă pe moment; fără fallback
 * între [PR], [AP], [LIHC], [LT] etc.
 *
 * ============================================================
 * UPDATE 2026-11-11 — DOCUMENTATIE PREFIXE
 * ============================================================
 * CODURI SLUJBE (primul prefix din titleLink.json):
 *   [V]  = Vespers / Vecernie
 *   [O]  = Orthros / Utrenie
 *   [L]  = Divine Liturgy (detectarea L este comentata momentan)
 *   [LV] = Divine Liturgy Variables
 *   [LT] = Litia / LITART cand este folosit ca tip de slujba
 *
 * CODURI MOMENTE (al doilea prefix):
 *   [LIHC] = Lord I Have Cried
 *   [AP]   = Aposticha
 *   [LT]   = Litia / Artoklasia (moment, nu tip de slujba)
 *   [PR]   = Praises, inclusiv Praises Stichera
 *   [EX]   = Exaposteilarion
 *   [KA]   = Kathisma / Sessional Hymns
 *   [PS50] = Hymns after Psalm 50
 *   [APL]  = Apolytikion / Dismissal Hymns
 *
 * [APL] este prefix GLOBAL DE MOMENT, nu prefix de slujba.
 * [PS] NU este utilizat: Praises Stichera foloseste [PR].
 * UPDATE 2026-11-13: momentul se urmareste in ordinea sectiunilor HTML;
 * SERVICE_ORDER este pentru ordonare, nu pentru ghicirea momentului.
 *
 * EXEMPLE DE STRUCTURA (nu garanteaza existenta in JSON):
 *   [V][LIHC] DOXASTIKON TONE EIGHT
 *   [O][PR] THEOTOKION TONE EIGHT
 *   [APL] RESURRECTIONAL THEOTOKION TONE EIGHT (global, fara [O]/[V])
 *
 * REGULA: potrivire stricta pentru moment; fara alegerea
 * unui PDF dintr-un alt moment atunci cand nu exista potrivire.
 * Titlurile globale fara prefix pot fi folosite separat.
 * ============================================================
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
  const hymnBase = window.location.pathname.includes('/byzmusic/') ? '/byzmusic' : '';
  let hymnSelection;
  try {
    hymnSelection = await import(`${hymnBase}/system/scripts/hymn-selection.js`);
  } catch (error) {
    console.error('hymn-selection.js unavailable: links disabled to avoid incorrect matches', error);
    return;
  }
  const hymnContext = hymnSelection.contextFromPath(window.location.pathname);


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
      V: { LIHC: 1, LT: 2, AP: 3, APL: 4 },
      O: { APL: 1, KA: 2, PS50: 3, EX: 4, PR: 5 }
    };

    /**********************
     * UTILS
     **********************/
    function pdfFitWidthUrl(url) {
      if (!url) return url;

      const driveMatch = url.match(
        /drive\.google\.com\/file\/d\/([^/?#]+)/
      );

      if (driveMatch) {
        return `https://drive.google.com/file/d/${driveMatch[1]}/preview#view=FitH`;
      }

      if (/\.pdf(?:[?#]|$)/i.test(url)) {
        return url.split("#")[0] + "#view=FitH";
      }

      return url;
    }
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
        str.match(/^((\[[a-z0-9]+\]\s*)+)(.*)$/i);

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

    const IS_SUNDAY =
      FEAST_CALENDAR
        ? FEAST_CALENDAR.isSunday()
        : false;

    console.log(
      "Detected IS_SUNDAY:",
      IS_SUNDAY
    );

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
    // UPDATE 2026-11-11: [APL] global pentru toate slujbele.
    const globalMomentIndex = {};
    const globalMomentAutomelonIndex = {};

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
         * UPDATE 2026-11-11 — [APL] GLOBAL DE MOMENT
         * Cheia [APL] TITLE este comuna Vespers/Orthros/Liturgy.
         * O indexam INAINTE de [SERVICE] TITLE, altfel [APL]
         * ar fi interpretat gresit ca un cod de slujba.
         */
        const globalMomentMatch = normalizedTitle.match(/^\[APL\]\s+(.*)$/i);
        if (globalMomentMatch) {
          const title = globalMomentMatch[1];
          if (automelon) {
            globalMomentAutomelonIndex[title + " || " + automelon] = item;
          } else {
            globalMomentIndex[title] = item;
          }
          continue;
        }

        /*
         * [SERVICE][MOMENT] TITLE
         *
         * Exemple:
         * [V][LIHC] TITLE
         * [V][AP] TITLE
         */
        let match =
          normalizedTitle.match(
            /^\[([a-z0-9]+)\]\s+\[([a-z0-9]+)\]\s+(.*)$/i
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
     * DETECT SERVICE MOMENT — stateful, no moment fallback
     **********************/
    // A section heading changes the current moment for the heading itself
    // and all following paragraphs until another recognized heading.
    // A generic hymn title (e.g. THEOTOKION) must not reset the moment.
    function momentFromHeading(rawText) {
      const text = normalizeTitle(rawText);
      if (!text || text.length > 120) return "";

      if (/^(?:at the )?praises(?: stichera)?\b/.test(text) ||
          /^stichera (?:at|of) the praises\b/.test(text) ||
          /^ainoi\b/.test(text)) return "PR";
      if (/^exaposteilar(?:ion|ia)\b/.test(text)) return "EX";
      if (/^(?:troparia |hymns? )?after (?:the )?psalm 50\b/.test(text) ||
          /^(?:troparia|hymns?) after psalm (?:50|fifty)\b/.test(text)) return "PS50";
      if (/^kathism(?:a|ata)\b/.test(text) ||
          /^sessional hymns?\b/.test(text)) return "KA";
      if (/^apolytiki(?:on|a)\b/.test(text) ||
          /^dismissal hymns?\b/.test(text)) return "APL";
      if (/\baposticha\b/.test(text)) return "AP";
      if (/\blitia\b/.test(text) || /\bartoklasia\b/.test(text)) return "LT";
      if (/\blord i have cried\b/.test(text)) return "LIHC";
      return "";
    }

    // Scan once in document order. Unlike backward searches limited to 100
    // paragraphs, the moment persists until the next recognized section.
    const paragraphMoments = new Map();
    let currentMoment = "";
    document.querySelectorAll("p").forEach(paragraph => {
      const headingMoment = momentFromHeading(paragraph.textContent || "");
      if (headingMoment) currentMoment = headingMoment;
      paragraphMoments.set(paragraph, currentMoment);
    });

    function detectMomentForParagraph(paragraph) {
      return paragraphMoments.get(paragraph) || "";
    }

    /**********************
     * SELECT MATCH
     **********************/
    /*
     * UPDATE 2026-11-11 — STRICT MOMENT MATCHING (NO FALLBACK)
     * --------------------------------------------------------
     * Pentru cheile [SERVICE][MOMENT] TITLE, acceptăm NUMAI
     * momentul identificat explicit în HTML.
     *
     * Dacă momentul nu poate fi detectat sau nu corespunde,
     * întoarcem null. NU alegem un PDF după ordinea apariției.
     * Cheile [SERVICE] TITLE și cele globale (fără prefix)
     * continuă să fie căutate separat, ca înainte.
     * Aceeași regulă se aplică și titlurilor cu automelon.
     */
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

      if (!htmlMoment) {
        return null;
      }

      const momentMatch = match.find(entry =>
        entry && entry.moment === htmlMoment && entry.item
      );

      return momentMatch ? momentMatch.item : null;
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

      if (!htmlMoment) {
        return null;
      }

      const momentMatch = match.find(entry =>
        entry && entry.moment === htmlMoment && entry.item
      );

      return momentMatch ? momentMatch.item : null;
    }

    /**********************
     * CREATE LINKS
     **********************/
    function createSingleLink(paragraph, item) {
      if (!item || !item.url) {
        return false;
      }

      if (!hymnSelection.isEligibleSingle(item, hymnContext)) return false;

      const link =
        document.createElement("a");

      link.href = pdfFitWidthUrl(item.url);
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
       * CONTEXTE EXPLICITE — fara fallback.
       * Se aplica numai versiunilor marcate resurrectional/octoihos.
       * PDF-urile istorice nemarcate isi pastreaza comportamentul
       * existent pana la auditarea metadatelor.
       */
      const context = FEAST_CALENDAR && FEAST_CALENDAR.detectLiturgicalContexts
        ? FEAST_CALENDAR.detectLiturgicalContexts()
        : null;
      const taggedVersionAllowed = version => {
        const id = String(version.feastId || "").toLowerCase();
        if (id !== "resurrectional" && id !== "octoihos") return true;
        if (!context || context.weekday === null) return false;
        if (id === "resurrectional" && context.weekday !== 0) return false;
        if (id === "octoihos") {
          // Fara weekday explicit nu putem decide care zi din Octoihos.
          if (!Number.isInteger(version.weekday) || version.weekday !== context.weekday) return false;
        }
        // Nu confundam glasurile si ciclul Eothina: daca sunt
        // cerute in PDF, trebuie cunoscute si in pagina.
        if (version.tone !== undefined && version.tone !== null && version.tone !== "") {
          if (context.tone === null || Number(version.tone) !== context.tone) return false;
        }
        if (version.eothinaId) {
          if (!context.eothinaId || version.eothinaId !== context.eothinaId) return false;
        }
        // Un PDF Eothinon neetichetat precis nu poate fi validat.
        if (/eothion|eothinon/i.test(String(version.name || "")) && !version.eothinaId) return false;
        return true;
      };

      versions = versions.filter(taggedVersionAllowed);
      versions = hymnSelection.selectHymnVersions(versions, hymnContext, {
        afterFeastId: AFTER_FEAST_ID,
        afterFeast: /\bafter[ -]feast\b/i.test(baseKey)
      });
      if (versions.length === 0) return true;

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

        //link.href = version.url;
        link.href = pdfFitWidthUrl(version.url);

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
       * SUNDAY - AFTER PSALM 50
       *
       * Dacă versiunea [O] găsită conține numai Menaion,
       * iar serviciul este duminică, folosim versiunea
       * globală Resurrectional / regular din Orthros.
       */
      /*
       * UPDATE 2026-11-11 — [APL] GLOBAL, STRICT PE MOMENT
       * Nu incercam cheia [APL] in alta sectiune.
       * Generatorul normalizeaza RESURRECTIONAL THEOTOKION la
       * APOLYTIKION RESURRECTIONAL THEOTOKION; folosim aceeasi
       * forma doar pentru cautarea acestui moment.
       */
      if (!item && htmlMoment === "APL") {
        const aplTitle = baseKey.replace(
          /^resurrectional theotokion\b/,
          "apolytikion resurrectional theotokion"
        );
        if (htmlAutomelon) {
          item = globalMomentAutomelonIndex[
            aplTitle + " || " + htmlAutomelon
          ] || null;
        }
        if (!item) item = globalMomentIndex[aplTitle] || null;
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