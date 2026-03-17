import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { getSession } from '@/app/lib/auth';
import { deleteFromGCS } from '@/app/lib/gcs';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;

  const rows = await query<{ gcs_object_name: string | null }>(
    `SELECT gcs_object_name FROM public.export_history WHERE id = $1`,
    [id],
  );

  if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (rows[0].gcs_object_name) {
    await deleteFromGCS(rows[0].gcs_object_name);
  }

  await query(`DELETE FROM public.export_history WHERE id = $1`, [id]);

  return NextResponse.json({ success: true });
}
