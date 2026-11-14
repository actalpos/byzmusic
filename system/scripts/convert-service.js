// Compatibilitate: npm run convert / node scripts/convert-service.js

/**
 * ============================================================
 * convert-service.js
 * PROIECT: byzmusic
 * Versiune documentație: 1.1
 * Data: 2026-11-13
 *
 * MODIFICĂRI DOCUMENTAȚIE v1.1:
 * - Adăugată procedura de pornire a automatizării.
 * - Documentate directoarele de intrare și ieșire.
 * - Documentate verificările PREVIEW înainte de confirmare.
 * - Documentată ordinea etapelor RTF → HTML → PDF muzicale.
 *
 * ============================================================
 * PORNIRE
 * ============================================================
 *
 * Din Terminal:
 *
 *   cd ~/Projects/byzmusic/system
 *   node scripts/convert-service.js
 *
 * ============================================================
 * PREGĂTIREA FIȘIERELOR
 * ============================================================
 *
 * Copiază fișierele RTF în:
 *
 *   ~/Documents/ByzMusic-Inbox/RTF/
 *
 * Tipuri acceptate:
 *   VESP    - Great Vespers
 *   ORTHROS - Orthros
 *   READ    - Readings
 *   LITART  - Liturgy Artoclasia
 *   LITIA   - Litia
 *
 * Preferăm documentele bilingve când sunt disponibile.
 *
 * ============================================================
 * ETAPA 1 - PREVIEW
 * ============================================================
 *
 * Scriptul:
 *   1. Identifică fișierele RTF.
 *   2. Grupează documentele după data liturgică.
 *   3. Detectează anul și cere confirmarea lui.
 *   4. Identifică titlul sărbătorii.
 *   5. Afișează destinațiile Service_Texts.
 *   6. Afișează destinațiile Google Drive.
 *   7. Verifică fișierele HTML deja existente.
 *
 * Structura Service_Texts:
 *
 *   YYYY/MM MonthName/DD FeastTitle/
 *
 * EXEMPLU:
 *
 *   Service_Texts/2026/11 November/15 FeastTitle/
 *
 * La prima rulare:
 *   - Verifică atent toate destinațiile.
 *   - Nu confirma Y înainte de verificarea PREVIEW.
 *   - Folosește N pentru anulare.
 *
 * ============================================================
 * ETAPA 2 - EXECUȚIE DUPĂ CONFIRMAREA Y
 * ============================================================
 *
 * Scriptul:
 *   1. Pregătește directoarele Google Drive.
 *   2. Convertește RTF → DOCX folosind Microsoft Word.
 *   3. Convertește DOCX → HTML folosind LibreOffice.
 *   4. Inserează CSS și JavaScript în HTML.
 *   5. Creează directoarele Service_Texts necesare.
 *   6. Salvează HTML-urile în destinația finală.
 *   7. Marchează [SKIP] fișierele HTML deja existente.
 *   8. Curăță fișierele temporare conform regulilor
 *      implementate în service-pipeline.js.
 *
 * ============================================================
 * REGULI PENTRU DIRECTOARE
 * ============================================================
 *
 * - Directoarele istorice DD/ rămân nemodificate.
 * - Un director DD/ nu blochează crearea DD FeastTitle/.
 * - Un director DD FeastTitle/ existent este reutilizat.
 * - HTML-urile existente nu sunt suprascrise.
 * - Titlurile diferite pentru aceeași zi necesită
 *   verificare manuală.
 *
 * ============================================================
 * ETAPA 3 - PROCESAREA MUZICII
 * ============================================================
 *
 * După verificarea conversiei HTML:
 *
 * - Analizăm PDF-urile slujbelor.
 * - Procesăm PDF-urile cu partituri muzicale.
 * - Verificăm destinațiile Octoechos/Menaion.
 * - Verificăm indexul JSON și hyperlinkurile HTML.
 *
 * Această etapă NU este executată automat
 * de convert-service.js.
 *
 * ============================================================
 * LOGICĂ PĂSTRATĂ
 * ============================================================
 *
 * - SERVICE_ORDER pentru Vespers și Orthros.
 * - Momentele [PS50] și [PR].
 * - Selecția Octoechos/Menaion din hymn-selection.js.
 * - Confirmarea anului calendaristic.
 * - Protecția împotriva suprascrierii HTML.
 *
 * ============================================================
 */

import "./service-pipeline.js";
