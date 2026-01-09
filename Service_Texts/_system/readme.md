# _system

This folder contains **system and maintenance files only**.  
It does **NOT** contain liturgical content and is **not intended for end users**.

Everything in this folder supports automation, validation, and long-term maintenance.

---

## Contents

### `generate-feasts.js`
Automatically generates `feasts.json` by scanning the liturgical content folders.

It detects and indexes:

- **Fixed-date feasts**  
- **Movable-date feasts**  

Rules:
- Any folder starting with `_` is ignored
- Only `.html` files are indexed
- Entries are sorted chronologically
- Service order is normalized (Divine Liturgy → Vespers → Orthros)

Run:
```bash
node Service_Texts/_system/generate-feasts.js
node Service_Texts/_system/validate-feasts.js