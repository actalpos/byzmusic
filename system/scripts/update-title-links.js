import fs from "fs";

const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxS5v-OPh_RskElPyTZMNPcwpO4jz_EtYYcMkt1I99neeeH1Dc2bYtmmlf19TA_8g6LqQ/exec";
const LOCAL_PATH = "../data/titleLink.json";

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
