import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { getSession } from '@/app/lib/auth';

interface BrandRow {
  id: number;
  brand_name_identifier: string;
  brand_name_display: string;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const brands = await query<BrandRow>(
    `SELECT id, brand_name_identifier, brand_name_display
     FROM l1_socmed.dim_brands
     WHERE is_competitor = false
     ORDER BY brand_name_display ASC`
  );

  return NextResponse.json(brands);
}
