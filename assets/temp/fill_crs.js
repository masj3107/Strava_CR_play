// fill_crs.js
const fetch = require('node-fetch');
const fs    = require('fs').promises;

// === CONFIG ===
const INPUT_FILE  = 'crs.json';  
const OUTPUT_FILE = 'crs_complete.json';
const ACCESS_TOKEN = '85e4d4e556c23e7f24524688916ec0b125b5e430';
// =============

async function fetchSegment(id) {
  const res = await fetch(`https://www.strava.com/api/v3/segments/${id}`, {
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
  });
  if (!res.ok) throw new Error(`Segment ${id} error: ${res.status}`);
  return res.json();
}

(async () => {
  const raw = await fs.readFile(INPUT_FILE, 'utf8');
  const crs = JSON.parse(raw);

  for (let i = 0; i < crs.length; i++) {
    const seg = crs[i];
    // extract the numeric ID from the URL
    const id = seg.link.match(/\/segments\/(\d+)/)[1];
    console.log(`Fetching segment ${id} (${i+1}/${crs.length})…`);
    try {
      const data = await fetchSegment(id);
      seg.polyline      = data.map ? data.map.polyline || "" : "";
      seg.effort_count  = data.effort_count  || 0;
      seg.athlete_count = data.athlete_count || 0;
    } catch (e) {
      console.error(e.message);
      // leave blanks on error
    }
    // avoid rate-limit
    await new Promise(r => setTimeout(r, 500));
  }

  await fs.writeFile(OUTPUT_FILE, JSON.stringify(crs, null, 2), 'utf8');
  console.log(`Done! Wrote ${crs.length} records to ${OUTPUT_FILE}`);
})();
