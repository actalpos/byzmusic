/* v6.2.12 — --rename-only with manifest and future move support. */
/* v6.2.11 — Fix 1121 Entry/Entrance of the Theotokos in filename. */
/* v6.2.10 — Nume specific Exaposteilaria St Katherine; fara modificari de clasificare. */
/* v6.2.9 — Exceptie stricta filename-only pentru cele doua Canoane Ode 9 fara text PDFKit; glas necunoscut. */
/* v6.2.8 — Diagnostic detaliat pentru SKIP in preview, fara schimbarea regulilor de mutare. */
/* v6.2.7 — Accepta 1121 din numele PDF pentru Canon Ode 9 Entry Theotokos; restul regulilor neschimbate. */
/* v6.2.6 — Canon Ode 9; St Catherine 25 Nov; Praises Glory; composite safety. */
/*
 * BYZMUSIC — analyze-music.cjs
 * Versiune: 6.2.12
 * Data: 2026-11-13
 *
 * ISTORIC MODIFICĂRI
 * v6.2.6 — Identificare din antet PDF pentru Entrance (21 Nov) și
 *          After-Feast (22 Nov), cu destinații Menaion separate.
 *          Nu modifică regulile Octoichos sau protecțiile LIVE.
 * v6.2.4 — Glas necunoscut (?) permis în nume și procesare; fără blocare LIVE.
 * v6.2.3 — Recunoaștere Guria/Shamuna/Habib, Glory-at-LIHC și Glory-at-Aposticha;
 *          destinație confirmată pentru 15 November.
 * v6.2.2 — Corecție acoladă la îmbinarea fragmentelor text.
 * v6.2.1 — Redenumire la analyze-music.cjs și documentarea
 *          comenzilor, intrărilor și siguranței. Logica v6.2 intactă.
 * v6.2   — Versiunea originală din arhiva furnizată.
 *
 * PORNIRE DIN ~/Projects/byzmusic/system
 *   node scripts/analyze-music.cjs
 *   node scripts/analyze-music.cjs --rename-only
 *   node scripts/analyze-music.cjs --apply
 *
 * Preview-ul este implicit; --apply solicită confirmarea
 * interactivă înainte de mutarea locală a PDF-urilor eligibile.
 * Intrări: ~/Documents/ByzMusic-Inbox/Music-PDF/Public și Restricted
 * Ieșiri: ~/Documents/ByzMusic-Inbox/Processed/Public și Restricted
 * Jurnal: ~/Documents/ByzMusic-Inbox/Processed/_logs
 * Nu efectuează încărcări Google Drive sau modificări HTML/JSON.
 *
 * DEPENDINȚĂ: scripts/extract-pdf.swift (PDFKit pe macOS)
 * PĂSTRAT: clasificarea, regulile Octoechos/Menaion,
 * separarea Public/Restricted, preview, confirmarea și mutarea.
 */

'use strict';
const readline = require('node:readline');

/*
 BYZMUSIC — MUSIC LIVE LOCAL v6.2.9 (preview implicit)
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
  ['Orthros','24','CanonOde9',/9th.ode|ode.nine|ode.9|ninth.ode/i],
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
  if (/\bglory\s+at\s+(?:the\s+)?lihc\b/i.test(n)) {
    return {service:'Vespers',number:'02',section:'LihcDoxastikon',source:'nume'};
  }
  if (/\bglory\s+at\s+(?:the\s+)?aposticha\b/i.test(n)) {
    return {service:'Vespers',number:'07',section:'ApostichaDoxastikon',source:'nume'};
  }
  if (/\bglory\s+at\s+(?:the\s+)?praises\b/i.test(n))
    return {service:'Orthros',number:'27',section:'PraisesDoxastikon',source:'nume'};
  if (/\b9th\s+ode\b/i.test(n))
    return {service:'Orthros',number:'24',section:'CanonOde9',source:'nume'};
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
  const text = norm(s);
  if (/\bafter\s*feast\b/.test(text) && /\b(entrance|entry)\b/.test(text) &&
      /\btheotokos\b/.test(text)) return 'After-feast of the Entrance of the Theotokos';
  if (/\b(entrance|entry)\b/.test(text) && /\btheotokos\b/.test(text))
    return 'Entrance of the Theotokos into the Temple';
  if (/\b(katherine|catherine)\b/.test(text)) return 'Great-martyr Katherine the all-wise of Alexandria';
  if (/\b(chrysostom|chrysostomos)\b/.test(text)) return 'St John Chrysostom';
  if (/\b(guria|gurias|gurius|shamuna|shamoun|habib|abibus)\b/.test(text)) {
    return 'Martyrs Guria, Shamuna and Habib the Deacon of Edessa';
  }
  return null;
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

  if (/glory-at-the-aposticha-and-idiomelon-after-the-orthros-gospel/i.test(filename)) {
    notes.push('PDF compus: Aposticha Doxastikon + Idiomelon dupa Evanghelia Orthros; verificare manuala inainte de mutare.');
  }
  if (/^exapost-1125-katherine/i.test(filename)) {
    notes.push('PDF compus: Katherine, Mercurius si Leave-taking; verificati reutilizarea in mai multe slujbe.');
  }
  if (/^9th_ode-first_canon/i.test(filename)) notes.push('Canon Ode 9: First Canon.');
  if (/^9th_ode-second_canon/i.test(filename)) notes.push('Canon Ode 9: Second Canon.');
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
  if (sec.section==='CanonOde9') {
    sec.section = /first.canon/i.test(filename) ? 'CanonOde9First' :
                  /second.canon/i.test(filename) ? 'CanonOde9Second' : 'CanonOde9';
  }
  const feastLabel = feast || 'Feast-UNCONFIRMED';
  const tonePart = multiTone?'':`-${tone}`;
  // Exceptie confirmata: PDF-ul Katherine contine trei exaposteilaria;
  // pastram fisierul integral si folosim un nume neutru pentru grup.
  const proposed = /^exapost-1125-katherine\.pdf$/i.test(filename)
    ? `25 Exaposteilaria-3rd-AA-Orthros-St Katherine.pdf`
    : `${sec.number} ${sec.section}${tonePart}-${author.code}-${sec.service}-${safe(feastLabel)}.pdf`;
  const root = access==='Public'?'Byzantine Music/EnglishByzantineMusic':'MyPrivateEnglishMusic';
  let destination = `${root}/${category}`;
  if (category==='Menaion' && feast) {
    // Data/folderul zilei se confirma ulterior; nu inventam nume de folder.
    const feastServices = services.filter(s=>s.feast===feast && s.service===sec.service);
    const nov13 = feast==='St John Chrysostom' && feastServices.some(s=>sameDate(s.date,{month:11,day:13}));
    const guriaFeast = 'Martyrs Guria, Shamuna and Habib the Deacon of Edessa';
    const nov15 = feast === guriaFeast && (
      /(?:^|[^0-9])1115(?:[^0-9]|$)/i.test(filename) ||
      /november[\s._-]*15|nov[\s._-]*15|15th/i.test(filename) ||
      feastServices.some(s => sameDate(s.date,{month:11,day:15}))
    );
    const pdfHeader = norm(lines(ex.text).slice(0,12).join(' '));
    const datedNov22 = /\bnovember 22(nd)?\b/.test(pdfHeader);
    const datedNov21 = /\bnovember 21(st)?\b/.test(pdfHeader) ||
      (/(?:^|[^0-9])1121(?:[^0-9]|$)/.test(filename) &&
       /(?:entry|entrance)[-_ ](?:of[-_ ](?:the[-_ ])?)?theotokos|theotokos[-_ ](?:entry|entrance)/i.test(filename));
    if (feast==='After-feast of the Entrance of the Theotokos' && datedNov22) {
      destination += '/03 November/22 Sunday Tone 8, After-feast of the Entrance of the Theotokos';
    } else if (feast==='Entrance of the Theotokos into the Temple' && datedNov21) {
      destination += '/03 November/21 Entrance of the Theotokos into the Temple';
    } else if (feast==='Great-martyr Katherine the all-wise of Alexandria' &&
               (/\b1125\b|\bnov[ ._-]*25\b/i.test(filename) || /\bnovember 25(th)?\b/.test(pdfHeader))) {
      destination += '/03 November/25 Great-martyr Katherine the all-wise of Alexandria';
      notes.push('Verificati numele exact al folderului Google Drive pentru 25 noiembrie.');
    } else if (nov13) {
      destination += '/03 November/13 John Chrysostom, archbishop of Constantinople';
    } else if (nov15) {
      destination += '/03 November/15 Sunday Tone 7, Martyrs Guria, Shamuna and Habib the Deacon of Edessa';
    } else {
      destination += '/[luna si ziua de verificat]';
      notes.push('Folderul Menaion necesita verificarea datei liturgice.');
    }
  }
  if (category==='Octoichos (candidat)') destination=`${root}/Octoichos [DE CONFIRMAT]`;
  return {access,filename,ex,sec,author,feast,feastSource,matchedIncipit,hymns,tone,multiTone,notes,proposed,destination};
}
// LIVE LOCAL: analiza v5 ramane sursa propunerilor. Niciun upload.
// Exceptie stricta: doua Canoane Ode 9, 21 Nov, fara text PDFKit.
// Acceptam numai metadatele explicite din nume; glasul ramane '?'.
function filenameOnlyCanonConfirmed(r) {
  return r.access === 'Public' &&
    /^9th_Ode-(?:First|Second)_Canon-Entry-Theotokos-1121-CK-WNBN\.pdf$/i.test(r.filename) &&
    r.ex.status === 'PDFKit: fara text' &&
    r.feast === 'Entrance of the Theotokos into the Temple' &&
    r.sec.service === 'Orthros' &&
    /^CanonOde9(?:First|Second)$/.test(r.sec.section) &&
    r.author.code === 'CK' && r.tone === '?' &&
    r.destination.endsWith('/03 November/21 Entrance of the Theotokos into the Temple');
}
function localTarget(r) {
  if (/glory-at-the-aposticha-and-idiomelon-after-the-orthros-gospel/i.test(r.filename)) return null;
  const prefix = r.access === 'Public'
    ? 'Byzantine Music/EnglishByzantineMusic/'
    : 'MyPrivateEnglishMusic/';
  if (!r.destination.startsWith(prefix)) return null;
  const relative = r.destination.slice(prefix.length);
  if (!relative.startsWith('Menaion/')) return null;
  if (/\[|\]|NECONFIRMAT|UNCONFIRMED|DE CONFIRMAT/i.test(relative)) return null;
  if (!r.feast || r.sec.service === '?' || r.sec.section === 'Unknown') return null;
  if (r.sec.number === '??' || (r.ex.status !== 'PDFKit' && !filenameOnlyCanonConfirmed(r))) return null;
  if (/UNCONFIRMED|NECONFIRMAT|\?|\[|\]/i.test(r.proposed.replace(/-\?-/g, '-'))) return null;
  const segments = relative.split('/');
  if (segments.some(x => !x || x === '.' || x === '..')) return null;
  const base = path.resolve(ROOT, 'Processed', r.access);
  const dest = path.resolve(base, ...segments, r.proposed);
  if (!dest.startsWith(base + path.sep)) return null;
  return dest;
}
const MANIFEST_PATH = path.join(ROOT, 'Music-PDF', '_rename-manifest.json');
function readManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) return [];
  const records = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  if (!Array.isArray(records)) throw new Error('Manifest invalid: ' + MANIFEST_PATH);
  return records;
}
function saveManifest(records) {
  const temp = MANIFEST_PATH + '.tmp-' + process.pid;
  fs.writeFileSync(temp, JSON.stringify(records, null, 2) + '\n', {flag:'wx'});
  fs.renameSync(temp, MANIFEST_PATH);
}
async function confirmAction(prompt) {
  if (!process.stdin.isTTY) {
    console.error('Este necesar Terminal interactiv.');
    process.exitCode=2; return false;
  }
  const rl=readline.createInterface({input:process.stdin,output:process.stdout});
  let answer;
  try { answer=await new Promise(resolve=>rl.question(prompt,resolve)); }
  finally {rl.close();}
  return answer.trim()==='LIVE LOCAL';
}
async function renameOnly(plan, manifest) {
  const reserved=new Set();
  const eligible=[];
  for (const p of plan.filter(x=>!x.reason)) {
    const target=path.join(path.dirname(p.source),path.basename(p.target));
    if (target===p.source || fs.existsSync(target) || reserved.has(target)) {
      console.log('SKIP RENAME:',path.basename(p.source),'— nume identic sau destinatie ocupata');
      continue;
    }
    reserved.add(target);
    eligible.push({p,target});
  }
  console.log('\n========== PLAN RENAME ONLY ==========');
  for (const {p,target} of eligible) console.log('RENAME:',p.source,'=>',target);
  console.log('Redenumiri propuse:',eligible.length,'; fara mutare, fara Google Drive.');
  if (!eligible.length) return;
  if (!await confirmAction('Scrie exact LIVE LOCAL pentru redenumire: ')) {
    console.log('Anulat.'); return;
  }
  const logs=path.join(ROOT,'Processed','_logs');
  fs.mkdirSync(logs,{recursive:true});
  const logFile=path.join(logs,'rename-only-'+new Date().toISOString().replace(/[:.]/g,'-')+'.jsonl');
  let done=0, failed=0;
  for (const {p,target} of eligible) {
    try {
      if (!fs.existsSync(p.source) || fs.existsSync(target)) throw new Error('Sursa lipseste sau numele exista');
      const sha256=fingerprint(p.source);
      // Mutare atomica in acelasi director, fara suprascriere.
      fs.linkSync(p.source,target);
      try {fs.unlinkSync(p.source);}
      catch(e) {fs.unlinkSync(target);throw e;}
      const record={source:p.source,renamed:target,finalTarget:p.target,sha256,result:{...p.result,filename:path.basename(target)},time:new Date().toISOString()};
      manifest.push(record);
      saveManifest(manifest);
      fs.appendFileSync(logFile,JSON.stringify({status:'RENAMED',...record})+'\n');
      console.log('REDENUMIT:',path.basename(p.source),'=>',path.basename(target));
      done++;
    } catch(e) {
      failed++;
      fs.appendFileSync(logFile,JSON.stringify({status:'ERROR',source:p.source,target,error:e.message})+'\n');
      console.error('EROARE RENAME:',path.basename(p.source),e.message);
    }
  }
  console.log(`\nRENAME: ${done} reusite; ${failed} erori; jurnal: ${logFile}`);
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
    if (!target) {
      const rdest = r.destination;
      const checks = [];
      const prefix = r.access === 'Public' ? 'Byzantine Music/EnglishByzantineMusic/' : 'MyPrivateEnglishMusic/';
      const rel = rdest.startsWith(prefix) ? rdest.slice(prefix.length) : '';
      if (!rdest.startsWith(prefix)) checks.push('prefix destinatie');
      if (!rel.startsWith('Menaion/')) checks.push('categorie Menaion');
      if (/\[|\]|NECONFIRMAT|UNCONFIRMED|DE CONFIRMAT/i.test(rel)) checks.push('folder neconfirmat');
      if (!r.feast) checks.push('sarbatoare');
      if (r.sec.service === '?' || r.sec.section === 'Unknown' || r.sec.number === '??') checks.push('moment liturgic');
      if (r.ex.status !== 'PDFKit' && !filenameOnlyCanonConfirmed(r)) checks.push('extragere PDF: '+r.ex.status);
      if (/UNCONFIRMED|NECONFIRMAT|\?|\[|\]/i.test(r.proposed.replace(/-\?-/g, '-'))) checks.push('nume neconfirmat');
      if (/glory-at-the-aposticha-and-idiomelon-after-the-orthros-gospel/i.test(r.filename)) checks.push('PDF compus: verificare manuala');
      reason = 'clasificare/destinatie neconfirmata' + (checks.length ? ' [' + checks.join('; ') + ']' : ' [verificare suplimentara]');
    }
    else if (reserved.has(target)) reason = 'doua partituri propun acelasi nume';
    else if (fs.existsSync(target)) reason = 'destinatia exista deja';
    else if (!fs.existsSync(source)) reason = 'sursa lipseste';
    if (target) reserved.add(target);
    plan.push({source, target, reason, result:r});
  }
  return plan;
}
async function applyPlan(plan,manifest) {
  const eligible = plan.filter(p => !p.reason);
  if (!eligible.length) { console.log('Nicio mutare eligibila.'); return; }
  if (!process.stdin.isTTY) {
    console.error('LIVE necesita Terminal interactiv (nu redirectiona stdin).');
    process.exitCode = 2;
    return;
  }
  console.log('\nATENTIE: --apply va MUTA fisierele eligibile din Music-PDF in Processed.');
  console.log('Nu se modifica Google Drive. Fisierele neconfirmate raman in Inbox.');
  const rl = readline.createInterface({input: process.stdin, output: process.stdout});
  let confirmation;
  try {
    confirmation = await new Promise(resolve => {
      rl.question('Scrie exact LIVE LOCAL pentru confirmare: ', resolve);
      rl.once('close', () => resolve(''));
    });
  } finally {
    rl.close();
  }
  if (confirmation.trim() !== 'LIVE LOCAL') {
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
      if (p.fromManifest) {
        const idx=manifest.findIndex(m=>m.renamed===p.source);
        if (idx>=0) {manifest.splice(idx,1);saveManifest(manifest);}
      }
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
async function main() {
  console.log('\n========== BYZMUSIC — MUSIC LIVE LOCAL v6.2.12 (preview implicit) ==========');
  const apply = process.argv.includes('--apply');
  const rename = process.argv.includes('--rename-only');
  if (apply && rename) throw new Error('Alege numai --apply sau --rename-only');
  const manifest=readManifest();
  console.log(apply ? 'LIVE LOCAL cerut — mutare doar dupa confirmare.' : rename ? 'RENAME ONLY cerut — fara mutare.' : 'PREVIEW implicit — fara modificari.');
  console.log('Fara upload Google Drive.\n');
  const services=serviceDocuments();
  console.log('SERVICE-PDF:');
  if (!services.length) console.log('  Nu au fost gasite PDF-uri de slujba.');
  for (const s of services) console.log(`  ${s.name} | ${s.service||'?'} | ${s.feast||'feast neconfirmat'} | ${s.status}`);
  const results=[];
  for (const access of ['Public','Restricted']) {
    const dir=path.join(ROOT,'Music-PDF',access);
    if (!fs.existsSync(dir)) {console.log('Folder lipsa:',dir);continue;}
    const alreadyRenamed=new Set(manifest.map(m=>m.renamed));
    for (const name of fs.readdirSync(dir).filter(n=>/\.pdf$/i.test(n)).sort()) {
      if (alreadyRenamed.has(path.join(dir,name))) continue;
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
  // Fisiere redenumite anterior: folosim clasificarea validata in manifest,
  // nu incercam sa deducem din nou sarbatoarea din numele normalizat.
  for (const m of manifest) {
    if (!fs.existsSync(m.renamed)) continue;
    const original=plan.findIndex(p=>p.source===m.source);
    if (original>=0) plan.splice(original,1);
    const valid=path.dirname(m.renamed)===path.dirname(m.source) &&
      path.basename(m.renamed)===path.basename(m.finalTarget) &&
      fs.existsSync(m.renamed) && fingerprint(m.renamed)===m.sha256;
    plan.push({source:m.renamed,target:m.finalTarget,
      reason:valid ? (fs.existsSync(m.finalTarget)?'destinatia exista deja':'') : 'manifest/hash neconfirmat',
      result:m.result,fromManifest:true});
  }
  console.log('\n========== PLAN LIVE LOCAL ==========');
  for (const p of plan) console.log((p.reason ? 'SKIP' : 'READY') + ': ' + p.result.filename +
    (p.reason ? ' — ' + p.reason : ' => ' + p.target));
  console.log(`READY: ${plan.filter(p=>!p.reason).length}; SKIP: ${plan.filter(p=>p.reason).length}`);
  if (rename) await renameOnly(plan.filter(p=>!p.fromManifest),manifest);
  else if (apply) await applyPlan(plan,manifest);
  else console.log('PREVIEW ONLY — foloseste --apply pentru executare cu confirmare.\n');
}
main().catch(err => { console.error('EROARE FATALA:', err); process.exitCode = 1; });
