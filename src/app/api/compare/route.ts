import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const d1 = request.nextUrl.searchParams.get('d1');
  const d2 = request.nextUrl.searchParams.get('d2');
  const from = request.nextUrl.searchParams.get('from');
  const to = request.nextUrl.searchParams.get('to');

  if (!d1 || !d2 || !from || !to) {
    return NextResponse.json({ error: 'Missing parameters: d1, d2, from, to' }, { status: 400 });
  }

  const stats = await query(
    `SELECT
      r.driver_id,
      COUNT(*) AS races,
      SUM(CASE WHEN r.position = 1 THEN 1 ELSE 0 END) AS wins,
      SUM(CASE WHEN r.position <= 3 THEN 1 ELSE 0 END) AS podiums,
      SUM(r.points) AS total_points,
      SUM(CASE WHEN s.status != 'Finished' AND r.position IS NULL THEN 1 ELSE 0 END) AS dnfs,
      ROUND(AVG(r.grid), 1) AS avg_grid
    FROM results r
    JOIN races ra ON r.race_id = ra.race_id
    JOIN status s ON r.status_id = s.status_id
    WHERE r.driver_id IN ($1, $2)
      AND ra.year BETWEEN $3 AND $4
    GROUP BY r.driver_id`,
    [parseInt(d1), parseInt(d2), parseInt(from), parseInt(to)]
  );

  const cumulative = await query(
    `SELECT
      r.driver_id,
      ra.year,
      ra.round,
      ra.name AS race_name,
      r.points AS race_points,
      SUM(r.points) OVER (
        PARTITION BY r.driver_id
        ORDER BY ra.year, ra.round
      ) AS cumulative_points
    FROM results r
    JOIN races ra ON r.race_id = ra.race_id
    WHERE r.driver_id IN ($1, $2)
      AND ra.year BETWEEN $3 AND $4
    ORDER BY ra.year, ra.round, r.driver_id`,
    [parseInt(d1), parseInt(d2), parseInt(from), parseInt(to)]
  );

  return NextResponse.json({ stats, cumulative });
}
