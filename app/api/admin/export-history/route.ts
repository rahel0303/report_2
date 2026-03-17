import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { getSession } from '@/app/lib/auth';

interface ExportHistoryRow {
  id: number;
  user_id: number;
  user_name: string;
  name: string;
  brand_name: string;
  period: string;
  slide_count: number;
  is_partial: boolean;
  gcs_object_name: string | null;
  cover_image_url: string | null;
  exported_at: string;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const rows = await query<ExportHistoryRow>(
    `SELECT e.id, e.user_id, u.name as user_name, e.name, e.brand_name, e.period,
            e.slide_count, e.is_partial, e.gcs_object_name, e.cover_image_url, e.exported_at
     FROM public.export_history e
     LEFT JOIN public.users u ON u.id = e.user_id
     ORDER BY e.exported_at DESC`
  );

  return NextResponse.json({ history: rows });
}
