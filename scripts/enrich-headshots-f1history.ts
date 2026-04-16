import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function toSlug(forename: string, surname: string): string {
  const full = `${forename} ${surname}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9\s-]/g, '')   // keep letters, numbers, spaces, hyphens
    .trim()
    .replace(/\s+/g, '-');
  return full;
}

async function getF1HistoryImage(forename: string, surname: string): Promise<string | null> {
  const slug = toSlug(forename, surname);
  const url = `https://www.formulaonehistory.com/drivers/${slug}/`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PitWall/1.0)' },
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Extract primaryImageOfPage from JSON-LD schema
    const schemaMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
    if (schemaMatch) {
      for (const block of schemaMatch) {
        const json = block.replace(/<script[^>]*>/, '').replace('</script>', '');
        try {
          const data = JSON.parse(json);
          const objs = Array.isArray(data) ? data : [data];
          for (const obj of objs) {
            if (obj.primaryImageOfPage?.url) return obj.primaryImageOfPage.url;
            if (obj.image?.url) return obj.image.url;
            if (typeof obj.image === 'string' && obj.image.startsWith('http')) return obj.image;
          }
        } catch {}
      }
    }

    // Fallback: look for og:image meta tag
    const ogMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    if (ogMatch) return ogMatch[1];

    return null;
  } catch {
    return null;
  }
}

async function main() {
  // Update drivers that have Wikipedia images OR still have no image
  const drivers = await pool.query<{
    driver_id: number; forename: string; surname: string; headshot_url: string | null;
  }>(
    `SELECT driver_id, forename, surname, headshot_url FROM drivers
     WHERE driver_id IN (
       SELECT DISTINCT r.driver_id FROM results r
       JOIN races ra ON r.race_id = ra.race_id
       WHERE ra.year >= 2010
     )
     AND (headshot_url IS NULL OR headshot_url LIKE '%wikimedia%' OR headshot_url LIKE '%wikipedia%')
     ORDER BY surname`
  );

  console.log(`Fetching images for ${drivers.rows.length} drivers from formulaonehistory.com...\n`);

  let updated = 0;
  let failed: string[] = [];

  for (const d of drivers.rows) {
    // Small delay to be polite to the site
    await new Promise(r => setTimeout(r, 300));

    const imgUrl = await getF1HistoryImage(d.forename, d.surname);
    if (imgUrl) {
      await pool.query('UPDATE drivers SET headshot_url = $1 WHERE driver_id = $2', [imgUrl, d.driver_id]);
      console.log(`✓ ${d.forename} ${d.surname}`);
      updated++;
    } else {
      console.log(`✗ ${d.forename} ${d.surname} (slug: ${toSlug(d.forename, d.surname)})`);
      failed.push(`${d.forename} ${d.surname}`);
    }
  }

  console.log(`\nDone: ${updated} updated, ${failed.length} failed`);
  if (failed.length) console.log('Still missing:', failed.join(', '));
  await pool.end();
}

main().catch(console.error);
