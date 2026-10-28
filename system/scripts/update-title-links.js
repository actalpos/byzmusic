import fs from "fs";

const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbx6DzS18h_GbBbN36Ga3bnmns7vm_XtOYL8px9P2Cc1JELgxPGK3mrIMVIioVHUmRv7NQ/exec";
const LOCAL_PATH = "./data/titleLink.json";

async function update() {
  console.log("🔄 Generating JSON from Drive...");

  const res = await fetch(`${WEBAPP_URL}?action=generate`);
  const data = await res.json();

  if (!data.fileId || !data.content) {
    throw new Error("Invalid response from Apps Script");
  }

  // Save locally
  fs.writeFileSync(LOCAL_PATH, data.content, "utf-8");
  console.log("✅ Saved locally:", LOCAL_PATH);

  // Delete remote
  console.log("🗑 Deleting temporary file from Drive...");
  await fetch(`${WEBAPP_URL}?action=delete&fileId=${data.fileId}`);

  console.log("✅ Deleted from Drive.");
}

update().catch(console.error);
