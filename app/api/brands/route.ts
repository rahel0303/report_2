import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

interface DimBrand {
  id: number;
  brand_name_identifier: string;
  brand_name_display: string;
  is_competitor: boolean;
}

// GET - List all client brands (is_competitor = false) from l1_socmed.dim_brands
export async function GET() {
  try {
    const brands = await query<DimBrand>(
      `SELECT id, brand_name_identifier, brand_name_display, is_competitor
       FROM l1_socmed.dim_brands
       WHERE is_competitor = false
       ORDER BY brand_name_display ASC`,
    );

    return NextResponse.json({ brands });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json({ error: 'Gagal mengambil data brands' }, { status: 500 });
  }
}
