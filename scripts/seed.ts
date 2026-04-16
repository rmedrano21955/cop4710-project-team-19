import { readFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'csv-parse/sync';
import { Pool } from 'pg';

import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const DATA_DIR = join(__dirname, '..', 'data');

function readCSV(filename: string): Record<string, string>[] {
  const content = readFileSync(join(DATA_DIR, filename), 'utf-8');
  return parse(content, { columns: true, skip_empty_lines: true });
}

function clean(val: string): string | null {
  if (val === '\\N' || val === '' || val === undefined) return null;
  return val;
}

function toInt(val: string): number | null {
  const c = clean(val);
  if (c === null) return null;
  const n = parseInt(c, 10);
  return isNaN(n) ? null : n;
}

function toFloat(val: string): number | null {
  const c = clean(val);
  if (c === null) return null;
  const n = parseFloat(c);
  return isNaN(n) ? null : n;
}

async function batchInsert(
  table: string,
  columns: string[],
  rows: (string | number | null)[][]
) {
  const BATCH = 500;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const placeholders = batch.map((row, ri) =>
      '(' + row.map((_, ci) => `$${ri * row.length + ci + 1}`).join(',') + ')'
    ).join(',');
    const values = batch.flat();
    await pool.query(
      `INSERT INTO ${table} (${columns.join(',')}) VALUES ${placeholders}`,
      values
    );
  }
}

async function seedDrivers() {
  const rows = readCSV('drivers.csv');
  const data = rows.map(r => [
    toInt(r.driverId), clean(r.driverRef), clean(r.number), clean(r.code),
    clean(r.forename), clean(r.surname), clean(r.dob), clean(r.nationality),
    clean(r.url), null
  ]);
  await batchInsert('drivers', [
    'driver_id', 'driver_ref', 'number', 'code', 'forename', 'surname',
    'dob', 'nationality', 'url', 'headshot_url'
  ], data);
  console.log(`  drivers: ${data.length} rows`);
}

async function seedConstructors() {
  const rows = readCSV('constructors.csv');
  const data = rows.map(r => [
    toInt(r.constructorId), clean(r.constructorRef), clean(r.name),
    clean(r.nationality), clean(r.url)
  ]);
  await batchInsert('constructors', [
    'constructor_id', 'constructor_ref', 'name', 'nationality', 'url'
  ], data);
  console.log(`  constructors: ${data.length} rows`);
}

async function seedCircuits() {
  const rows = readCSV('circuits.csv');
  const data = rows.map(r => [
    toInt(r.circuitId), clean(r.circuitRef), clean(r.name),
    clean(r.location), clean(r.country), toFloat(r.lat), toFloat(r.lng),
    toInt(r.alt), clean(r.url)
  ]);
  await batchInsert('circuits', [
    'circuit_id', 'circuit_ref', 'name', 'location', 'country',
    'lat', 'lng', 'alt', 'url'
  ], data);
  console.log(`  circuits: ${data.length} rows`);
}

async function seedStatus() {
  const rows = readCSV('status.csv');
  const data = rows.map(r => [toInt(r.statusId), clean(r.status)]);
  await batchInsert('status', ['status_id', 'status'], data);
  console.log(`  status: ${data.length} rows`);
}

async function seedRaces(): Promise<Set<number>> {
  const rows = readCSV('races.csv');
  const filtered = rows.filter(r => parseInt(r.year, 10) >= 2010);
  const raceIds = new Set(filtered.map(r => parseInt(r.raceId, 10)));
  const data = filtered.map(r => [
    toInt(r.raceId), toInt(r.year), toInt(r.round), toInt(r.circuitId),
    clean(r.name), clean(r.date), clean(r.time), clean(r.url)
  ]);
  await batchInsert('races', [
    'race_id', 'year', 'round', 'circuit_id', 'name', 'date', 'time', 'url'
  ], data);
  console.log(`  races: ${data.length} rows (2010+)`);
  return raceIds;
}

async function seedResults(raceIds: Set<number>) {
  const rows = readCSV('results.csv');
  const filtered = rows.filter(r => raceIds.has(parseInt(r.raceId, 10)));
  const data = filtered.map(r => [
    toInt(r.resultId), toInt(r.raceId), toInt(r.driverId), toInt(r.constructorId),
    toInt(r.number), toInt(r.grid), toInt(r.position), clean(r.positionText),
    toInt(r.positionOrder), toFloat(r.points), toInt(r.laps), clean(r.time),
    toInt(r.milliseconds), toInt(r.fastestLap), toInt(r.rank),
    clean(r.fastestLapTime), clean(r.fastestLapSpeed), toInt(r.statusId)
  ]);
  await batchInsert('results', [
    'result_id', 'race_id', 'driver_id', 'constructor_id', 'number', 'grid',
    'position', 'position_text', 'position_order', 'points', 'laps', 'time',
    'milliseconds', 'fastest_lap', 'rank', 'fastest_lap_time',
    'fastest_lap_speed', 'status_id'
  ], data);
  console.log(`  results: ${data.length} rows`);
}

async function seedDriverStandings(raceIds: Set<number>) {
  const rows = readCSV('driver_standings.csv');
  const filtered = rows.filter(r => raceIds.has(parseInt(r.raceId, 10)));
  const data = filtered.map(r => [
    toInt(r.driverStandingsId), toInt(r.raceId), toInt(r.driverId),
    toFloat(r.points), toInt(r.position), clean(r.positionText), toInt(r.wins)
  ]);
  await batchInsert('driver_standings', [
    'driver_standing_id', 'race_id', 'driver_id', 'points', 'position',
    'position_text', 'wins'
  ], data);
  console.log(`  driver_standings: ${data.length} rows`);
}

async function seedConstructorStandings(raceIds: Set<number>) {
  const rows = readCSV('constructor_standings.csv');
  const filtered = rows.filter(r => raceIds.has(parseInt(r.raceId, 10)));
  const data = filtered.map(r => [
    toInt(r.constructorStandingsId), toInt(r.raceId), toInt(r.constructorId),
    toFloat(r.points), toInt(r.position), clean(r.positionText), toInt(r.wins)
  ]);
  await batchInsert('constructor_standings', [
    'constructor_standing_id', 'race_id', 'constructor_id', 'points',
    'position', 'position_text', 'wins'
  ], data);
  console.log(`  constructor_standings: ${data.length} rows`);
}

async function enrichHeadshots() {
  try {
    const res = await fetch('https://api.openf1.org/v1/drivers?session_key=latest');
    const drivers: any[] = await res.json();
    let count = 0;
    for (const d of drivers) {
      if (!d.headshot_url) continue;
      const result = await pool.query(
        `UPDATE drivers SET headshot_url = $1
         WHERE UPPER(code) = UPPER($2) OR (UPPER(forename) = UPPER($3) AND UPPER(surname) = UPPER($4))`,
        [d.headshot_url, d.name_acronym, d.first_name, d.last_name]
      );
      if (result.rowCount && result.rowCount > 0) count++;
    }
    console.log(`  headshots: updated ${count} drivers`);
  } catch (e) {
    console.log('  headshots: OpenF1 API unavailable, skipping');
  }
}

async function main() {
  console.log('Seeding PitWall database...\n');

  console.log('Importing reference tables...');
  await seedStatus();
  await seedDrivers();
  await seedConstructors();
  await seedCircuits();

  console.log('\nImporting race data (2010+)...');
  const raceIds = await seedRaces();
  await seedResults(raceIds);
  await seedDriverStandings(raceIds);
  await seedConstructorStandings(raceIds);

  console.log('\nEnriching driver headshots from OpenF1...');
  await enrichHeadshots();

  console.log('\nDone!');
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
