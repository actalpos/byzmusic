import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../../Service_Texts');
const out=path.resolve(here,'../data/liturgical-service-file-list.json');
const entries=[];
const order=['Divine_Liturgy','Vespers','Orthros'];
const folders=(dir)=>fs.existsSync(dir)?fs.readdirSync(dir,{withFileTypes:true}).filter(x=>x.isDirectory()).map(x=>x.name):[];
for (const year of folders(root)) {
  if (!/^\d{4}$/.test(year)) continue;
  for (const monthFolder of folders(path.join(root,year))) {
    const m=monthFolder.match(/^(0[1-9]|1[0-2]) [A-Za-z]+$/);
    if (!m) throw new Error(`Lună invalidă: ${monthFolder}`);
    for (const dayFolder of folders(path.join(root,year,monthFolder))) {
      const d=dayFolder.match(/^(0[1-9]|[12]\d|3[01])(?: .+)?$/);
      if (!d) throw new Error(`Zi invalidă: ${dayFolder}`);
      const date=`${year}-${m[1]}-${d[1]}`;
      const parsed=new Date(`${date}T00:00:00Z`);
      if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0,10)!==date) throw new Error(`Dată invalidă: ${date}`);
      const dir=path.join(root,year,monthFolder,dayFolder);
      for (const file of fs.readdirSync(dir).filter(x=>/\.html$/i.test(x))) {
        const relative=path.relative(root,path.join(dir,file)).split(path.sep).join('/');
        entries.push({date,title:file.replace(/\.html$/i,'').replaceAll('_',' '),order:order.findIndex(s=>file.startsWith(s)),file:`Service_Texts/${relative}`});
      }
    }
  }
}
entries.sort((a,b)=>a.date.localeCompare(b.date)||a.order-b.order||a.file.localeCompare(b.file));
fs.mkdirSync(path.dirname(out),{recursive:true});
const temp=out+'.tmp';
fs.writeFileSync(temp,JSON.stringify(entries,null,2));
fs.renameSync(temp,out);
console.log(`JSON generat: ${entries.length} intrări`);
