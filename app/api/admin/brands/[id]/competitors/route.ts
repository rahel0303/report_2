import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { getSession } from '@/app/lib/auth';

interface BrandCompetitor {
  id: number;
  brand_id: number;
  competitor_company_id: number;
}

async function checkAdmin() {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized', status: 401 };
  if (session.role !== 'admin') return { error: 'Forbidden', status: 403 };
  return { session };
}

// POST - Add competitor to brand
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: brandId } = await params;

  try {
    const body = await request.json();
    const { competitor_company_id } = body;

    if (!competitor_company_id) {
      return NextResponse.json({ error: 'Competitor company ID wajib diisi' }, { status: 400 });
    }

    // Check if already exists
    const existing = await query<BrandCompetitor>(
      `SELECT id FROM brand_competitors WHERE brand_id = $1 AND competitor_company_id = $2`,
      [brandId, competitor_company_id],
    );

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Competitor sudah ada' }, { status: 400 });
    }

    const result = await query<BrandCompetitor>(
      `INSERT INTO brand_competitors (brand_id, competitor_company_id)
       VALUES ($1, $2)
       RETURNING *`,
      [brandId, competitor_company_id],
    );

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Add competitor error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE - Remove competitor from brand
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: brandId } = await params;
  const { searchParams } = new URL(request.url);
  const competitorId = searchParams.get('competitorId');

  if (!competitorId) {
    return NextResponse.json({ error: 'Competitor ID wajib diisi' }, { status: 400 });
  }

  try {
    const result = await query<{ id: number }>(
      `DELETE FROM brand_competitors WHERE brand_id = $1 AND competitor_company_id = $2 RETURNING id`,
      [brandId, competitorId],
    );

    if (result.length === 0) {
      return NextResponse.json({ error: 'Competitor tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove competitor error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
