import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { getSession } from '@/app/lib/auth';

interface Report {
  id: number;
  user_id: number;
  name: string;
  slides: unknown;
  config: unknown;
  report_type: string;
  created_at: string;
  updated_at: string;
}

// GET - Get single report
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const reports = await query<Report>(
      `SELECT id, name, slides, config, report_type, created_at, updated_at
       FROM reports
       WHERE id = $1 AND user_id = $2`,
      [id, session.id],
    );

    if (reports.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const report = reports[0];

    return NextResponse.json({
      id: report.id.toString(),
      name: report.name,
      slides: report.slides,
      config: report.config,
      savedAt: report.updated_at,
      reportType: report.report_type,
    });
  } catch (error) {
    console.error('Get report error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT - Update report
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, slides, config } = body;

    const result = await query<Report>(
      `UPDATE reports
       SET name = COALESCE($1, name),
           slides = COALESCE($2, slides),
           config = COALESCE($3, config),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5
       RETURNING id, name, slides, config, report_type, created_at, updated_at`,
      [name, slides ? JSON.stringify(slides) : null, config ? JSON.stringify(config) : null, id, session.id],
    );

    if (result.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const report = result[0];

    return NextResponse.json({
      id: report.id.toString(),
      name: report.name,
      slides: report.slides,
      config: report.config,
      savedAt: report.updated_at,
      reportType: report.report_type,
    });
  } catch (error) {
    console.error('Update report error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE - Delete report
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const result = await query<{ id: number }>(
      `DELETE FROM reports WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, session.id],
    );

    if (result.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete report error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
