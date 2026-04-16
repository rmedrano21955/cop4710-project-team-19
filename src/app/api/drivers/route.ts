import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get('search');
  const nationality = request.nextUrl.searchParams.get('nationality');

  let sql = `
    SELECT d.driver_id, d.driver_ref, d.number, d.code,
           d.forename, d.surname, d.dob, d.nationality,
           d.headshot_url
    FROM drivers d
    WHERE d.driver_id IN (SELECT DISTINCT driver_id FROM results)
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
