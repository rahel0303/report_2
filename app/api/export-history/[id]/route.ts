import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { getSession } from '@/app/lib/auth';
import { deleteFromGCS } from '@/app/lib/gcs';

// DELETE — Remove record + file from GCS
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Get gcs_object_name before deleting
    const rows = await query<{ gcs_object_name: string | null }>(
      `SELECT gcs_object_name FROM public.export_history WHERE id = $1 AND user_id = $2`,
      [id, session.id],
    );

    if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Delete from GCS if exists
    if (rows[0].gcs_object_name) {
      await deleteFromGCS(rows[0].gcs_object_name);
    }

    // Delete from DB
    await query(
      `DELETE FROM public.export_history WHERE id = $1 AND user_id = $2`,
      [id, session.id],
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete export history error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
