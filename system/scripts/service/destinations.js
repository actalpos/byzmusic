
/**
 * ============================================================
 * destinations.js
 * Versiune: 1.1
 * Data: 2026-11-13
 *
 * MODIFICĂRI v1.1:
 * - Directoarele istorice DD/ nu mai blochează crearea
 *   directoarelor DD FeastTitle/.
 * - Directoarele existente DD FeastTitle/ sunt reutilizate.
 * - Verificarea conflictelor între titluri diferite este păstrată.
 *
 * LOGICĂ PĂSTRATĂ:
 * - Structura YYYY/MM MonthName/DD FeastTitle.
 * - Nu se mută sau redenumesc directoare existente.
 * - Nu se suprascriu fișiere HTML existente.
 * ============================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { serviceTextsDir } from './config.js';
import { monthFolder } from './dates.js';

export function groupKey(date) {
  return `${date.year}|${date.month}|${date.day}`;
}

export function baseDir(date) {
  return path.join(
    serviceTextsDir,
    String(date.year),
    monthFolder(date.month)
  );
}

export function resolveDestination(date, title) {
  const parent = baseDir(date);
  const proposed = `${date.day} ${title}`;

  if (!fs.existsSync(parent)) {
    return {
      destination: path.join(parent, proposed),
      note: 'nou'
    };
  }

  const existing = fs.readdirSync(parent, { withFileTypes: true })
    .filter(e =>
      e.isDirectory() &&
      e.name.startsWith(`${date.day} `)
    )
    .map(e => e.name);

  if (!existing.length) {
    return {
      destination: path.join(parent, proposed),
      note: 'nou'
    };
  }

  if (existing.length === 1 && existing[0] === proposed) {
    return {
      destination: path.join(parent, proposed),
      note: 'existent'
    };
  }

  throw new Error(
    `Conflict de directoare la ${date.year}-${date.month}-${date.day}: ${existing.join(' | ')}; propus ${proposed}`
  );
}
