// Extras din convert-service.js v1.3.2; comportament păstrat.
import path from "node:path";
import { spawnSync } from "node:child_process";
import { feastScript } from "./config.js";

function runFeastFolders(feastFiles, apply) {
  // Un apel per sărbătoare, cu titlul deja verificat din VESP/ORTHROS.
  // Astfel nu re-extragem un titlu greșit din antete mobile.
  for (const { file, title } of feastFiles) {
    const args = [
      feastScript,
      file,
      "--title", title,
      ...(apply ? ["--apply"] : []),
    ];

    const result = spawnSync(process.execPath, args, {
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    });

    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);

    if (result.error || result.status !== 0 ||
        /\[EROARE\]/i.test((result.stdout || "") + (result.stderr || ""))) {
      throw new Error(
        `Google Drive a eșuat pentru ${path.basename(file)}: ` +
        (result.error?.message || `cod ${result.status}`)
      );
    }
  }
}


export { runFeastFolders };
