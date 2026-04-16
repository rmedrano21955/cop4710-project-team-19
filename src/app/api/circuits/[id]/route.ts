import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const circuitId = parseInt(id);

  const [circuit] = await query(
    'SELECT circuit_id, name, location, country FROM circuits WHERE circuit_id = $1',
    [circuitId]
  );

  if (!circuit) {
    return NextResponse.json({ error: 'Circuit not found' }, { status: 404 });
  }

  const raceHistory = await query(
    `SELECT ra.year, ra.name AS race_name,
            d.forename || ' ' || d.surname AS winner
     FROM races ra
     LEFT JOIN results res ON ra.race_id = res.race_id AND res.position = 1
     LEFT JOIN drivers d ON res.driver_id = d.driver_id
     WHERE ra.circuit_id = $1
     ORDER BY ra.year DESC`,
    [circuitId]
  );

  return NextResponse.json({ ...circuit, race_history: raceHistory });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { name, location, country } = body;

  await query(
    'UPDATE circuits SET name=$1, location=$2, country=$3 WHERE circuit_id=$4',
    [name, location || null, country || null, parseInt(id)]
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cid = parseInt(id);

  const [ref] = await query('SELECT 1 FROM races WHERE circuit_id = $1 LIMIT 1', [cid]);
  if (ref) {
    return NextResponse.json(
      { error: 'Cannot delete circuit with existing races' },
      { status: 409 }
    );
  }

  await query('DELETE FROM circuits WHERE circuit_id = $1', [cid]);
  return NextResponse.json({ success: true });
}
