import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const rows = await query(
    `SELECT DISTINCT d.nationality
     FROM drivers d
     WHERE d.driver_id IN (SELECT DISTINCT driver_id FROM results)
       AND d.nationality IS NOT NULL
     ORDER BY d.nationality`
  );
  return NextResponse.json(rows.map(r => r.nationality));
}
