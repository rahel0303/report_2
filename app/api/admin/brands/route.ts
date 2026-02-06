import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { getSession } from '@/app/lib/auth';

interface Brand {
  id: number;
  company_id: number;
  agency_id: number | null;
  created_at: string;
  updated_at: string;
  company_name?: string;
  agency_name?: string;
}

interface BrandWithCompetitors extends Brand {
  competitors: {
    id: number;
    competitor_company_id: number;
    competitor_name: string;
  }[];
}

async function checkAdmin() {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized', status: 401 };
  if (session.role !== 'admin') return { error: 'Forbidden', status: 403 };
  return { session };
}

// GET - List all brands with competitors
export async function GET() {
  const auth = await checkAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const brands = await query<Brand>(
      `SELECT b.id, b.company_id, b.agency_id, b.created_at, b.updated_at,
              c.name as company_name, a.name as agency_name
       FROM brands b
       LEFT JOIN companies c ON b.company_id = c.id
       LEFT JOIN agencies a ON b.agency_id = a.id
       ORDER BY c.name ASC`,
    );

    // Get competitors for each brand
    const brandsWithCompetitors: BrandWithCompetitors[] = await Promise.all(
      brands.map(async (brand) => {
        const competitors = await query<{
          id: number;
          competitor_company_id: number;
          competitor_name: string;
        }>(
          `SELECT bc.id, bc.competitor_company_id, c.name as competitor_name
           FROM brand_competitors bc
           LEFT JOIN companies c ON bc.competitor_company_id = c.id
           WHERE bc.brand_id = $1`,
          [brand.id],
        );
        return { ...brand, competitors };
      }),
    );

    return NextResponse.json(brandsWithCompetitors);
  } catch (error) {
    console.error('Get brands error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - Create new brand
export async function POST(request: NextRequest) {
  const auth = await checkAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { company_id, agency_id } = body;

    if (!company_id) {
      return NextResponse.json({ error: 'Company ID wajib diisi' }, { status: 400 });
    }

    const result = await query<Brand>(
      `INSERT INTO brands (company_id, agency_id)
       VALUES ($1, $2)
       RETURNING *`,
      [company_id, agency_id || null],
    );

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Create brand error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
