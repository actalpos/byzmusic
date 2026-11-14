/**
 * layout-fixes-and-links.js — v1.2 (2026-11-13)
 * Layout bilingv + hyperlinkuri din titleLink.json.
 *
 * Prefixe slujba: [V] Vespers, [O] Orthros, [LV] Liturgy Variables.
 * Momente V: [LIHC] Lord I Have Cried, [LT] Litia, [AP] Aposticha,
 *             [APL] Apolytikion.
 * Momente O: [APL] Apolytikion, [KA] Kathisma,
 *             [PS50] After Psalm 50 Hymns, [EX] Exaposteilarion,
 *             [PR] Praises / AINOI.
 * [APL] este global; [PS] nu este folosit.
 *
 * CHANGELOG v1.2:
 * - Urmareste momentul curent dupa antetele din document, inclusiv
 *   antetul care initiaza momentul. Fara exceptie speciala AINOI.
 * - [SERVICE][MOMENT] TITLE necesita moment identic; nu se mai
 *   alege PDF dupa ordinea aparitiilor (titleUsage).
 * - Recunoaste prefixe alfanumerice, inclusiv [PS50].
 * - Pastreaza filtrarea existenta Menaion/Octoechos prin hymn-selection.js.
 * - Nu modifica operatiile de formatare ale tabelului bilingv.
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


    console.log("layout-fixes-and-links loaded");

    /**********************
     * SERVICE TYPE
     **********************/
    function detectServiceType() {
      const path = window.location.pathname.toLowerCase();

      if (path.includes("vesp")) return "V";
      if (path.includes("orthros")) return "O";
      if (path.includes("litart")) return "LT";

      // if ((path.includes("liturgy") || path.includes("divine")) && !path.includes("variables")) {
      //   return "L";
      // }

      if ((path.includes("liturgy") || path.includes("divine")) && path.includes("variables")) {
        return "LV";
      }

      return null;
    }

    const SERVICE = detectServiceType();

    const SERVICE_ORDER = {
      V: { LIHC: 1, LT: 2, AP: 3, APL: 4 },
      O: { APL: 1, KA: 2, PS50: 3, EX: 4, PR: 5 },
    };

    /**********************
     * UTILS
     **********************/
    function normalizeTitle(str) {
      str = str
        .replace(/[\n\r\t]+/g, " ")
        .replace(/\(\s*\*\*.*?\*\*\s*\)/g, "")   // (** ... **)
        .replace(/\*\*.*?\*\*/g, "")             // fallback
        .replace(/[*]/g, "")
        .replace(/["“”]/g, "")
        .replace(/[,:;]+/g, "")
        .replace(/[–—]/g, "-")
        .replace(/\(\s*/g, "( ")
        .replace(/\s*\)/g, " )")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase()
        .replace(/^(the|a|an|sticheras)\s+/i, "")          // remove leading article
        .replace(/\bin\s+tone\b/gi, "tone")

      const prefixMatch = str.match(/^((\[[a-z0-9]+\])+)\s*(.*)$/);

      if (prefixMatch) {
        const prefixes = prefixMatch[1];
        let title = prefixMatch[3];

        title = title.replace(/^(the|a|an|festal)\s+/, "");

        return `${prefixes} ${title}`.trim();
      }

      return str.replace(/^(the|a|an|festal)\s+/, "");
    }

    function isRTL(text) {
      return /[\u0590-\u08FF]/.test(text);
    }

    /**********************
     * REMOVE GHOST COLUMNS
     **********************/
    document.querySelectorAll("table col").forEach(col => {
      const width = parseInt(col.getAttribute("width"));
      if (!width || width > 1000) col.remove();
    });

    document.querySelectorAll("table tr").forEach(tr => {

      const tds = Array.from(tr.children).filter(td => td.tagName === "TD");

      tds.forEach(td => {

        const text = td.textContent.replace(/\s+/g, "");
        const width = td.getAttribute("width");

        if (!text || (width && parseInt(width) > 1000)) {
          td.remove();
        }

      });

      const remainingTds = Array.from(tr.children).filter(td => td.tagName === "TD");

      if (remainingTds.length === 1) {
        remainingTds[0].setAttribute("colspan", "2");
      }

      if (remainingTds.length === 2) {
        remainingTds.forEach(td => td.removeAttribute("colspan"));
      }

    });

    /**********************
     * FORCE LTR TABLE LAYOUT
     **********************/
    document.querySelectorAll("table").forEach(table => {
      table.setAttribute("dir", "ltr");
    });

    /**********************
     * PARAGRAPH FIXES
     **********************/
    document.querySelectorAll("td p").forEach(p => {

      const text = p.textContent.trim();
      if (!text) return;

      p.removeAttribute("align");
      p.style.float = "none";
      p.style.position = "static";

      const rtl = isRTL(text);

      p.style.direction = rtl ? "rtl" : "ltr";
      p.style.textAlign = rtl ? "right" : "left";

    });

    /**********************
     * FIX COLUMN ORDER
     **********************/
    document.querySelectorAll("table tr").forEach(tr => {

      const tds = Array.from(tr.querySelectorAll("td"));
      if (tds.length !== 2) return;

      const leftText = tds[0].textContent.trim();
      const rightText = tds[1].textContent.trim();

      const leftRTL = isRTL(leftText);
      const rightRTL = isRTL(rightText);

      if (leftRTL && !rightRTL) {
        tr.insertBefore(tds[1], tds[0]);
      }

      tds.forEach(td => {

        const text = td.textContent.trim();
        if (!text) return;

        const rtl = isRTL(text);

        td.setAttribute("dir", rtl ? "rtl" : "ltr");
        td.style.textAlign = rtl ? "right" : "left";

      });

    });

    /**********************
     * LOAD TITLE LINKS
     **********************/
    const serviceIndex = {};
    const globalIndex = {};
    // UPDATE 2026-11-11: [APL] = moment global, nu serviciu.
    const globalApolytikionIndex = {};
    const globalCount = {};
    const octoechosTheotokia = [];

    function extractTone(text) {
      const match = normalizeTitle(text).match(
        /\btone\s+(one|two|three|four|five|six|seven|eight)\b/
      );
      return match ? match[1] : "";
    }

    function parseHymnKey(key) {
      const norm = normalizeTitle(key);
      const match = norm.match(
        /^(?:\[([a-z0-9]+)\]\s+)?(?:\[([a-z0-9]+)\]\s+)?(.*)$/i
      );
      if (!match) return null;
      const first = (match[1] || "").toUpperCase();
      const second = (match[2] || "").toUpperCase();
      const services = ["V", "O", "L", "LV"];
      return {
        service: second ? first : (services.includes(first) ? first : null),
        moment: second || (first && !services.includes(first) ? first : null),
        title: match[3]
      };
    }

    function findOctoechosTheotokion(day, service, moment, tone) {
      if (!day || !moment || !tone) return null;
      const matches = octoechosTheotokia.filter(entry =>
        entry.day.toLowerCase() === day.toLowerCase() &&
        entry.moment === moment &&
        entry.tone === tone &&
        (entry.service === service || entry.service === null)
      );
      const keys = [...new Set(matches.map(entry => entry.key))];
      if (keys.length !== 1) {
        if (keys.length > 1) {
          console.warn("Octoechos Theotokion ambiguous:", { day, service, moment, tone, keys });
        }
        return null;
      }
      return matches.find(entry => entry.key === keys[0]).item;
    }



    try {

      const base = window.location.pathname.includes("/byzmusic/") ? "/byzmusic" : "";
      const res = await fetch(`${base}/system/data/titleLink.json`);

      if (!res.ok) throw new Error("titleLink.json missing");

      const raw = await res.json();


      for (const key in raw) {

        const item =
          typeof raw[key] === "string"
            ? { url: raw[key], name: null }
            : raw[key];

        // Index separat pentru Theotokia din Octoechos, grupate dupa zi.
        const parsed = parseHymnKey(key);
        if (parsed && /theotokion/i.test(parsed.title)) {
          const versions = item.type === "multi" && Array.isArray(item.versions)
            ? item.versions : [item];
          const days = [...new Set(versions
            .filter(v => v && v.periodId === "octoechos" && v.feastId)
            .map(v => v.feastId))];
          for (const day of days) {
            const dayVersions = versions.filter(v =>
              v && v.periodId === "octoechos" && v.feastId === day
            );
            octoechosTheotokia.push({
              key, day, service: parsed.service, moment: parsed.moment,
              tone: extractTone(parsed.title),
              item: { type: "multi", versions: dayVersions }
            });
          }
        }

        const norm = /^\[[a-z0-9]+\]\s+\[[a-z0-9]+\]\s+/i.test(key)
          ? normalizeTitle(key.replace(
            /^(\[[a-z0-9]+\]\s+\[[a-z0-9]+\]\s+)(?:the|a|an|festal)\s+/i,
            "$1"
          ))
          : normalizeTitle(key);

        // UPDATE 2026-11-11 — [APL] TITLE, comun tuturor slujbelor.
        // Procesam inaintea regexului [SERVICE] TITLE.
        const aplMatch = norm.match(/^\[APL\]\s+(.*)$/i);
        if (aplMatch) {
          globalApolytikionIndex[aplMatch[1]] = item;
          continue;
        }

        // ----------------------------
        // [SERVICE] [MOMENT] TITLE
        // ----------------------------

        let m = norm.match(/^\[([a-z0-9]+)\]\s+\[([a-z0-9]+)\]\s+(.*)$/i);

        if (m) {

          const service = m[1].toUpperCase();
          const moment = m[2].toUpperCase();
          const title = m[3];

          const serviceKey = `[${service}] ${title}`;

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

        // ----------------------------
        // [SERVICE] TITLE
        // ----------------------------

        m = norm.match(/^\[([a-z0-9]+)\]\s+(.*)$/i);

        if (m) {

          const service = m[1].toUpperCase();
          const title = m[2];

          serviceIndex[`[${service}] ${title}`] = item;

          globalCount[title] =
            (globalCount[title] || 0) + 1;

          continue;
        }

        // ----------------------------
        // GLOBAL TITLE
        // ----------------------------

        globalIndex[norm] = item;

        globalCount[norm] =
          (globalCount[norm] || 0) + 1;
      }

      // sort moments inside each service

      for (const key in serviceIndex) {

        if (!Array.isArray(serviceIndex[key])) {
          continue;
        }

        const service =
          key.match(/^\[([A-Z]+)\]/)[1];

        const order =
          SERVICE_ORDER[service] || {};

        serviceIndex[key].sort((a, b) => {

          return (order[a.moment] || 999)
            - (order[b.moment] || 999);

        });
      }

      // remove global entries that collide
      // with another service

      for (const title in globalCount) {

        if (globalCount[title] > 1) {
          delete globalIndex[title];
        }
      }

    } catch (e) {

      console.warn("TitleLink load failed:", e.message);

    }

    /**********************
     * MOMENTUL SLUJBEI — stare actualizata la fiecare antet
     **********************/
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
      if (/\bapolytiki(?:on|a)\b/.test(text) ||
        /^dismissal hymns?\b/.test(text)) return "APL";
      if (/\baposticha\b/.test(text)) return "AP";
      if (/\blitia\b/.test(text) || /\bartoklasia\b/.test(text)) return "LT";
      if (/\blord i have cried\b/.test(text)) return "LIHC";

      return "";
    }

    // Scanare o singura data in ordinea documentului. Titlurile in araba
    // nu reseteaza momentul; acesta ramane activ pana la urmatorul antet.
    const paragraphMoments = new Map();
    let currentMoment = "";
    document.querySelectorAll("td p").forEach(paragraph => {
      const detected = momentFromHeading(paragraph.textContent || "");
      if (detected) currentMoment = detected;
      paragraphMoments.set(paragraph, currentMoment);
    });

    /**********************
     * APPLY TITLE LINKS
     **********************/
    document.querySelectorAll("td p").forEach(p => {
      if (p.querySelector("a")) return;
      const originalText = p.textContent.trim();
      if (!originalText) return;
      const baseKey = normalizeTitle(originalText);
      const htmlMoment = paragraphMoments.get(p) || "";
      let item = null;

      if (SERVICE) {
        const serviceKey = `[${SERVICE}] ${baseKey}`;
        const match = serviceIndex[serviceKey];
        if (Array.isArray(match)) {
          // Nu selectam dupa pozitie: numai momentul liturgic real.
          const exact = match.find(entry => entry.moment === htmlMoment);
          item = exact ? exact.item : null;
        } else if (match) {
          item = match;
        }
      }

      // Titlu generic: selectam Theotokionul dupa zi, moment si glas.
      const genericOctoechosTheotokion =
        /^theotokion (?:from|for) the octoechos\b/.test(baseKey);
      if (!item && genericOctoechosTheotokion) {
        const day = hymnContext?.weekday || "";
        const tone = extractTone(baseKey);
        item = findOctoechosTheotokion(day, SERVICE, htmlMoment, tone);
        console.debug("Octoechos Theotokion:", {
          title: originalText, day, service: SERVICE,
          moment: htmlMoment, tone, found: !!item
        });
      }

      // [APL] este global, dar se aplica numai in sectiunea Apolytikion.
      if (!item && !genericOctoechosTheotokion && htmlMoment === "APL") {
        let aplTitle = baseKey;

        // Titlu explicit Resurrectional Theotokion
        if (/^resurrectional theotokion\b/.test(aplTitle)) {
          aplTitle = aplTitle.replace(
            /^resurrectional theotokion\b/,
            "apolytikion resurrectional theotokion"
          );
        }

        item = globalApolytikionIndex[aplTitle] || null;
      }

      // ----------------------------
      // GLOBAL
      // ----------------------------

      if (!item && !genericOctoechosTheotokion) {
        item = globalIndex[baseKey];
      }

      if (!item) {
        return;
      }


      if (item.type === "multi" && Array.isArray(item.versions)) {

        const span = document.createElement("span");
        span.innerHTML = p.innerHTML;

        const eligibleVersions = hymnSelection.selectHymnVersions(item.versions, hymnContext, {
          afterFeastId: window.FeastCalendar?.detectAfterFeastId(hymnContext?.feastId || '') || '',
          afterFeast: /\bafter[ -]feast\b/i.test(baseKey)
        });
        if (!eligibleVersions.length) return;
        eligibleVersions.forEach(v => {

          const space = document.createTextNode(" ");

          const a = document.createElement("a");
          a.href = hymnSelection.fitPdfWidth(v.url);
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.textContent = `(${v.label})`;

          span.appendChild(space);
          span.appendChild(a);

        });

        p.innerHTML = "";
        p.appendChild(span);

        return;

      }

      if (!hymnSelection.isEligibleSingle(item, hymnContext)) return;

      const a = document.createElement("a");

      a.href = hymnSelection.fitPdfWidth(item.url);
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.innerHTML = p.innerHTML;

      if (item.name) a.title = item.name;

      p.innerHTML = "";
      p.appendChild(a);

    });

    /**********************
     * REMOVE WORD FONT SIZES
     **********************/
    document.querySelectorAll("[style*='font-size']").forEach(el => {
      el.style.fontSize = "";
    });

    document.querySelectorAll("font[size]").forEach(el => {
      el.removeAttribute("size");
    });

    document.querySelectorAll("font[face]").forEach(el => {
      el.removeAttribute("face");
    });

    /**********************
     * CLEAN WORD COLORS
     **********************/
    document.querySelectorAll("a font").forEach(f => {
      f.removeAttribute("color");
      if (f.style) f.style.color = "";
    });

    document.querySelectorAll("a span").forEach(s => {
      if (s.style) s.style.color = "";
    });

    console.log("Layout + links applied successfully.");

  });

})();