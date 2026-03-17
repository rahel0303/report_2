import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { getSession } from '@/app/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { company_id, month_year, brand_ids } = await req.json();

  if (!company_id || !month_year || !Array.isArray(brand_ids)) {
    return NextResponse.json({ error: 'company_id, month_year, and brand_ids are required' }, { status: 400 });
  }

  if (!/^\d{2}-\d{4}$/.test(month_year)) {
    return NextResponse.json({ error: 'month_year must be MM-YYYY' }, { status: 400 });
  }

  // Delete all existing entries for this company + month, then insert new ones
  await query(
    `DELETE FROM l1_socmed.dim_brand_active_months WHERE company_id = $1 AND month_year = $2`,
    [company_id, month_year]
  );

  if (brand_ids.length > 0) {
    const values = brand_ids.map((_: number, i: number) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`).join(', ');
    const params = brand_ids.flatMap((id: number) => [company_id, id, month_year]);
    await query(
      `INSERT INTO l1_socmed.dim_brand_active_months (company_id, brand_id, month_year) VALUES ${values}`,
      params
    );
  }

  return NextResponse.json({ success: true, saved: brand_ids.length });
}
