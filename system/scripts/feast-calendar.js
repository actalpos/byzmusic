/**
 * ============================================================
 * feast-calendar.js
 * Created: 2026-09-16
 *
 * Shared feast calendar and AFTER-FEAST detection.
 *
 * Used by:
 *   - title-links.js
 *   - layout-fixes-and-links.js
 *
 * feast_day is also the feastId stored in titleLink.json.
 *
 * Example:
 *   Holy Cross feast_day = "14-09"
 *   Service date         = "17-09"
 *   AFTER_FEAST_ID       = "14-09"
 * ============================================================
 */

(function () {
  "use strict";

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

  function detectServiceDate(pathname) {
    const path = pathname || window.location.pathname;

    // variableDate:
    // /variableDate/2026/08/29/
    // /variableDate/2026/08/29 Beheading of St John the Baptist/
    let match = path.match(
      /\/variableDate\/\d{4}\/(\d{2})\/(\d{2})/i
    );

    if (match) {
      return `${match[2]}-${match[1]}`;
    }

    // fixDate:
    // /fixDate/08/29/
    // /fixDate/08/29 Beheading of St John the Baptist/
    match = path.match(
      /\/fixDate\/(\d{2})\/(\d{2})/i
    );

    if (match) {
      return `${match[2]}-${match[1]}`;
    }

    return "";
  }

  function dateValue(date) {
    const match =
      String(date || "").match(/^(\d{2})-(\d{2})$/);

    if (!match) return null;

    const day = Number(match[1]);
    const month = Number(match[2]);

    return month * 100 + day;
  }

  function detectAfterFeastId(serviceDate) {
    const current = dateValue(serviceDate);

    if (current === null) return "";

    for (const feast of FEAST_CALENDAR) {
      const feastDay = dateValue(feast.feast_day);
      const leaveTaking = dateValue(feast.leave_taking);

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

  function detectFeastId(serviceDate) {

    const current = dateValue(serviceDate);

    if (current === null) return "";

    for (const feast of FEAST_CALENDAR) {

      const feastDay = dateValue(feast.feast_day);

      if (
        feastDay !== null &&
        current === feastDay
      ) {
        return feast.feast_day;
      }
    }

    return "";
  }

  /*
   * Public shared API.
   */
  window.FeastCalendar = {
    calendar: FEAST_CALENDAR,
    detectServiceDate,
    detectAfterFeastId,
    detectFeastId
  };

})();