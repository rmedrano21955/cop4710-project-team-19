import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const constructorId = parseInt(id);

  const [constructor] = await query(
    'SELECT constructor_id, name, nationality FROM constructors WHERE constructor_id = $1',
    [constructorId]
  );

  if (!constructor) {
    return NextResponse.json({ error: 'Constructor not found' }, { status: 404 });
  }

  const drivers = await query(
    `SELECT DISTINCT d.driver_id, d.forename || ' ' || d.surname AS driver_name, d.nationality
     FROM results r
     JOIN drivers d ON r.driver_id = d.driver_id
     JOIN races ra ON r.race_id = ra.race_id
     WHERE r.constructor_id = $1 AND ra.year >= 2010
     ORDER BY driver_name`,
    [constructorId]
  );

  return NextResponse.json({ ...constructor, drivers });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { name, nationality } = body;

  await query(
    'UPDATE constructors SET name=$1, nationality=$2 WHERE constructor_id=$3',
    [name, nationality || null, parseInt(id)]
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cid = parseInt(id);

  const [ref] = await query('SELECT 1 FROM results WHERE constructor_id = $1 LIMIT 1', [cid]);
  if (ref) {
    return NextResponse.json(
      { error: 'Cannot delete constructor with existing race results' },
      { status: 409 }
    );
  }

  await query('DELETE FROM constructor_standings WHERE constructor_id = $1', [cid]);
  await query('DELETE FROM constructors WHERE constructor_id = $1', [cid]);
  return NextResponse.json({ success: true });
}
