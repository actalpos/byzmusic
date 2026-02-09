|--Service_Texts has:
    |--system
      |-- data
          |-- liturgical-service-file-list.json       <---- file holding the current summary of the /fixed and /movable html file names/path/display name, used by index.html to show the list
          |-- titleLink.json                          <---- file to hold the file google drive link and the Description. The Description is the HTML text that will be converted to hyperlink in realtime when opening the Html
          |-- divine_liturgy.json                     <---- file holding the Divine_Liturgy.html content
      |-- scripts
          |-- generate_divine_liturgy_html.js         <---- generate /template/divine_Liturgy.html from divine_liturgy.json
          |-- update-liturgical-service-file-list.js  <---- script to refresh the service_texts_summary after adding html files
	  |-- update-title-link.json                  <---- script to run the google script scan to scan the file description and to update the titleLink.json file
          |-- validate_service_texts_summary.js.      <---- script to vlidate after the above was run
          |-- copy_template.sh                        <---- copies /template/divine_Liturgy.html into the following low level folders:
    |--fixed  <-Folder for the fix-date feasts:
      |--01
        |-06
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
The app renders the Html file names found in the liturgical-service-file-list.json  for the selected month from
both the fix-date and for the movable date folders and index.html file render them chronologically at load time.

liturgical-service-file-list.json file format:
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

titleLink.json file format:
{
  "GREAT DOXOLOGY IN TONE ONE": {
    "url": "https://drive.google.com/file/d/1iNzEXnQHpdRtQQF3N_7rWXatJpYvKxQU/view?usp=drivesdk",
    "name": "BriefDoxology-1st-SA-EN.pdf",
    "description": "GREAT DOXOLOGY IN TONE ONE",
    "path": "EnglishByzantineMusic / Orthros / 16 Doxology"
  },
  "Holy is the Lord our God. (thrice)": {
    "url": "https://drive.google.com/file/d/1F_ffDckQzXcvA6rYIIxH_3JbooqgVDUH/view?usp=drivesdk",
    "name": "HolyIsTheLordOurGod-2nd-EN-AR.pdf",
    "description": "Holy is the Lord our God. (thrice)",
    "path": "EnglishByzantineMusic / Orthros / 11 Holy Is The Lord Our God"
  },
}

maintenance
------------

1. Adding a new feast date, respect the current folder naming convention.

2. Adding a new feast file, use the rtf billingual service file provided by the 
Antioch Archdiocese:
- edit it in Word and save it as docx 
- extend line spacing (and increase the English font size to 16 or 18px)
- open the docx with LibreOffice and save it as html
- edit and remove from table tag the "dir" and "width" should be 100%
- add the following 3 lines:

	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<link rel="stylesheet" href="../../../../../system/styles/layout-fixes.css">
	<script src="../../../../../system/scripts/layout-fixes-and-links.js" defer></script>	

- for the imported PDF's from SA and AA apply this script:
gs -sDEVICE=pdfimage24 -dSAFER -dBATCH -dNOPAUSE    -r300    -sOutputFile=out.pdf in.pdf
To avoid mobile device auto selection on touchscreen

- For the Divine Liturgy
- save it as html with the following naming convention: 
  If it is for the Divine Liturgy call it Divine_Liturgy_Variables.html

- save and check the links, the format and the responsiveness
- from Service_Texts/system/scripts run at the command line to update the service_texts_summary.json file:
  node Service_Texts/system/update_service_texts_summary.js
  node Service_Texts/system/validate_service_texts_summary.js

3. If one or more templates are required run from the command line:
  ./copy_template.sh

4. If one or more templates are updated run:
  ./copy_template.sh to update the template in all folders.  
   