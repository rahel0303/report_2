import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { getSession } from '@/app/lib/auth';

interface ExportHistory {
  id: number;
  user_id: number;
  name: string;
  brand_name: string;
  period: string;
  slide_count: number;
  is_partial: boolean;
  config: unknown;
  gcs_object_name: string | null;
  cover_image_url: string | null;
  exported_at: string;
}

function normalizeBrand(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '');
}

async function generateName(
  userId: number,
  brandName: string,
  period: string,
  isPartial: boolean,
): Promise<string> {
  const base = `${normalizeBrand(brandName)}_${period}_${isPartial ? 'partial' : 'allslides'}`;
  const rows = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM public.export_history
     WHERE user_id = $1 AND brand_name = $2 AND period = $3 AND is_partial = $4`,
    [userId, brandName, period, isPartial],
  );
  const count = parseInt(rows[0]?.count ?? '0', 10);
  return count === 0 ? base : `${base}_${count + 1}`;
}

// POST — Save export metadata to DB (no file upload)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { brandName, period, slideCount, isPartial, config, coverImageUrl, gcsObjectName } = body;

    if (!brandName || !period || slideCount == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const name = await generateName(session.id as number, brandName, period, isPartial ?? false);

    const result = await query<ExportHistory>(
      `INSERT INTO public.export_history
         (user_id, name, brand_name, period, slide_count, is_partial, config, gcs_object_name, cover_image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        session.id,
        name,
        brandName,
        period,
        slideCount,
        isPartial ?? false,
        JSON.stringify(config ?? {}),
        gcsObjectName ?? null,
        coverImageUrl ?? null,
      ],
    );

    return NextResponse.json({ success: true, record: result[0] });
  } catch (error) {
    console.error('Export history error:', error);
    return NextResponse.json({ error: 'Gagal menyimpan export history' }, { status: 500 });
  }
}

// GET — List export history milik user yang login
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rows = await query<ExportHistory>(
      `SELECT id, name, brand_name, period, slide_count, is_partial, config, cover_image_url, gcs_object_name, exported_at
       FROM public.export_history
       WHERE user_id = $1
       ORDER BY exported_at DESC`,
      [session.id],
    );

    return NextResponse.json({ history: rows });
  } catch (error) {
    console.error('Get export history error:', error);
    return NextResponse.json({ error: 'Gagal mengambil export history' }, { status: 500 });
  }
}
