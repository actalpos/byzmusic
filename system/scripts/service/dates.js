// Data documentului și data liturgică sunt distincte.
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const ALIASES = {jan:1,january:1,feb:2,february:2,mar:3,march:3,apr:4,april:4,may:5,jun:6,june:6,jul:7,july:7,aug:8,august:8,sep:9,sept:9,september:9,oct:10,october:10,nov:11,november:11,dec:12,december:12};
export const monthFolder = (month) => `${String(month).padStart(2,'0')} ${MONTHS[Number(month)-1]}`;
export function serviceType(filename) {
  for (const type of ['VESP','ORTHROS','LITIA','LITART','READ']) {
    if (new RegExp(`\\b${type}\\b`, 'i').test(filename)) return type;
  }
  return 'OTHER';
}
export function parseDateFromFilename(filename) {
  const m = filename.match(/^([A-Za-z]+)\s+(\d{1,2})(?:\s+(\d{4}))?\b/);
  if (!m || !ALIASES[m[1].toLowerCase()]) return null;
  const month = ALIASES[m[1].toLowerCase()], day = Number(m[2]);
  const filenameYear = m[3] ? Number(m[3]) : null;
  if (day < 1 || day > 31) return null;
  if (filenameYear && !buildLiturgicalDate({month,day,year:filenameYear,filename})) return null;
  return {month,day,filenameYear,filename};
}
export function buildLiturgicalDate({month,day,year,filename}) {
  if (!Number.isInteger(year) || year < 1900 || year > 2200) return null;
  const d = new Date(Date.UTC(year,month-1,day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month-1 || d.getUTCDate() !== day) return null;
  if (/\b(VESP|LITIA|LITART)\b/i.test(filename)) d.setUTCDate(d.getUTCDate()+1);
  return {year:d.getUTCFullYear(),month:String(d.getUTCMonth()+1).padStart(2,'0'),day:String(d.getUTCDate()).padStart(2,'0')};
}
