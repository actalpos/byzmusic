/*
 * BYZMUSIC — upload-processed-music.cjs
 * Versiune: 1.0.1 | Data: 2026-11-13
 * ISTORIC:
 * 1.0.1 — Permite doar cele două shortcuturi Google Drive confirmate,
 *         cu verificarea destinației reale; celelalte symlinkuri rămân blocate.
 * 1.0.0 — Copiere locală din Processed către Google Drive sincronizat,
 *         preview implicit, confirmare interactivă, fără suprascriere,
 *         verificare SHA-256, jurnal JSONL, fără ștergerea surselor.
 *
 * Din ~/Projects/byzmusic/system:
 *   node scripts/upload-processed-music.cjs
 *   node scripts/upload-processed-music.cjs --apply
 *   node scripts/upload-processed-music.cjs --drive-root "/cale/catre/My Drive"
 *   node scripts/upload-processed-music.cjs --apply --drive-root "/cale/catre/My Drive"
 *
 * IMPORTANT: copierea în folderul local Google Drive NU garantează că
 * sincronizarea cloud s-a încheiat. Verificați în Google Drive după rulare.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const readline = require('node:readline/promises');

const INBOX = path.join(os.homedir(), 'Documents', 'ByzMusic-Inbox');
const SOURCE_ROOT = path.join(INBOX, 'Processed');
const LOG_ROOT = path.join(SOURCE_ROOT, '_logs');
const TARGETS = {
  Public: ['Byzantine Music', 'EnglishByzantineMusic', 'Menaion'],
  Restricted: ['MyPrivateEnglishMusic', 'Menaion']
};
// Shortcuturile Google Drive confirmate explicit pentru acest cont.
const APPROVED_SHORTCUTS = {
  'Byzantine Music': {
    id: '1TfBVD9ixWOJ7asLIO6bQdCYj17inMc1G',
    name: 'Byzantine Music'
  },
  'MyPrivateEnglishMusic': {
    id: '1DPOxk0O4dowUKGiri9_NvpYXuHzQnip_',
    name: 'MyPrivateEnglishMusic'
  }
};
function allowedShortcut(link, drive) {
  const name = path.basename(link);
  const config = APPROVED_SHORTCUTS[name];
  if (!config || path.dirname(link) !== path.resolve(drive)) return false;
  if (!fs.lstatSync(link).isSymbolicLink()) return false;
  const cloudRoot = path.dirname(path.resolve(drive));
  const expected = path.join(cloudRoot, '.shortcut-targets-by-id', config.id, config.name);
  return fs.realpathSync(link) === fs.realpathSync(expected) &&
    fs.statSync(expected).isDirectory();
}
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const allowed = new Set(['--apply', '--drive-root']);
for (let i = 0; i < args.length; i++) {
  if (!allowed.has(args[i])) throw new Error('Argument necunoscut: ' + args[i]);
  if (args[i] === '--drive-root') {
    if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error('Lipsește calea după --drive-root');
    i++;
  }
}
function driveRoot() {
  const idx = args.indexOf('--drive-root');
  if (idx >= 0) return path.resolve(args[idx + 1]);
  const cloud = path.join(os.homedir(), 'Library', 'CloudStorage');
  if (!fs.existsSync(cloud)) throw new Error('Nu există ~/Library/CloudStorage. Folosește --drive-root.');
  const roots = fs.readdirSync(cloud).filter(n => n.startsWith('GoogleDrive'))
    .map(n => path.join(cloud, n, 'My Drive'))
    .filter(p => fs.existsSync(p) && fs.statSync(p).isDirectory());
  if (roots.length !== 1) throw new Error(`Au fost găsite ${roots.length} foldere My Drive. Specifică unul cu --drive-root.`);
  return roots[0];
}
function ensureDir(dir, label) {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory())
    throw new Error(`${label} lipsește: ${dir}`);
}
function walkPdf(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) out.push(...walkPdf(full, base));
    else if (entry.isFile() && /\.pdf$/i.test(entry.name))
      out.push({source:full, relative:path.relative(base, full)});
  }
  return out;
}
function sha256(file) {
  const hash = crypto.createHash('sha256');
  const fd = fs.openSync(file, 'r');
  try {
    const buffer = Buffer.allocUnsafe(1024 * 1024);
    let bytes;
    while ((bytes = fs.readSync(fd, buffer, 0, buffer.length, null)) > 0)
      hash.update(buffer.subarray(0, bytes));
  } finally { fs.closeSync(fd); }
  return hash.digest('hex');
}
function assertSafeTarget(root, relative) {
  const target = path.resolve(root, relative);
  if (!target.startsWith(path.resolve(root) + path.sep)) throw new Error('Destinație nesigură: ' + relative);
  let parent = path.dirname(target);
  while (parent.startsWith(path.resolve(root) + path.sep)) {
    if (fs.existsSync(parent) && fs.lstatSync(parent).isSymbolicLink())
      throw new Error('Folder destinație symlink: ' + parent);
    parent = path.dirname(parent);
  }
  return target;
}
function getPlan(drive) {
  const plan = [];
  for (const access of ['Public','Restricted']) {
    const sourceBase = path.join(SOURCE_ROOT, access, 'Menaion');
    const destBase = path.join(drive, ...TARGETS[access]);
    ensureDir(destBase, `Destinația ${access}/Menaion`);
    for (const item of walkPdf(sourceBase)) {
      const target = assertSafeTarget(destBase, item.relative);
      let status = 'COPY';
      if (fs.existsSync(target)) {
        if (!fs.statSync(target).isFile()) status = 'CONFLICT (nu este fișier)';
        else status = sha256(item.source) === sha256(target) ? 'EXISTS (identic)' : 'CONFLICT (conținut diferit)';
      }
      plan.push({...item, target, status, access});
    }
  }
  return plan;
}
function ensureNoSymlinkParents(target, drive) {
  let p = path.dirname(target);
  while (p.startsWith(path.resolve(drive) + path.sep)) {
    if (fs.existsSync(p) && fs.lstatSync(p).isSymbolicLink() &&
        !allowedShortcut(p, drive))
      throw new Error('Symlink neautorizat în destinație: ' + p);
    p = path.dirname(p);
  }
}
async function main() {
  const drive = driveRoot();
  ensureDir(drive, 'My Drive');
  console.log('BYZMUSIC — UPLOAD PROCESSED MUSIC v1.0.1');
  console.log('Mod:', apply ? 'APPLY solicitat (cu confirmare)' : 'PREVIEW — fără modificări');
  console.log('My Drive:', drive);
  const plan = getPlan(drive);
  for (const p of plan) console.log(`${p.status}: [${p.access}] ${p.relative} => ${p.target}`);
  const counts = {copy:plan.filter(p=>p.status==='COPY').length,
    identical:plan.filter(p=>p.status==='EXISTS (identic)').length,
    conflict:plan.filter(p=>p.status.startsWith('CONFLICT')).length};
  console.log(`\nTOTAL: ${plan.length}; COPY: ${counts.copy}; EXISTS: ${counts.identical}; CONFLICT: ${counts.conflict}`);
  if (!apply) { console.log('PREVIEW ONLY. Pentru copiere: --apply'); return; }
  if (!counts.copy) { console.log('Nu există fișiere noi de copiat.'); return; }
  if (!process.stdin.isTTY) throw new Error('Este necesar un Terminal interactiv.');
  const rl = readline.createInterface({input:process.stdin,output:process.stdout});
  let answer;
  try { answer = await rl.question('Scrie exact COPY DRIVE pentru confirmare: '); }
  finally { rl.close(); }
  if (answer.trim() !== 'COPY DRIVE') { console.log('Anulat.'); return; }
  fs.mkdirSync(LOG_ROOT, {recursive:true});
  const logFile = path.join(LOG_ROOT, 'upload-drive-' + new Date().toISOString().replace(/[:.]/g,'-') + '.jsonl');
  let copied = 0, errors = 0;
  for (const p of plan.filter(x=>x.status==='COPY')) {
    try {
      ensureNoSymlinkParents(p.target, drive);
      fs.mkdirSync(path.dirname(p.target), {recursive:true});
      ensureNoSymlinkParents(p.target, drive);
      // 'wx' refuză orice fișier deja existent: fără suprascriere.
      fs.copyFileSync(p.source, p.target, fs.constants.COPYFILE_EXCL);
      const sourceHash = sha256(p.source);
      const targetHash = sha256(p.target);
      if (sourceHash !== targetHash) throw new Error('Verificarea SHA-256 a eșuat');
      fs.appendFileSync(logFile, JSON.stringify({time:new Date().toISOString(),status:'COPIED',source:p.source,target:p.target,sha256:sourceHash})+'\n');
      console.log('COPIED:',p.relative);
      copied++;
    } catch(e) {
      errors++;
      fs.appendFileSync(logFile, JSON.stringify({time:new Date().toISOString(),status:'ERROR',source:p.source,target:p.target,error:e.message})+'\n');
      console.error('ERROR:',p.relative,'—',e.message);
    }
  }
  console.log(`\nCOPIED: ${copied}; ERRORS: ${errors}; jurnal: ${logFile}`);
  console.log('Verifică separat sincronizarea în interfața Google Drive.');
}
main().catch(e => {console.error('EROARE:',e.message);process.exitCode=1;});
