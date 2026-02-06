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

// GET - List all reports for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'report'; // 'report' or 'template'

    const reports = await query<Report>(
      `SELECT id, name, slides, config, report_type, created_at, updated_at
       FROM reports
       WHERE user_id = $1 AND report_type = $2
       ORDER BY updated_at DESC`,
      [session.id, type],
    );

    // Transform untuk kompatibilitas dengan frontend
    const transformed = reports.map((r) => ({
      id: r.id.toString(),
      name: r.name,
      slides: r.slides,
      config: r.config,
      savedAt: r.updated_at,
      reportType: r.report_type,
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Get reports error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - Create new report
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slides, config, reportType = 'report' } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const result = await query<Report>(
      `INSERT INTO reports (user_id, name, slides, config, report_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, slides, config, report_type, created_at, updated_at`,
      [session.id, name, JSON.stringify(slides || []), JSON.stringify(config || {}), reportType],
    );

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
    console.error('Create report error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
