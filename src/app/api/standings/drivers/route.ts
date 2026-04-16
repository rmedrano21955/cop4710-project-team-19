import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const season = request.nextUrl.searchParams.get('season');
  if (!season) {
    return NextResponse.json({ error: 'season parameter required' }, { status: 400 });
  }

  const rows = await query(
    `SELECT
      ds.position,
      d.driver_id,
      d.forename || ' ' || d.surname AS driver_name,
      d.nationality,
      ds.points,
      ds.wins
    FROM driver_standings ds
    JOIN drivers d ON ds.driver_id = d.driver_id
    WHERE ds.race_id = (
      SELECT race_id FROM races WHERE year = $1 ORDER BY round DESC LIMIT 1
    )
    ORDER BY ds.position ASC`,
    [parseInt(season)]
  );

  return NextResponse.json(rows);
}
