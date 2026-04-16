import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const rows = await query(
    `SELECT c.constructor_id, c.constructor_ref, c.name, c.nationality,
            COUNT(DISTINCT r.driver_id) AS driver_count
     FROM constructors c
     JOIN results r ON c.constructor_id = r.constructor_id
     GROUP BY c.constructor_id, c.constructor_ref, c.name, c.nationality
     ORDER BY c.name`
  );
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, nationality, constructor_ref } = body;

  const [{ next_id }] = await query('SELECT COALESCE(MAX(constructor_id), 0) + 1 AS next_id FROM constructors');

  await query(
    `INSERT INTO constructors (constructor_id, constructor_ref, name, nationality, url)
     VALUES ($1, $2, $3, $4, '')`,
    [next_id, constructor_ref || name.toLowerCase().replace(/\s+/g, '_'), name, nationality || null]
  );

  return NextResponse.json({ constructor_id: next_id }, { status: 201 });
}
