#!/bin/bash

cd "$(dirname "$0")"

TEMPLATE="../../template/Divine_Liturgy.html"

if [ ! -f "$TEMPLATE" ]; then
    echo "Template file not found: $TEMPLATE"
    exit 1
fi

copy_to_deepest() {
    BASE="$1"
    echo "Copying template to deepest folders in $BASE..."

    find "$BASE" -type d | while read dir; do
        # ignorăm folderele .fld
        if [[ "$(basename "$dir")" == *.fld ]]; then
            continue
        fi

        # găsim doar subfolderele reale, ignorând folderele .fld
        subfolders=$(find "$dir" -mindepth 1 -type d ! -name "*.fld")

        # dacă nu există subfoldere reale, folderul este final → copiem template
        if [ -z "$subfolders" ]; then
            echo "Copying to $dir"
            cp "$TEMPLATE" "$dir/"
        fi
    done
}

copy_to_deepest "../../fixed"
copy_to_deepest "../../movable"

echo "Done!"
