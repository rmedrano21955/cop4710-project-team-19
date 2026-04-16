import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const rows = await query('SELECT DISTINCT year FROM races ORDER BY year DESC');
  return NextResponse.json(rows.map(r => r.year));
}
