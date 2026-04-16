import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const season = request.nextUrl.searchParams.get('season');
  if (!season) {
    return NextResponse.json({ error: 'season parameter required' }, { status: 400 });
  }

  const rows = await query(
    `SELECT r.race_id, r.year, r.round, r.name, r.date,
            c.name AS circuit_name, c.country
     FROM races r
     JOIN circuits c ON r.circuit_id = c.circuit_id
     WHERE r.year = $1
     ORDER BY r.round`,
    [parseInt(season)]
  );

  return NextResponse.json(rows);
}
