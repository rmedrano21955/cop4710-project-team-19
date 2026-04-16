import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const rows = await query(
    `SELECT
      res.position_order AS position,
      res.position_text,
      d.forename || ' ' || d.surname AS driver_name,
      d.driver_id,
      c.name AS constructor_name,
      res.grid,
      res.points,
      res.fastest_lap_time,
      res.laps,
      s.status
    FROM results res
    JOIN drivers d ON res.driver_id = d.driver_id
    JOIN constructors c ON res.constructor_id = c.constructor_id
    JOIN status s ON res.status_id = s.status_id
    WHERE res.race_id = $1
    ORDER BY res.position_order ASC`,
    [parseInt(id)]
  );

  return NextResponse.json(rows);
}
