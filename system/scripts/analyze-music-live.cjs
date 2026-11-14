'use strict';

/*
 BYZMUSIC — MUSIC LIVE LOCAL v6 (preview implicit)
 =========================================
 FORMAT: <number> <Section>[-<tone>]-<Author>-<Service>-<Feast>.pdf
 VESPERS:
 01 LihcSticheras; 02 LihcDoxastikon; 03 LihcTheotokion;
 04 LitiaSticheras; 05 LitiaDoxastikon; 06 Aposticha;
 07 ApostichaDoxastikon; 07 ApostichaTheotokion; 08 Apolytikion.
 ORTHROS:
 21 Kathismata; 22 Prokeimenon; 23 AfterPsalm50Hymns;
 25 Exapoteilarion; 26 Praises; 27 PraisesDoxastikon;
 28 PraisesTheotokion. 24 ramane rezervat.

 TONE:
 - un glas cunoscut: il pastram; necunoscut: '?'.
 - mai multe cantari cu glasuri DIFERITE, confirmate: omitem
   complet campul tone; acelasi glas: il pastram.
 - exceptie Apolytikion: glasul Apolytikionului principal,
   chiar daca PDF-ul contine si Kontakion pe alt glas.
 - Mode Pa NU identifica singur glasul.
 NUMEROTARE:
 - o singura pozitie liturgica: numar simplu.
 - pozitii distincte cu acelasi numar: A, B, C dupa ordinea
   slujbei, NU dupa ordinea alfabetica a fisierelor.
 - 07A ApostichaDoxastikon / 07B ApostichaTheotokion
   numai daca ambele pozitii sunt confirmate.
 - versiuni muzicale alternative NU primesc automat A/B.
 - ordine incerta => ORDINE NECONFIRMATA.
 AUTORI / SURSE:
 - AA = eticheta implicita Public; GC = eticheta implicita
   Restricted; NU sunt autori confirmati.
 - SA = St Anthony's Monastery (sursa); CK = Chadi Karam;
   JEM = Fr John El Massih (adaptare).
 - drepturile sunt stabilite EXCLUSIV prin folderul de intrare,
   nu prin numele autorului. Nu schimbam Public/Restricted.
 PDF-URI COMPUSE:
 - pastram PDF-ul intreg, enumeram cantarile in Description;
   separarea se face ulterior.
 DECIZII CONFIRMATE:
 - After-the-Orthros-Gospel => 23 AfterPsalm50Hymns.
 - Theotokion-O_Lady_do_thou_receive.pdf => Unknown.
 - aposticha-1113-john_chrysostom.pdf => JEM.
 - Dogmatic Theotokion general => candidat Octoichos, NU
   atribuire automata unei sarbatori.
 - Litia Partial => cuprinde Litia Sticheras si Doxastikon.
 - exapost-1113-john_chrysostom.pdf: doua cantari in glasurile
   3rd si 2nd; eliminam campul tone, pastram ambele in Description.
 - Prokeimenon "My mouth shall speak wisdom": asociere cu
   St John Chrysostom NUMAI daca incipitul se gaseste in
   textul extras din PDF-ul slujbei Orthros corespunzatoare.
 - O cantare generala poate fi folosita la mai multe sarbatori;
   potrivirea incipitului confirma folosirea in acea slujba,
   NU exclusivitatea cantarii.
 - Folderul confirmat pentru 13 November este:
   Menaion/03 November/13 John Chrysostom, archbishop of Constantinople.
 - Extractorul Swift actual citeste doar primele 3 pagini;
   absenta incipitului NU demonstreaza absenta din slujba.
 SIGURANTA: implicit PREVIEW. --apply cere confirmare interactiva.
 Mutam doar fisierele confirmate in Processed/Public sau Restricted.
 Nu stergem, nu suprascriem, nu incarcam in Google Drive.
 Unknown / NECONFIRMAT / Octoichos candidat / erori se omit.
 Salvam jurnal JSONL pentru fiecare mutare, util la revenire.
 =========================================
*/

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const crypto = require('node:crypto');

const ROOT = path.join(os.homedir(), 'Documents', 'ByzMusic-Inbox');
const SWIFT = path.join(__dirname, 'extract-pdf.swift');
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const TONES = {1:'1st',2:'2nd',3:'3rd',4:'4th',5:'pl1st',6:'pl2nd',7:'pl3rd-grave',8:'pl4th'};
const PLAGAL = {first:'pl1st',second:'pl2nd',third:'pl3rd-grave',fourth:'pl4th','1st':'pl1st','2nd':'pl2nd','3rd':'pl3rd-grave','4th':'pl4th'};
const SECTIONS = [
  ['Vespers','02','LihcDoxastikon',/doxastikon.{0,45}(lord.{0,15}cried|lihc)|doxastikon.at.lord/i],
  ['Vespers','03','LihcTheotokion',/dogmatic.{0,15}theotokion|lihc.{0,25}theotokion/i],
  ['Vespers','01','LihcSticheras',/stichera.{0,35}(lihc|lord.{0,15}cried)|stichera.on.lihc/i],
  ['Vespers','05','LitiaDoxastikon',/(lity|litia).{0,25}doxastikon|doxastikon.{0,25}(lity|litia)/i],
  ['Vespers','04','LitiaSticheras',/(lity|litia).{0,35}(stichera|idiomelon|partial)|st.john.chrysostom.lity/i],
  ['Vespers','07','ApostichaDoxastikon',/doxastikon.{0,30}aposticha|aposticha.{0,30}doxastikon/i],
  ['Vespers','07','ApostichaTheotokion',/aposticha.{0,30}theotokion|theotokion.{0,30}aposticha/i],
  ['Vespers','06','Aposticha',/aposticha/i],
  ['Vespers','08','Apolytikion',/apolytikion|troparion/i],
  ['Orthros','23','AfterPsalm50Hymns',/after.{0,12}(orthros.gospel|psalm.{0,5}50)|psalm.{0,5}50.{0,25}hymns/i],
  ['Orthros','21','Kathismata',/kathismata|kathisma|sessional.hymns?/i],
  ['Orthros','22','Prokeimenon',/prokeimenon|prokimenon/i],
  ['Orthros','25','Exapoteilarion',/exapost|exapoteilarion|photagogikon/i],
  ['Orthros','27','PraisesDoxastikon',/praises.{0,30}doxastikon|doxastikon.{0,30}praises/i],
  ['Orthros','28','PraisesTheotokion',/praises.{0,30}theotokion|theotokion.{0,30}praises/i],
  ['Orthros','26','Praises',/praises|ainoi|lauds/i]
];

function clean(s) { return String(s || '').replace(/[\uE000-\uF8FF]/g, ' ').replace(/\s+/g,' ').trim(); }
function safe(s) { return clean(s).replace(/[\\/:*?"<>|]/g, '').replace(/\.+$/,'').trim(); }
function lines(s) { return String(s || '').split(/\r?\n/).map(clean).filter(Boolean); }
function norm(s) { return clean(s).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(); }
function extract(file) {
  if (!fs.existsSync(SWIFT)) return {text:'',status:'LIPSESTE extract-pdf.swift'};
  const r = spawnSync('swift',[SWIFT,file],{encoding:'utf8',timeout:90000,maxBuffer:8*1024*1024});
  if (r.error || r.status !== 0) return {text:'',status:'EROARE PDFKit',error:r.error?.message || clean(r.stderr).slice(0,250)};
  return {text:r.stdout || '',status:r.stdout?.trim()?'PDFKit':'PDFKit: fara text'};
}
function tonesIn(s) {
  const text = clean(s).toLowerCase();
  const found = [];
  const patterns = [
    /\bplagal\s+(first|second|third|fourth|1st|2nd|3rd|4th)\s+(?:mode|tone)\b/g,
    /\b(?:tone|mode|glas)\s*(?:number\s*)?([1-8])\b/g,
    /\bgrave\s+(?:mode|tone)\b/g
  ];
  for (const m of text.matchAll(patterns[0])) found.push(PLAGAL[m[1]]);
  for (const m of text.matchAll(patterns[1])) found.push(TONES[Number(m[1])]);
  if (patterns[2].test(text)) found.push('pl3rd-grave');
  return [...new Set(found.filter(Boolean))];
}
function sectionFrom(filename, text) {
  // Nu atribuim un serviciu pe baza unui singur cuvant generic.
  const n = filename.replace(/\.pdf$/i,'').replace(/[_-]/g,' ');
  for (const [service,number,section,re] of SECTIONS) {
    if (re.test(n)) return {service,number,section,source:'nume'};
  }
  const h = lines(text).slice(0,35).join(' ');
  for (const [service,number,section,re] of SECTIONS) {
    if (re.test(h)) return {service,number,section,source:'PDF'};
  }
  return {service:'?',number:'??',section:'Unknown',source:'neidentificat'};
}
function hasIncipit(haystack, incipit) {
  const h = norm(haystack);
  const needle = norm(incipit);
  return needle.length >= 12 && (` ${h} `).includes(` ${needle} `);
}
function musicIncipits(filename, text, section) {
  // Potriviri explicite, verificabile. Nu atribuim sarbatori
  // dintr-un cuvant generic sau doar din existenta unui Orthros.
  const name = norm(filename);
  const result = [];
  if (section === 'Prokeimenon' &&
      (name.includes('my mouth shall speak wisdom') ||
       hasIncipit(text, 'my mouth shall speak wisdom'))) {
    result.push('my mouth shall speak wisdom');
  }
  return result;
}
function feastFrom(s) {
  if (/\b(chrysostom|chrysostomos)\b/i.test(s)) return 'St John Chrysostom';
  return null; // v5 nu inventeaza sarbatori necunoscute
}
function serviceDate(filename, service) {
  const m = filename.match(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*[ ._-]+(\d{1,2})\b/i);
  const month = filename.match(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)/i);
  if (!m || !month) return null;
  const mi = MONTHS.findIndex(x => x.toLowerCase().startsWith(month[1].toLowerCase().slice(0,3)));
  if (mi < 0) return null;
  const day = Number(m[1]);
  if (day < 1 || day > 31) return null;
  // Vespers in ajun: data liturgica este ziua urmatoare.
  const d = new Date(Date.UTC(2024,mi,day + (service === 'Vespers' ? 1 : 0)));
  return {month:d.getUTCMonth()+1,day:d.getUTCDate()};
}
function feastDateFromText(text) {
  const m = text.match(/\b(?:November|Nov)\s+13\b/i);
  return m ? {month:11,day:13} : null;
}
function sameDate(a,b) { return !!(a && b && a.month===b.month && a.day===b.day); }
function serviceType(filename) {
  if (/\bORTHROS\b|\bORTH\b/i.test(filename)) return 'Orthros';
  if (/\bVESP(?:ERS)?\b/i.test(filename)) return 'Vespers';
  return null;
}
function serviceDocuments() {
  const dir = path.join(ROOT,'Service-PDF');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(n => /\.pdf$/i.test(n)).sort().map(name => {
    const service = serviceType(name);
    const data = extract(path.join(dir,name));
    const text = lines(data.text).slice(0,150).join(' ');
    return {name,service,date:serviceDate(name,service),text,status:data.status,feast:feastFrom(name+' '+text)};
  });
}
function authorFrom(filename,header,access) {
  if (/fr\.?\s+john el massih/i.test(header) || /\bJEM\b/i.test(filename)) return {code:'JEM',note:'Fr John El Massih (adaptare)'};
  if (/chadi karam/i.test(header) || /\bCK\b/i.test(filename)) return {code:'CK',note:'Chadi Karam'};
  if (/st\.?\s*anthony.s monastery|stanthonysmonastery/i.test(header)) return {code:'SA',note:"St Anthony's Monastery (sursa)"};
  return {code:access==='Public'?'AA':'GC',note:'eticheta implicita; autor neconfirmat'};
}
function analyze(file,access,services) {
  const filename = path.basename(file);
  const ex = extract(file);
  const header = lines(ex.text).slice(0,65).join(' ');
  const sec = sectionFrom(filename,ex.text);
  const author = authorFrom(filename,header,access);
  const notes = [];
  let hymns = [];
  let tone = tonesIn(lines(ex.text).slice(0,35).join(' '))[0] || '?';
  let multiTone = false;
  let feast = feastFrom(filename+' '+header);
  let feastSource = feast ? 'partitura' : 'neconfirmata';
  let category = 'Menaion';
  let matchedIncipit = null;

  // Exceptie: acest fisier nu este atribuit unei sectiuni prin inferenta.
  if (/^Theotokion-O_Lady_do_thou_receive\.pdf$/i.test(filename)) {
    Object.assign(sec,{service:'?',number:'??',section:'Unknown',source:'decizie confirmata'});
  }
  if (/^aposticha-1113-john_chrysostom\.pdf$/i.test(filename)) {
    author.code='JEM'; author.note='Fr John El Massih (confirmat)';
  }
  if (/^b5213\.pdf$/i.test(filename) && /apolytikion/i.test(header)) {
    Object.assign(sec,{service:'Vespers',number:'08',section:'Apolytikion',source:'PDF'});
    author.code='SA'; author.note="St Anthony's Monastery (sursa)";
    tone='pl4th';
    hymns=['Apolytikion — pl4th','Kontakion — pl2nd'];
    notes.push('PDF compus: pastram ambele cantari; glasul principal este pl4th.');
  }
  if (/st.john.chrysostom.lity.partial/i.test(filename)) {
    Object.assign(sec,{service:'Vespers',number:'04',section:'LitiaSticheras',source:'nume'});
    tone='?';
    hymns=['Litia Sticheras — 1st Idiomelon (By Anatolius)','Litia Doxastikon — glas neconfirmat'];
    notes.push('PDF compus: Litia Sticheras + Litia Doxastikon; separare ulterioara.');
  }
  if (/\bmode pa\b/i.test(header) && !hymns.length) {
    tone='?'; notes.push('Mode Pa nu determina glasul.');
  }
  // Confirmare manuala: doua cantari distincte, glasuri 3rd/2nd.
  if (/^exapost-1113-john_chrysostom\.pdf$/i.test(filename)) {
    Object.assign(sec,{service:'Orthros',number:'25',section:'Exapoteilarion'});
    tone='?';
    multiTone=true;
    hymns=['Exapoteilarion — 3rd','Exapoteilarion — 2nd'];
    notes.push('Glasuri multiple confirmate: campul tone este omis.');
  }
  // Detectam glasuri multiple numai cand apar explicit pe linii
  // diferite de titlu/sectiune; altfel marcam pentru verificare.
  if (!hymns.length) {
    const extractedLines = lines(ex.text).slice(0,65);
    const toneLines = extractedLines.filter(s => /\b(?:tone|mode|glas|plagal)\b/i.test(s));
    const detected = [...new Set(toneLines.flatMap(tonesIn))];
    if (detected.length > 1 && sec.section !== 'Apolytikion') {
      notes.push('Mai multe indicatii de glas ('+detected.join(', ')+'); verificati daca apartin unor cantari distincte.');
      // NU eliminam automat tone doar din mai multe mentiuni.
    }
    hymns=[`${sec.section} — ${tone}`];
  }
  // Daca avem cantarile separate explicit, putem omite tone.
  if (hymns.length>1 && sec.section!=='Apolytikion') {
    const found = [...new Set(hymns.flatMap(tonesIn))];
    if (found.length>1) multiTone=true;
  }
  if (sec.section==='LihcTheotokion' && /dogmatic/i.test(filename+' '+header)) {
    category='Octoichos (candidat)';
    feast=null; feastSource='cantare generala';
    notes.push('Dogmatic Theotokion general: NU atribuim automat Menaionului.');
  }
  if (sec.section==='Unknown') {
    category='NECONFIRMAT';
    notes.push('Sectiune Unknown: necesita verificare manuala.');
  }
  const candidateServices=services.filter(s => s.service===sec.service);
  const incipits = musicIncipits(filename,ex.text,sec.section);
  if (!feast && category==='Menaion' && incipits.length) {
    const matches=[];
    for (const svc of candidateServices) {
      if (!svc.feast) continue;
      for (const incipit of incipits) {
        if (hasIncipit(svc.text, incipit)) {
          matches.push({svc,incipit});
        }
      }
    }
    const uniqueFeasts=[...new Set(matches.map(x=>x.svc.feast))];
    if (uniqueFeasts.length===1) {
      feast=uniqueFeasts[0];
      feastSource='incipit Service-PDF';
      matchedIncipit=matches[0].incipit;
      notes.push('Incipit confirmat in '+matches.map(x=>x.svc.name).join('; ')+': "'+matchedIncipit+'".');
      notes.push('Cantarea poate fi folosita si la alte sarbatori.');
    } else if (uniqueFeasts.length>1) {
      notes.push('Incipit gasit la mai multe sarbatori: atribuire neconfirmata.');
    } else {
      notes.push('Incipit negasit in paginile extrase din Service-PDF; nu atribuim sarbatoarea.');
    }
  }
  const matched=[];
  for (const s of candidateServices) {
    if (feast && s.feast && feast!==s.feast) continue;
    // Potrivire prudenta: numele sarbatorii este confirmat in partitura
    // sau textul cantarii este suficient de specific.
    const words = norm(filename.replace(/\.pdf$/i,'')).split(' ').filter(w => w.length>=6 && !/^(orthros|vespers|theotokion|doxastikon|aposticha|praises|prokeimenon|chrysostom)$/.test(w));
    const titleMatch = words.some(w => norm(s.text).includes(w));
    if ((feast && s.feast===feast) || (titleMatch && s.feast)) matched.push(s);
  }
  if (!feast && category==='Menaion') {
    const choices=[...new Set(matched.map(s=>s.feast).filter(Boolean))];
    if (choices.length===1) {
      // Doar sugestie, nu identificare certa dintr-un titlu generic.
      notes.push('Posibila sarbatoare din Service-PDF: '+choices[0]+' (verificare manuala).');
    }
  }
  if (matched.length) notes.push('Service-PDF candidat: '+matched.map(s=>s.name).join('; '));
  if (!feast && category==='Menaion') notes.push('Sarbatoarea NU este confirmata: nu alegem automat un folder Menaion.');
  if (category==='Menaion' && !feast) category='NECONFIRMAT';
  const feastLabel = feast || 'Feast-UNCONFIRMED';
  const tonePart = multiTone?'':`-${tone}`;
  const proposed = `${sec.number} ${sec.section}${tonePart}-${author.code}-${sec.service}-${safe(feastLabel)}.pdf`;
  const root = access==='Public'?'Byzantine Music/EnglishByzantineMusic':'MyPrivateEnglishMusic';
  let destination = `${root}/${category}`;
  if (category==='Menaion' && feast) {
    // Data/folderul zilei se confirma ulterior; nu inventam nume de folder.
    const feastServices = services.filter(s=>s.feast===feast && s.service===sec.service);
    const nov13 = feast==='St John Chrysostom' && feastServices.some(s=>sameDate(s.date,{month:11,day:13}));
    if (nov13) {
      destination += '/03 November/13 John Chrysostom, archbishop of Constantinople';
    } else {
      destination += '/[luna si ziua de verificat]';
      notes.push('Folderul Menaion necesita verificarea datei liturgice.');
    }
  }
  if (category==='Octoichos (candidat)') destination=`${root}/Octoichos [DE CONFIRMAT]`;
  return {access,filename,ex,sec,author,feast,feastSource,matchedIncipit,hymns,tone,multiTone,notes,proposed,destination};
}
// LIVE LOCAL: analiza v5 ramane sursa propunerilor. Niciun upload.
function localTarget(r) {
  const prefix = r.access === 'Public'
    ? 'Byzantine Music/EnglishByzantineMusic/'
    : 'MyPrivateEnglishMusic/';
  if (!r.destination.startsWith(prefix)) return null;
  const relative = r.destination.slice(prefix.length);
  if (!relative.startsWith('Menaion/')) return null;
  if (/\[|\]|NECONFIRMAT|UNCONFIRMED|DE CONFIRMAT/i.test(relative)) return null;
  if (!r.feast || r.sec.service === '?' || r.sec.section === 'Unknown') return null;
  if (r.sec.number === '??' || r.ex.status !== 'PDFKit') return null;
  if (/UNCONFIRMED|NECONFIRMAT|\?|\[|\]/i.test(r.proposed.replace(/-\?-/g, '-'))) return null;
  const segments = relative.split('/');
  if (segments.some(x => !x || x === '.' || x === '..')) return null;
  const base = path.resolve(ROOT, 'Processed', r.access);
  const dest = path.resolve(base, ...segments, r.proposed);
  if (!dest.startsWith(base + path.sep)) return null;
  return dest;
}
function fingerprint(file) {
  const hash = crypto.createHash('sha256');
  const fd = fs.openSync(file, 'r');
  try {
    const buffer = Buffer.allocUnsafe(1024 * 1024);
    let n;
    while ((n = fs.readSync(fd, buffer, 0, buffer.length, null)) > 0)
      hash.update(buffer.subarray(0, n));
  } finally { fs.closeSync(fd); }
  return hash.digest('hex');
}
function buildPlan(results) {
  const plan = [];
  const reserved = new Set();
  for (const r of results) {
    const source = path.join(ROOT, 'Music-PDF', r.access, r.filename);
    const target = localTarget(r);
    let reason = '';
    if (!target) reason = 'clasificare/destinatie neconfirmata';
    else if (reserved.has(target)) reason = 'doua partituri propun acelasi nume';
    else if (fs.existsSync(target)) reason = 'destinatia exista deja';
    else if (!fs.existsSync(source)) reason = 'sursa lipseste';
    if (target) reserved.add(target);
    plan.push({source, target, reason, result:r});
  }
  return plan;
}
function applyPlan(plan) {
  const eligible = plan.filter(p => !p.reason);
  if (!eligible.length) { console.log('Nicio mutare eligibila.'); return; }
  if (!process.stdin.isTTY) {
    console.error('LIVE necesita Terminal interactiv (nu redirectiona stdin).');
    process.exitCode = 2;
    return;
  }
  console.log('\nATENTIE: --apply va MUTA fisierele eligibile din Music-PDF in Processed.');
  console.log('Nu se modifica Google Drive. Fisierele neconfirmate raman in Inbox.');
  process.stdout.write('Scrie exact LIVE LOCAL pentru confirmare: ');
  const answer = Buffer.alloc(128);
  const n = fs.readSync(0, answer, 0, answer.length, null);
  if (answer.subarray(0,n).toString('utf8').trim() !== 'LIVE LOCAL') {
    console.log('Anulat. Niciun fisier modificat.'); return;
  }
  const logs = path.join(ROOT, 'Processed', '_logs');
  fs.mkdirSync(logs, {recursive:true});
  const logFile = path.join(logs, 'live-local-' + new Date().toISOString().replace(/[:.]/g,'-') + '.jsonl');
  let moved=0, failed=0;
  for (const p of eligible) {
    try {
      // Revalidam chiar inainte de mutare, evitam suprascrierea.
      if (!fs.existsSync(p.source) || fs.existsSync(p.target))
        throw new Error('Sursa lipseste sau destinatia exista');
      const sha256 = fingerprint(p.source);
      fs.mkdirSync(path.dirname(p.target), {recursive:true});
      // Exclusivitate: hard-link + unlink evita suprascrierea si
      // functioneaza pentru Inbox/Processed aflate pe acelasi volum.
      fs.linkSync(p.source, p.target);
      try { fs.unlinkSync(p.source); }
      catch (e) { fs.unlinkSync(p.target); throw e; }
      const record = {time:new Date().toISOString(), status:'MOVED', source:p.source, target:p.target, sha256,
        description:{feast:p.result.feast,service:p.result.sec.service,section:p.result.sec.section,
          hymns:p.result.hymns,notes:p.result.notes,author:p.result.author.code}};
      fs.appendFileSync(logFile, JSON.stringify(record)+'\n');
      console.log('MUTAT:',p.result.filename,'=>',p.target);
      moved++;
    } catch(e) {
      failed++;
      fs.appendFileSync(logFile,JSON.stringify({time:new Date().toISOString(),status:'ERROR',source:p.source,target:p.target,error:e.message})+'\n');
      console.error('EROARE:',p.result.filename,e.message);
    }
  }
  console.log(`\nLIVE: mutate ${moved}; erori ${failed}; jurnal: ${logFile}`);
}
function main() {
  console.log('\n========== BYZMUSIC — MUSIC LIVE LOCAL v6 (preview implicit) ==========');
  const apply = process.argv.includes('--apply');
  console.log(apply ? 'LIVE LOCAL cerut — mutare doar dupa confirmare.' : 'PREVIEW implicit — fara modificari.');
  console.log('Fara upload Google Drive.\n');
  const services=serviceDocuments();
  console.log('SERVICE-PDF:');
  if (!services.length) console.log('  Nu au fost gasite PDF-uri de slujba.');
  for (const s of services) console.log(`  ${s.name} | ${s.service||'?'} | ${s.feast||'feast neconfirmat'} | ${s.status}`);
  const results=[];
  for (const access of ['Public','Restricted']) {
    const dir=path.join(ROOT,'Music-PDF',access);
    if (!fs.existsSync(dir)) {console.log('Folder lipsa:',dir);continue;}
    for (const name of fs.readdirSync(dir).filter(n=>/\.pdf$/i.test(n)).sort()) {
      results.push(analyze(path.join(dir,name),access,services));
    }
  }
  // A/B numai pentru pozitii distincte 07 in aceeasi sarbatoare.
  for (const item of results) {
    if (item.sec.service!=='Vespers'||item.sec.number!=='07'||!item.feast) continue;
    const otherSection=item.sec.section==='ApostichaDoxastikon'?'ApostichaTheotokion':'ApostichaDoxastikon';
    if (results.some(x=>x!==item && x.feast===item.feast && x.sec.section===otherSection)) {
      const letter=item.sec.section==='ApostichaDoxastikon'?'A':'B';
      item.proposed=item.proposed.replace(/^07 /,`07${letter} `);
    }
  }
  for (const r of results) {
    console.log('\n------------------------------------------------');
    console.log('Folder:       ',r.access);
    console.log('Original:     ',r.filename);
    console.log('Propus:       ',r.proposed);
    console.log('Destinatie:   ',r.destination);
    console.log('Sectiune din: ',r.sec.source);
    console.log('Text extras:  ',r.ex.status);
    console.log('Autor/sursa:  ',`${r.author.code} (${r.author.note})`);
    console.log('Description:');
    console.log('  Feast: '+(r.feast||'NECONFIRMAT'));
    console.log('  Feast source: '+r.feastSource);
    console.log('  Service: '+r.sec.service);
    console.log('  Section: '+r.sec.section);
    console.log('  Contains:');
    r.hymns.forEach((h,i)=>console.log(`    ${i+1}. ${h}`));
    r.notes.forEach(n=>console.log('  NOTE: '+n));
    if (r.ex.error) console.log('  ERROR: '+r.ex.error);
  }
  console.log(`\nTotal PDF-uri muzicale: ${results.length}`);
  const plan = buildPlan(results);
  console.log('\n========== PLAN LIVE LOCAL ==========');
  for (const p of plan) console.log((p.reason ? 'SKIP' : 'READY') + ': ' + p.result.filename +
    (p.reason ? ' — ' + p.reason : ' => ' + p.target));
  console.log(`READY: ${plan.filter(p=>!p.reason).length}; SKIP: ${plan.filter(p=>p.reason).length}`);
  if (apply) applyPlan(plan);
  else console.log('PREVIEW ONLY — foloseste --apply pentru executare cu confirmare.\n');
}
main();
