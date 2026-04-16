import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const season = request.nextUrl.searchParams.get('season');
  if (!season) {
    return NextResponse.json({ error: 'season parameter required' }, { status: 400 });
  }

  const rows = await query(
    `SELECT
      cs.position,
      c.constructor_id,
      c.name AS constructor_name,
      c.nationality,
      cs.points,
      cs.wins
    FROM constructor_standings cs
    JOIN constructors c ON cs.constructor_id = c.constructor_id
    WHERE cs.race_id = (
      SELECT race_id FROM races WHERE year = $1 ORDER BY round DESC LIMIT 1
    )
    ORDER BY cs.position ASC`,
    [parseInt(season)]
  );

  return NextResponse.json(rows);
}
