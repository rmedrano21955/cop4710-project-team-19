import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const driverId = parseInt(id);

  const [driver] = await query(
    `SELECT driver_id, driver_ref, number, code, forename, surname,
            dob, nationality, headshot_url
     FROM drivers WHERE driver_id = $1`,
    [driverId]
  );

  if (!driver) {
    return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
  }

  const [stats] = await query(
    `SELECT
      COUNT(*) AS total_races,
      SUM(CASE WHEN r.position = 1 THEN 1 ELSE 0 END) AS wins,
      SUM(CASE WHEN r.position <= 3 THEN 1 ELSE 0 END) AS podiums,
      SUM(r.points) AS total_points
    FROM results r
    WHERE r.driver_id = $1`,
    [driverId]
  );

  return NextResponse.json({ ...driver, stats });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { forename, surname, number, code, dob, nationality } = body;

  await query(
    `UPDATE drivers SET forename=$1, surname=$2, number=$3, code=$4, dob=$5, nationality=$6
     WHERE driver_id=$7`,
    [forename, surname, number || null, code || null, dob || null, nationality || null, parseInt(id)]
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const driverId = parseInt(id);

  const [ref] = await query(
    'SELECT 1 FROM results WHERE driver_id = $1 LIMIT 1',
    [driverId]
  );

  if (ref) {
    return NextResponse.json(
      { error: 'Cannot delete driver with existing race results' },
      { status: 409 }
    );
  }

  await query('DELETE FROM driver_standings WHERE driver_id = $1', [driverId]);
  await query('DELETE FROM drivers WHERE driver_id = $1', [driverId]);
  return NextResponse.json({ success: true });
}
