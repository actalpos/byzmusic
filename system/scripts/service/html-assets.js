// Extras din convert-service.js v1.3.2; comportament păstrat.
import fs from "node:fs";

export function injectHtmlAssets(htmlPath, filename) {
      let html = fs.readFileSync(htmlPath, "utf8");

      const isBilingual = /\bbilingual\b/i.test(filename);
      const prefix = "/byzmusic/system/";
      const viewport =
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">';

      const styles = isBilingual
        ? ["layout-fixes.css"]
        : ["common.css", "bilingual.css", "monolingual.css"];

      const scripts = isBilingual
        ? ["layout-fixes-and-links.js"]
        : ["layout-fixes.js", "title-links.js"];

      // Eliminăm doar resursele gestionate de această conversie.
      html = html.replace(
        /<link\b(?=[^>]*\bhref\s*=\s*["']\/byzmusic\/system\/styles\/(?:layout-fixes|common|bilingual|monolingual)\.css["'])[^>]*>\s*/gi,
        ""
      );
      html = html.replace(
        /<script\b(?=[^>]*\bsrc\s*=\s*["']\/byzmusic\/system\/scripts\/(?:layout-fixes-and-links|layout-fixes|title-links)\.js["'])[^>]*>\s*<\/script>\s*/gi,
        ""
      );

      const includes = [];
      if (!/<meta\s+[^>]*name\s*=\s*["']viewport["']/i.test(html)) {
        includes.push(viewport);
      }
      for (const name of styles) {
        includes.push(
          `<link rel="stylesheet" href="${prefix}styles/${name}">`
        );
      }
      for (const name of scripts) {
        includes.push(
          `<script src="${prefix}scripts/${name}" defer></script>`
        );
      }

      if (!/<head\b[^>]*>/i.test(html)) {
        throw new Error("HTML fără element <head>.");
      }
      html = html.replace(
        /<head([^>]*)>/i,
        `<head$1>\n\t${includes.join("\n\t")}`
      );
      fs.writeFileSync(htmlPath, html, "utf8");
      console.log(
        `Configurare HTML ${isBilingual ? "bilingual" : "monolingual"}: viewport + CSS + JS`
      );
}


