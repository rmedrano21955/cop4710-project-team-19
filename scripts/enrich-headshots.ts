import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function removeDiacritics(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// For compound surnames (de la Rosa, van der Garde, d'Ambrosio etc),
// try the last word as the 3-letter surname key
function surKey(surname: string): string {
  const clean = removeDiacritics(surname).replace(/[^a-zA-Z ]/g, '').trim();
  const parts = clean.split(/\s+/);
  // Use last word if compound surname, otherwise first word
  const word = parts.length > 1 ? parts[parts.length - 1] : parts[0];
  return word.slice(0, 3).toLowerCase();
}

function foreKey(forename: string): string {
  const clean = removeDiacritics(forename).replace(/[^a-zA-Z]/g, '');
  return clean.slice(0, 3).toLowerCase();
}

function buildUrl(forename: string, surname: string): string {
  const fk = foreKey(forename);
  const sk = surKey(surname);
  const initial = removeDiacritics(forename)[0].toUpperCase();
  const folderCode = `${fk.toUpperCase()}${sk.toUpperCase()}01`;
  // Use original names in folder (spaces → underscores)
  const folderName = `${forename.replace(/ /g, '_')}_${surname.replace(/ /g, '_')}`;
  const fileName = `${fk}${sk}01`;
  return `https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/${initial}/${folderCode}_${folderName}/${fileName}.png.transform/1col/image.png`;
}

// Try alternate: use first word of compound surname
function buildUrlAlt(forename: string, surname: string): string {
  const fk = foreKey(forename);
  const clean = removeDiacritics(surname).replace(/[^a-zA-Z ]/g, '').trim();
  const firstWord = clean.split(/\s+/)[0].slice(0, 3).toLowerCase();
  const initial = removeDiacritics(forename)[0].toUpperCase();
  const folderCode = `${fk.toUpperCase()}${firstWord.toUpperCase()}01`;
  const folderName = `${forename.replace(/ /g, '_')}_${surname.replace(/ /g, '_')}`;
  const fileName = `${fk}${firstWord}01`;
  return `https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/${initial}/${folderCode}_${folderName}/${fileName}.png.transform/1col/image.png`;
}

const FALLBACK_SIZE = 702;

async function isRealImage(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    if (!res.ok) return false;
    const len = parseInt(res.headers.get('content-length') || '0');
    return len > FALLBACK_SIZE + 100;
  } catch {
    return false;
  }
}

async function getWikipediaImage(forename: string, surname: string): Promise<string | null> {
  const name = `${forename}_${surname}`.replace(/ /g, '_');
  // Try "Name racing driver" first, then plain name
  const candidates = [
    `${name}_racing_driver`,
    `${name}_Formula_One_driver`,
    name,
  ];
  for (const title of candidates) {
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&pithumbsize=300&format=json&redirects=1`;
      const res = await fetch(url, { headers: { 'User-Agent': 'PitWall/1.0' } });
      const data: any = await res.json();
      const pages = Object.values(data.query.pages) as any[];
      const page = pages[0];
      if (page && page.thumbnail?.source) {
        // Only use if it looks like a person photo (not a car/flag)
        const src: string = page.thumbnail.source;
        if (!src.includes('Flag_of') && !src.includes('Racing_car')) {
          return src;
        }
      }
    } catch { /* skip */ }
  }
  return null;
}

async function main() {
  const drivers = await pool.query<{ driver_id: number; forename: string; surname: string }>(
    `SELECT driver_id, forename, surname FROM drivers
     WHERE headshot_url IS NULL
       AND driver_id IN (
         SELECT DISTINCT r.driver_id FROM results r
         JOIN races ra ON r.race_id = ra.race_id
         WHERE ra.year >= 2010
       )
     ORDER BY surname`
  );

  let updated = 0;
  let failed: string[] = [];

  for (const d of drivers.rows) {
    const url1 = buildUrl(d.forename, d.surname);
    let finalUrl: string | null = null;

    if (await isRealImage(url1)) {
      finalUrl = url1;
    } else {
      const url2 = buildUrlAlt(d.forename, d.surname);
      if (url2 !== url1 && await isRealImage(url2)) {
        finalUrl = url2;
      }
    }

    if (!finalUrl) {
      finalUrl = await getWikipediaImage(d.forename, d.surname);
    }

    if (finalUrl) {
      await pool.query('UPDATE drivers SET headshot_url = $1 WHERE driver_id = $2', [finalUrl, d.driver_id]);
      console.log(`✓ ${d.forename} ${d.surname}`);
      updated++;
    } else {
      console.log(`✗ ${d.forename} ${d.surname} — not found`);
      failed.push(`${d.forename} ${d.surname}`);
    }
  }

  console.log(`\nDone: ${updated} updated, ${failed.length} failed`);
  if (failed.length) console.log('Failed:', failed.join(', '));
  await pool.end();
}

main().catch(console.error);
