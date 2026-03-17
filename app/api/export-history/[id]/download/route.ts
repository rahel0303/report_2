import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { getSession } from '@/app/lib/auth';
import { downloadFromGCS } from '@/app/lib/gcs';

// GET — Download PPTX file streamed from GCS
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const rows = await query<{ gcs_object_name: string | null; name: string }>(
      `SELECT gcs_object_name, name FROM public.export_history WHERE id = $1 AND user_id = $2`,
      [id, session.id],
    );

    if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { gcs_object_name, name } = rows[0];
    if (!gcs_object_name) return NextResponse.json({ error: 'File not available' }, { status: 404 });

    const buffer = await downloadFromGCS(gcs_object_name);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${name}.pptx"`,
        'Content-Length': String(buffer.length),
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
