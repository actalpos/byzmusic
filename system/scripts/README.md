# byzmusic — Etapa A: modularizare v1.4

Pachetul este bazat pe fișierul original `convert-service.js` v1.3.2 primit.
Nu include descărcarea de pe Antiochian (Etapa B).

## Instalare
Din directorul `system`, după un backup:

```bash
cp scripts/convert-service.js scripts/convert-service-v1.3.2-backup.js
```

Copiați conținutul folderului `scripts/` din arhivă în `system/scripts/`, **fără să ștergeți celelalte scripturi existente**, în special `create-google-drive-feast-folders.js`.

```bash
node --check scripts/convert-service.js
node --check scripts/service-pipeline.js
for f in scripts/service/*.js; do node --check "$f" || exit 1; done
npm run convert
```

Comanda `npm run convert` rămâne compatibilă. Scriptul Google Drive existent nu este modificat.

## Module
- `service-pipeline.js`: preview, confirmare, coordonare, raport
- `service/config.js`: căi și setări
- `service/dates.js`: dată liturgică și tip serviciu
- `service/titles.js`: extragere titlu din RTF
- `service/destinations.js`: directoare Service_Texts și conflicte
- `service/google-drive.js`: apelarea scriptului existent
- `service/process-rtf.js`: Word, LibreOffice, mutare, cleanup
- `service/html-assets.js`: CSS/JS bilingual/monolingual

Verificările de sintaxă și testele statice nu înlocuiesc o conversie reală pe macOS.
