// Version: 1.1
// Updated: 2026-11-13
// CHANGELOG:
// - Octoechos CommonOrthros/CommonVespers: fallback numai pentru tipul slujbei.
// - Pastreaza prioritatea zilei si prioritatea Menaion; fara fallback intre slujbe.
/** Shared, conservative selection of hymn PDF versions. ES module. */
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
export function contextFromPath(pathname) {
  let path;
  try { path = decodeURIComponent(String(pathname || '')); } catch { return null; }
  const m = path.match(/\/Service_Texts\/(\d{4})\/(\d{2})(?:\s+[^/]+)?\/(\d{2})(?:\s+[^/]+)?\//i);
  if (!m) return null;
  const [year,month,day] = m.slice(1).map(Number);
  const d = new Date(Date.UTC(year,month-1,day));
  if (d.getUTCFullYear()!==year || d.getUTCMonth()!==month-1 || d.getUTCDate()!==day) return null;
  const filename = path.split('/').pop() || '';
  const service = /\bORTHROS\b/i.test(filename) ? 'Orthros'
    : /\bVESP(?:ERS)?\b/i.test(filename) ? 'Vespers' : '';
  return {year,month,day,weekday:DAYS[d.getUTCDay()],feastId:`${m[3]}-${m[2]}`,isSunday:d.getUTCDay()===0,service};
}
export function selectHymnVersions(versions, context, {afterFeastId='', afterFeast=false}={}) {
  if (!Array.isArray(versions)) return [];
  const scoped = versions.filter(v => ['menaion','octoechos'].includes(String(v.periodId||'').toLowerCase()));
  const others = versions.filter(v => !['menaion','octoechos'].includes(String(v.periodId||'').toLowerCase()));
  if (!context) return scoped.length ? [] : others.filter(v => !v.feastId);
  const menaion = scoped.filter(v => v.periodId==='menaion' && v.feastId===(afterFeast ? afterFeastId : context.feastId));
  const octoechos = afterFeast ? [] : scoped.filter(v => v.periodId==='octoechos' && String(v.feastId||'').toLowerCase()===context.weekday.toLowerCase());
  const selected = context.isSunday ? (octoechos.length ? octoechos : menaion) : (menaion.length ? menaion : octoechos);
  if (selected.length) return selected;
  // Common is only a fallback, never a replacement for a matching day or Menaion.
  // No Common selection during after-feast or when the service is unknown.
  const commonId = context.service === 'Orthros' ? 'commonorthros'
    : context.service === 'Vespers' ? 'commonvespers' : '';
  if (!afterFeast && commonId) {
    const common = scoped.filter(v => v.periodId === 'octoechos' && String(v.feastId || '').toLowerCase() === commonId);
    if (common.length) return common;
  }
  // Do not silently use a generic score when a contextual alternative exists.
  if (scoped.length || afterFeast) return [];
  return others.filter(v => !v.feastId && !v.periodId);
}
export function isEligibleSingle(item, context) {
  if (!item || !item.url) return false;
  if (!item.periodId && !item.feastId) return true;
  return selectHymnVersions([item],context).length>0;
}
export function fitPdfWidth(url) {
  if (!url) return url;
  return String(url).replace(/#.*$/, '') + '#view=FitH';
}
