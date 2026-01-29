|--Service_Texts has:
    |--system
      |-- data
          |-- service_texts_summary.json              <---- file holding the current summary of the /fixed and /movable html file names/path/display name
          |-- divine_liturgy.json                     <---- file holding the Divine_Liturgy.html content
      |-- scripts
          |-- generate_divine_liturgy_html.js         <---- generate /template/divine_Liturgy.html from divine_liturgy.json
          |-- refresh_service_texts_summary.js        <---- script to refresh the service_texts_summary after adding html files
          |-- validate_service_texts_summary.js.      <---- script to vlidate after the above was run
          |-- copy_template.sh                        <---- copies /template/divine_Liturgy.html into the following low level folders:
    |--fixed  <-Folder for the fix-date feasts:
      |--01
        |-06
          Divine_Liturgy.html
          Divine_Liturgy_Variables.html 
          Vespers.html
          Orthros.html               
        |-07
        |-30
      |--02
      |--03
      ....
      |--12

    
    |--movable.  <-Folders for the movable date feasts
      |--2026
        |--01
          |--04
          |--11
            Divine_Liturgy.html
            Divine_Liturgy_Variables.html
            Vespers.html
            Orthros.html
          |--18
          |--25
      |--2026
        |--02
      .....
      |--2026
        |--12

  |--template
    Divine_Liturgy.html

The front end index.html will ask the userr to select a month
The app renders the Html file names found in the service_texts_summary.json for the selected month from
both the fix-date and for the movable date folders and index.html file render them cronologically at load time.

This is the file format:
[
  {
    "date": "2026-01-06",
    "type": "fixed",
    "title": "Divine Liturgy",
    "file": "Service_Texts/fixed/01/06/Divine_Liturgy.html"
  },
  {
    "date": "2026-01-06",
    "type": "fixed",
    "title": "Vespers",
    "file": "Service_Texts/fixed/01/06/Vespers.html"
  },
  {
    "date": "2026-01-11",
    "type": "movable",
    "title": "Divine Liturgy",
    "file": "Service_Texts/movable/2026/01/11/Divine_Liturgy.html"
  }
]


maintenance
------------

1. Adding a new feast date, respect the current folder naming convention.

2. Adding a new feast file, use the rtf billingual service file provided by the 
Antioch Archdiocese:
- edit it in Word and save it as docx 
- extend line spacing (and increase the English font size to 16 or 18px)
- open the docx with LibreOffice and save it as html
- save it as html with the following naming convention: 
  If it is for the Divine Liturgy call it Divine_Liturgy_Variables.html
- edit and add the following to it:
Pentru local test
<link rel="stylesheet" href="../../../../../system/styles/layout-fixes.css">
<script src="./../../../../../system/scripts/layout-fixes-and-links.js" defer></script>

Pt web:
<link rel="stylesheet" href="/byzmusic/system/styles/layout-fixes.css">
<script src="/byzmusic/system/scripts/layout-fixes-and-links.js" defer></script>
- save and check the links, the format and the responsiveness
- from Service_Texts/system/scripts run at the command line to update the service_texts_summary.json file:
  node Service_Texts/system/update_service_texts_summary.js
  node Service_Texts/system/validate_service_texts_summary.js

3. If one or more templates are required run from the command line:
  ./copy_template.sh

4. If one or more templates are updated run:
  ./copy_template.sh to update the template in all folders.  
   