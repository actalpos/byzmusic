// textutil este disponibil pe macOS; citim doar textul, fără a modifica RTF-ul.
import {execFileSync} from 'node:child_process';
import path from 'node:path';
export function detectYearFromRtf(filePath, sourceMonth, sourceDay) {
  const text = execFileSync('/usr/bin/textutil',['-convert','txt','-stdout',filePath],{encoding:'utf8',maxBuffer:20*1024*1024});
  const lines = text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean).slice(0,100);
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const monthName = monthNames[sourceMonth-1];
  const candidates = [];
  for (const line of lines) {
    // Nu considerăm un an istoric drept anul slujbei doar pentru că apare în text.
    const datePattern = new RegExp(`\\b${monthName}\\s+0?${sourceDay}\\s*,?\\s*(20\\d{2})\\b`,'i');
    const reversePattern = new RegExp(`\\b0?${sourceDay}\\s+${monthName}\\s*,?\\s*(20\\d{2})\\b`,'i');
    const match = line.match(datePattern) || line.match(reversePattern);
    if (match) candidates.push({year:Number(match[1]),source:line.slice(0,150)});
  }
  const years = [...new Set(candidates.map(c=>c.year))];
  return {year:years.length===1?years[0]:null,candidates,ambiguous:years.length>1};
}
