import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get('search');
  const nationality = request.nextUrl.searchParams.get('nationality');

  let sql = `
    SELECT d.driver_id, d.driver_ref, d.number, d.code,
           d.forename, d.surname, d.dob, d.nationality,
           d.headshot_url,
           COALESCE(s.total_races, 0) AS total_races,
           COALESCE(s.wins, 0)        AS wins,
           COALESCE(s.podiums, 0)     AS podiums,
           COALESCE(s.total_points, 0) AS total_points
    FROM drivers d
    LEFT JOIN (
      SELECT r.driver_id,
             COUNT(*)                                             AS total_races,
             SUM(CASE WHEN r.position = 1 THEN 1 ELSE 0 END)    AS wins,
             SUM(CASE WHEN r.position <= 3 THEN 1 ELSE 0 END)    AS podiums,
             SUM(r.points)                                        AS total_points
      FROM results r
      JOIN races ra ON r.race_id = ra.race_id
      WHERE ra.year >= 2010
      GROUP BY r.driver_id
    ) s ON d.driver_id = s.driver_id
    WHERE d.driver_id IN (
      SELECT DISTINCT r.driver_id FROM results r
      JOIN races ra ON r.race_id = ra.race_id
      WHERE ra.year >= 2010
    )
  `;
  const params: any[] = [];

  if (search) {
    params.push(`%${search}%`);
    sql += ` AND (d.forename ILIKE $${params.length} OR d.surname ILIKE $${params.length})`;
  }

  if (nationality) {
    params.push(nationality);
    sql += ` AND d.nationality = $${params.length}`;
  }

  sql += ' ORDER BY d.surname, d.forename';


  const rows = await query(sql, params);
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { driver_ref, number, code, forename, surname, dob, nationality } = body;

  const [{ next_id }] = await query('SELECT COALESCE(MAX(driver_id), 0) + 1 AS next_id FROM drivers');

  await query(
    `INSERT INTO drivers (driver_id, driver_ref, number, code, forename, surname, dob, nationality, url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '')`,
    [next_id, driver_ref || forename.toLowerCase(), number || null, code || null,
     forename, surname, dob || null, nationality || null]
  );

  return NextResponse.json({ driver_id: next_id }, { status: 201 });
}
