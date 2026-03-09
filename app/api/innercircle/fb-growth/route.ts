import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

// facebook_page_26.py equivalent
// Tables:
//   l1_socmed.fact_fb_daily_engagement — daily: follows, reactions (likes), reach, fb_engagement_a
//   l2_socmed.fb_post_monthly          — monthly summary: row_type (Previous/Current/Gap)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const brand = searchParams.get('brand');
  const period = searchParams.get('period'); // "August 2025"

  if (!brand || !period) {
    return NextResponse.json({ error: 'Missing brand or period' }, { status: 400 });
  }

  const months: Record<string, string> = {
    January: '01',
    February: '02',
    March: '03',
    April: '04',
    May: '05',
    June: '06',
    July: '07',
    August: '08',
    September: '09',
    October: '10',
    November: '11',
    December: '12',
  };

  const [monthName, yearStr] = period.split(' ');
  const mm = months[monthName];
  if (!mm) return NextResponse.json({ error: 'Invalid period' }, { status: 400 });

  const monthYear = `${mm}-${yearStr}`;
  const year = parseInt(yearStr);
  const mo = parseInt(mm);

  const firstDay = `${yearStr}-${mm}-01`;
  const lastMo = mo === 12 ? 1 : mo + 1;
  const lastYr = mo === 12 ? year + 1 : year;
  const lastDay = `${lastYr}-${String(lastMo).padStart(2, '0')}-01`;

  try {
    // 1. Daily data for charts
    const dailyRows = await query(
      `SELECT
         publish_time::date::text  AS date,
         SUM(follows)              AS follows,
         SUM(reactions)            AS likes,
         SUM(reach)                AS reach,
         SUM(fb_engagement_a)      AS engagement
       FROM l1_socmed.fact_fb_daily_engagement
       WHERE LOWER(brand_name_display) = LOWER($1)
         AND publish_time::date >= $2
         AND publish_time::date < $3
       GROUP BY publish_time::date
       ORDER BY publish_time::date`,
      [brand, firstDay, lastDay],
    );

    // 2. Monthly summary table (Previous / Current / Gap)
    const summaryRows = await query(
      `SELECT
         row_type                      AS status,
         post_count::numeric           AS post_count,
         follows_increase::numeric     AS fans_growth,
         reach::numeric                AS post_reach,
         engagement::numeric           AS engagement
       FROM l2_socmed.fb_post_monthly
       WHERE LOWER(brand_name_display) = LOWER($1)
         AND month_year = $2`,
      [brand, monthYear],
    );

    const MONTH_NAMES = [
      '',
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const prevMo = mo === 1 ? 12 : mo - 1;
    const prevYr = mo === 1 ? year - 1 : year;
    const prevLabel = `${MONTH_NAMES[prevMo]} ${prevYr}`;
    const currLabel = `${MONTH_NAMES[mo]} ${year}`;

    const statusMap: Record<string, string> = {
      Current: currLabel,
      Previous: prevLabel,
      Gap: 'Gap',
    };

    const fmtInt = (v: any) => (v != null ? Math.round(parseFloat(v)).toLocaleString() : '-');
    const fmtPct = (v: any) => (v != null ? `${parseFloat(v).toFixed(2)}%` : '-');

    const tableRows = (summaryRows as any[]).map((r) => {
      const isGap = String(r.status).toLowerCase() === 'gap';
      return {
        month: statusMap[r.status] ?? r.status,
        post_count: isGap ? fmtPct(r.post_count) : fmtInt(r.post_count),
        fans_growth: isGap ? fmtPct(r.fans_growth) : fmtInt(r.fans_growth),
        post_reach: isGap ? fmtPct(r.post_reach) : fmtInt(r.post_reach),
        engagement: isGap ? fmtPct(r.engagement) : fmtInt(r.engagement),
        _status: r.status,
      };
    });

    const order: Record<string, number> = { Previous: 0, Current: 1, Gap: 2 };
    tableRows.sort((a, b) => (order[a._status] ?? 99) - (order[b._status] ?? 99));
    tableRows.forEach((r) => delete (r as any)._status);

    return NextResponse.json({
      chartData: (dailyRows as any[]).map((r) => ({
        date: r.date,
        follows: r.follows != null ? parseFloat(r.follows) : 0,
        likes: r.likes != null ? parseFloat(r.likes) : 0,
        engagement: r.engagement != null ? parseFloat(r.engagement) : 0,
      })),
      tableRows,
      brand,
      period,
      monthYear,
    });
  } catch (err: unknown) {
    console.error('[fb-growth API]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'DB error', chartData: [], tableRows: [] },
      { status: 500 },
    );
  }
}
