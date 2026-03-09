import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

// tiktok_page_17.py equivalent
// Tables:
//   l1_socmed.tiktok_profile_daily        — daily: net_growth, profile_views, video_views
//   l2_socmed.tiktok_overview_main_brand  — overview table (Current, Previous, Gap)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const brand = searchParams.get('brand');
  const period = searchParams.get('period'); // "August 2025"

  if (!brand || !period) {
    return NextResponse.json({ error: 'Missing brand or period' }, { status: 400 });
  }

  const months: Record<string, string> = {
    January: '01', February: '02', March: '03',    April: '04',
    May: '05',     June: '06',     July: '07',     August: '08',
    September: '09', October: '10', November: '11', December: '12',
  };

  const [monthName, yearStr] = period.split(' ');
  const mm = months[monthName];
  if (!mm) return NextResponse.json({ error: 'Invalid period' }, { status: 400 });

  const monthYear = `${mm}-${yearStr}`;
  const year = parseInt(yearStr);
  const mo = parseInt(mm);

  // Date range: 1st to last day of month
  const firstDay = `${yearStr}-${mm}-01`;
  const lastMo = mo === 12 ? 1 : mo + 1;
  const lastYr = mo === 12 ? year + 1 : year;
  const lastDay = `${lastYr}-${String(lastMo).padStart(2, '0')}-01`;

  try {
    // 1. Daily profile data
    const dailyRows = await query(
      `SELECT
         date::text                          AS date,
         net_growth::numeric                 AS net_growth,
         profile_views::numeric              AS profile_views,
         video_views::numeric                AS video_views
       FROM l1_socmed.tiktok_profile_daily
       WHERE LOWER(brand_name_display) = LOWER($1)
         AND date >= $2 AND date < $3
       ORDER BY date`,
      [brand, firstDay, lastDay],
    );

    // 2. Overview table (Previous, Current, Gap rows)
    const overviewRows = await query(
      `SELECT
         row_type,
         post_count::numeric      AS post_count,
         profile_views::numeric   AS profile_views,
         followers_growth::numeric AS followers_growth,
         reach_post::numeric      AS reach,
         video_views::numeric     AS views,
         engagement_a::numeric    AS engagement,
         avg_watch_time::numeric  AS avg_watch_time
       FROM l2_socmed.tiktok_overview_main_brand
       WHERE LOWER(brand_name_display) = LOWER($1)
         AND month_year = $2`,
      [brand, monthYear],
    );

    const fmtInt = (v: any) => (v !== null && v !== undefined ? Math.round(parseFloat(v)).toLocaleString() : '-');
    const fmtPct = (v: any) => (v !== null && v !== undefined ? `${parseFloat(v).toFixed(2)}%` : '-');
    const fmtDec = (v: any) => (v !== null && v !== undefined ? parseFloat(v).toFixed(2) : '-');

    // Determine prev month label
    const prevMo = mo === 1 ? 12 : mo - 1;
    const prevYr = mo === 1 ? year - 1 : year;
    const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const prevLabel = `${MONTH_NAMES[prevMo]} ${prevYr}`;
    const currLabel = `${MONTH_NAMES[mo]} ${year}`;

    const labelMap: Record<string, string> = { Current: currLabel, Previous: prevLabel, Gap: 'Gap' };

    const tableRows = (overviewRows as any[]).map((r) => ({
      month: labelMap[r.row_type] ?? r.row_type,
      post_count: r.row_type === 'Gap' ? fmtPct(r.post_count) : fmtInt(r.post_count),
      profile_views: r.row_type === 'Gap' ? fmtPct(r.profile_views) : fmtInt(r.profile_views),
      followers_growth: r.row_type === 'Gap' ? fmtPct(r.followers_growth) : fmtInt(r.followers_growth),
      reach: r.row_type === 'Gap' ? fmtPct(r.reach) : fmtInt(r.reach),
      views: r.row_type === 'Gap' ? fmtPct(r.views) : fmtInt(r.views),
      engagement: r.row_type === 'Gap' ? fmtPct(r.engagement) : fmtInt(r.engagement),
      avg_watch_time: r.row_type === 'Gap' ? fmtPct(r.avg_watch_time) : fmtDec(r.avg_watch_time),
    }));

    // Sort: Previous, Current, Gap
    const order: Record<string, number> = { Previous: 0, Current: 1, Gap: 2 };
    tableRows.sort((a, b) => {
      const oa = order[(overviewRows as any[]).find((r) => labelMap[r.row_type] === a.month)?.row_type] ?? 99;
      const ob = order[(overviewRows as any[]).find((r) => labelMap[r.row_type] === b.month)?.row_type] ?? 99;
      return oa - ob;
    });

    return NextResponse.json({
      chartData: (dailyRows as any[]).map((r) => ({
        date: r.date,
        net_growth: r.net_growth !== null ? parseFloat(r.net_growth) : 0,
        profile_views: r.profile_views !== null ? parseFloat(r.profile_views) : 0,
        video_views: r.video_views !== null ? parseFloat(r.video_views) : 0,
      })),
      tableRows,
      brand,
      period,
      monthYear,
    });
  } catch (err: unknown) {
    console.error('[tt-growth API]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'DB error', chartData: [], tableRows: [] },
      { status: 500 },
    );
  }
}
