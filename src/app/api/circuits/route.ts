import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const rows = await query(
    `SELECT c.circuit_id, c.circuit_ref, c.name, c.location, c.country
     FROM circuits c
     WHERE c.circuit_id IN (SELECT DISTINCT circuit_id FROM races WHERE year >= 2010)
     ORDER BY c.name`
  );
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, location, country, circuit_ref } = body;

  const [{ next_id }] = await query('SELECT COALESCE(MAX(circuit_id), 0) + 1 AS next_id FROM circuits');

  await query(
    `INSERT INTO circuits (circuit_id, circuit_ref, name, location, country, url)
     VALUES ($1, $2, $3, $4, $5, '')`,
    [next_id, circuit_ref || name.toLowerCase().replace(/\s+/g, '_'), name, location || null, country || null]
  );

  return NextResponse.json({ circuit_id: next_id }, { status: 201 });
}
