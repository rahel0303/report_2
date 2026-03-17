import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { getSession } from '@/app/lib/auth';

interface ActiveBrandRow {
  id: number;
  company_id: number | null;
  brand_id: number;
  month_year: string;
  brand_name_display: string;
  brand_name_identifier: string;
  company_name: string | null;
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('company_id');
  const monthYear = searchParams.get('month_year');

  let sql = `
    SELECT a.id, a.company_id, a.brand_id, a.month_year,
           b.brand_name_display, b.brand_name_identifier,
           c.name as company_name
    FROM l1_socmed.dim_brand_active_months a
    JOIN l1_socmed.dim_brands b ON b.id = a.brand_id
    LEFT JOIN public.companies c ON c.id = a.company_id
  `;
  const queryParams: unknown[] = [];
  const conditions: string[] = [];

  if (companyId) {
    queryParams.push(companyId);
    conditions.push(`a.company_id = $${queryParams.length}`);
  }

  if (monthYear) {
    queryParams.push(monthYear);
    conditions.push(`a.month_year = $${queryParams.length}`);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY a.month_year DESC, b.brand_name_display ASC';

  const rows = await query<ActiveBrandRow>(sql, queryParams);

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { company_id, brand_id, month_year } = body;

  if (!brand_id || !month_year) {
    return NextResponse.json({ error: 'brand_id and month_year are required' }, { status: 400 });
  }

  const monthYearRegex = /^\d{2}-\d{4}$/;
  if (!monthYearRegex.test(month_year)) {
    return NextResponse.json({ error: 'month_year must be in MM-YYYY format' }, { status: 400 });
  }

  const result = await query<{ id: number; company_id: number | null; brand_id: number; month_year: string }>(
    `INSERT INTO l1_socmed.dim_brand_active_months (company_id, brand_id, month_year)
     VALUES ($1, $2, $3)
     RETURNING id, company_id, brand_id, month_year`,
    [company_id || null, brand_id, month_year]
  );

  return NextResponse.json(result[0], { status: 201 });
}
