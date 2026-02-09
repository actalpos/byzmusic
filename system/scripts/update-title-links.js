import fs from 'fs';
import { fileURLToPath } from 'url';

// fetch e nativ, nu mai trebuie node-fetch
const url = 'https://script.google.com/macros/s/AKfycbxUp15FYtpt4FlI8B7LLKJeOil0AHaaW5S173rfwI-xuptZF8kVIQ3729Nnb9bdeKei/exec';
const localPath = '../data/titleLink.json';

async function updateTitleLink() {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  const json = await res.text();
  fs.writeFileSync(localPath, json, 'utf-8');
  console.log(`✅ titleLink.json updated at ${localPath}`);
}

updateTitleLink().catch(console.error);
