import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { getSession } from '@/app/lib/auth';

interface DimBrand {
  id: number;
  brand_name_identifier: string;
  brand_name_display: string;
  is_competitor: boolean;
  username_instagram: string | null;
  username_tiktok: string | null;
  username_facebook: string | null;
  username_twitter: string | null;
}

interface UserRow {
  company_id: number | null;
}

// GET - List client brands active in a given month, filtered by user's company
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const monthYear = searchParams.get('month_year');

    // Get company_id from user's profile
    const userRows = await query<UserRow>(
      'SELECT company_id FROM public.users WHERE id = $1 LIMIT 1',
      [session.id]
    );
    const companyId = userRows[0]?.company_id ?? null;

    let brands: DimBrand[];

    if (monthYear && companyId) {
      // Filter by company_id + month_year
      brands = await query<DimBrand>(
        `SELECT b.id, b.brand_name_identifier, b.brand_name_display, b.is_competitor,
                b.username_instagram, b.username_tiktok, b.username_facebook, b.username_twitter
         FROM l1_socmed.dim_brands b
         INNER JOIN l1_socmed.dim_brand_active_months a
           ON a.brand_id = b.id AND a.month_year = $1 AND a.company_id = $2
         WHERE b.is_competitor = false
         ORDER BY b.brand_name_display ASC`,
        [monthYear, companyId],
      );
    } else if (monthYear) {
      // No company assigned — return empty
      brands = [];
    } else {
      // No month filter — return all non-competitor brands (fallback)
      brands = await query<DimBrand>(
        `SELECT id, brand_name_identifier, brand_name_display, is_competitor,
                username_instagram, username_tiktok, username_facebook, username_twitter
         FROM l1_socmed.dim_brands
         WHERE is_competitor = false
         ORDER BY brand_name_display ASC`,
      );
    }

    return NextResponse.json({ brands });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json({ error: 'Gagal mengambil data brands' }, { status: 500 });
  }
}
