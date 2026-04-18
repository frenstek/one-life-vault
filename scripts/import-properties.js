import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// ─── Config ─────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://YOUR_PROJECT_REF.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'YOUR_SERVICE_ROLE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Parse address into components ──────────────────────────────────────────
function parseAddress(rawAddress) {
  if (!rawAddress) return {};
  const addr = rawAddress.trim();

  // Try to extract postcode (4 digits at end)
  const postcodeMatch = addr.match(/\b(\d{4})\s*$/);
  const postcode = postcodeMatch ? postcodeMatch[1] : null;

  // State detection
  let state = null;
  if (/\bVIC\b/i.test(addr) || /\bVic\b/.test(addr)) state = 'VIC';
  else if (/\bSA\b/i.test(addr)) state = 'SA';
  else if (/\bTAS\b/i.test(addr)) state = 'TAS';
  else if (/\bQLD\b/i.test(addr)) state = 'QLD';
  else if (/\bNSW\b/i.test(addr)) state = 'NSW';

  // Try to extract suburb - usually the second-to-last part before postcode
  // e.g. "8 Sparland Street, Manor Lakes 3024" -> suburb = "Manor Lakes"
  let suburb = null;
  const cleaned = addr.replace(/\s*\d{4}\s*$/, '').replace(/\s*(VIC|SA|TAS|QLD|NSW)\s*/gi, '').trim();
  // Split by comma or last words before postcode
  const parts = cleaned.split(',').map(s => s.trim());
  if (parts.length >= 2) {
    suburb = parts[parts.length - 1];
  } else {
    // Try to get last 2 words as suburb
    const words = cleaned.split(/\s+/);
    if (words.length >= 4) {
      // Check if last two words could be suburb (not a number, not "Street" etc)
      const streetTypes = ['Street','St','Road','Rd','Drive','Dr','Avenue','Ave','Boulevard','Blvd','Circuit','Crt','Court','Ct','Place','Pl','Crescent','Cres','Way','Grove','Loop','Close','Parade','Lane','Terrace','Tce'];
      let suburbStart = words.length;
      for (let i = words.length - 1; i >= 0; i--) {
        if (streetTypes.some(st => words[i].toLowerCase() === st.toLowerCase())) {
          suburbStart = i + 1;
          break;
        }
      }
      if (suburbStart < words.length) {
        suburb = words.slice(suburbStart).join(' ');
      }
    }
  }

  return { postcode, state, suburb };
}

// ─── Parse bed count ────────────────────────────────────────────────────────
function parseBedrooms(bedStr) {
  if (!bedStr) return null;
  const s = String(bedStr).trim();
  // "2+OOA" -> 2, "3+OOA" -> 3, "6x2 +OOA" -> 12
  const match = s.match(/^(\d+)\s*\+/);
  if (match) return parseInt(match[1], 10);
  const match2 = s.match(/^(\d+)x(\d+)/);
  if (match2) return parseInt(match2[1], 10) * parseInt(match2[2], 10);
  const match3 = s.match(/^(\d+)/);
  if (match3) return parseInt(match3[1], 10);
  return null;
}

// ─── Map SDA category ───────────────────────────────────────────────────────
function mapPropertyType(sdaStr) {
  if (!sdaStr) return 'SDA';
  const s = String(sdaStr).trim().toUpperCase();
  if (s.includes('HPS') && s.includes('R')) return 'SDA';  // HPS + R
  if (s.includes('HPS')) return 'SDA';
  if (s.includes('ROBUST') || s === 'R') return 'SDA';
  if (s.includes('IL')) return 'SDA';
  if (s.includes('FA')) return 'SDA';
  return 'SDA';
}

function mapSdaCategory(sdaStr) {
  if (!sdaStr) return null;
  const s = String(sdaStr).trim().toUpperCase();
  if (s.includes('HPS') && s.includes('R')) return 'High Physical Support + Robust';
  if (s.includes('HPS')) return 'High Physical Support';
  if (s.includes('ROBUST') || s === 'R') return 'Robust';
  if (s.includes('IL')) return 'Improved Liveability';
  if (s.includes('FA')) return 'Fully Accessible';
  return s;
}

// ─── Map status ─────────────────────────────────────────────────────────────
function mapStatus(statusStr) {
  if (!statusStr) return 'active';
  const s = String(statusStr).trim().toUpperCase();
  if (s.includes('AVAILABLE')) return 'active';
  if (s.includes('TENANTED') || s.includes('RESERVED')) return 'active';
  if (s.includes('ON HOLD')) return 'inactive';
  if (s.includes('UNDER CONSTRUCTION') || s.includes('CONSTRUCTION')) return 'maintenance';
  return 'active';
}

// ─── Build features from spreadsheet data ───────────────────────────────────
function buildFeatures(row) {
  const features = [];
  // All SDA HPS properties typically have these
  features.push('Fully accessible bathroom');
  features.push('Wheelchair ramp');
  features.push('Wide doorways');
  features.push('Air conditioning');
  features.push('Emergency call system');

  const ensuites = String(row.ensuites || '').trim().toUpperCase();
  if (ensuites === 'YES') features.push('Individual ensuites');

  const breakout = String(row.breakoutRoom || '').trim().toUpperCase();
  if (breakout === 'YES') features.push('Activity room');

  const sda = String(row.sda || '').toUpperCase();
  if (sda.includes('HPS')) {
    features.push('Ceiling hoists');
    features.push('Assistive technology ready');
  }

  features.push('Secure fencing');
  features.push('Garden/outdoor area');
  features.push('Vehicle parking');

  return features;
}

// ─── Main import ────────────────────────────────────────────────────────────
async function importProperties() {
  // We'll use openpyxl via a pre-parsed JSON approach
  // First, check existing properties to avoid duplicates
  const { data: existing, error: fetchErr } = await supabase
    .from('properties')
    .select('name, address');

  if (fetchErr) {
    console.error('Failed to fetch existing properties:', fetchErr.message);
    return;
  }

  const existingAddresses = new Set(
    (existing || []).map(p => (p.address || '').toLowerCase().replace(/\s+/g, ' ').trim())
  );

  console.log(`Found ${existingAddresses.size} existing properties in database`);

  // Read the pre-parsed JSON data
  const rawData = readFileSync('./scripts/properties-data.json', 'utf8');
  const properties = JSON.parse(rawData);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const prop of properties) {
    const addressKey = (prop.address || '').toLowerCase().replace(/\s+/g, ' ').trim();

    if (existingAddresses.has(addressKey)) {
      console.log(`  SKIP (exists): ${prop.address}`);
      skipped++;
      continue;
    }

    const parsed = parseAddress(prop.address);
    const bedrooms = parseBedrooms(prop.bedrooms);
    const sdaCategory = mapSdaCategory(prop.sda);
    const features = buildFeatures(prop);

    // Create property name from address
    // e.g. "8 Sparland Street, Manor Lakes 3024" -> "Sparland, Manor Lakes"
    const streetName = (prop.address || '').replace(/^\d+\s*/, '').split(',')[0].split(/\s+\d{4}/)[0].trim();
    const streetWord = streetName.split(/\s+/)[0]; // First word of street name
    const suburb = parsed.suburb || prop.region || '';
    const name = suburb ? `${streetWord}, ${suburb}` : streetWord;

    const insertData = {
      name: name,
      address: (prop.address || '').trim(),
      suburb: parsed.suburb || null,
      state: prop.state || parsed.state || null,
      postcode: parsed.postcode || null,
      property_type: 'SDA',
      capacity: bedrooms || 2,
      status: mapStatus(prop.status),
      notes: [
        prop.region ? `Region: ${prop.region}` : '',
        prop.estate ? `Estate: ${prop.estate}` : '',
        prop.floorPlan ? `Floor Plan: ${prop.floorPlan}` : '',
        prop.facade ? `Facade: ${prop.facade}` : '',
        prop.lot ? `Lot: ${prop.lot}` : '',
        prop.sda ? `SDA Category: ${prop.sda}` : '',
        prop.completionDate ? `Completion: ${prop.completionDate}` : '',
      ].filter(Boolean).join('\n'),
    };

    const { data: created, error: createErr } = await supabase
      .from('properties')
      .insert(insertData)
      .select()
      .single();

    if (createErr) {
      console.error(`  ERROR: ${prop.address} — ${createErr.message}`);
      errors++;
      continue;
    }

    // Update extra fields (bedrooms, bathrooms, features, description, sda_category)
    const updateData = {
      bedrooms: bedrooms,
      bathrooms: bedrooms, // Usually 1 ensuite per bedroom in SDA
      features: features,
      description: `${sdaCategory || 'SDA'} property in ${suburb || 'the area'}. ${prop.floorPlan ? `${prop.floorPlan} floor plan` : ''} with ${bedrooms || 2} bedrooms and ensuites. ${prop.breakoutRoom === 'YES' ? 'Includes a breakout/activity room.' : ''}`.trim(),
    };

    const { error: updateErr } = await supabase
      .from('properties')
      .update(updateData)
      .eq('id', created.id);

    if (updateErr) {
      console.warn(`  WARN: Created but failed to update details for ${prop.address}: ${updateErr.message}`);
    }

    console.log(`  OK: ${name} (${prop.address})`);
    imported++;
    existingAddresses.add(addressKey);
  }

  console.log(`\nDone! Imported: ${imported}, Skipped: ${skipped}, Errors: ${errors}`);
}

importProperties().catch(console.error);
