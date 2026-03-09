import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

// twitter_page_22.py equivalent
// Tables:
//   l2_socmed.twitter_post_pov     — daily: new_follows, impressions, engagement_a
//   l2_socmed.twitter_profile_pov  — monthly summary: status (Previous/Current/Gap)

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
    // 1. Daily data for line/bar charts
    const dailyRows = await query(
      `SELECT
         date::text          AS date,
         SUM(new_follows)    AS new_follows,
         SUM(impressions)    AS impressions,
         SUM(engagement_a)   AS engagement
       FROM l2_socmed.twitter_post_pov
       WHERE LOWER(brand_name_display) = LOWER($1)
         AND date >= $2 AND date < $3
       GROUP BY date
       ORDER BY date`,
      [brand, firstDay, lastDay],
    );

    // 2. Monthly summary table (Previous / Current / Gap)
    const summaryRows = await query(
      `SELECT
         status,
         post_count::numeric        AS post_count,
         followers_growth::numeric  AS followers_growth,
         impressions::numeric       AS impressions,
         engagement_a::numeric      AS engagement
       FROM l2_socmed.twitter_profile_pov
       WHERE LOWER(brand_name_display) = LOWER($1)
         AND month_year = $2
       ORDER BY post_count DESC`,
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
    const fmtPct = (v: any) => (v != null ? `${(parseFloat(v) * 100).toFixed(2)}%` : '-');

    const tableRows = (summaryRows as any[]).map((r) => {
      const isGap = String(r.status).toLowerCase() === 'gap';
      return {
        month: statusMap[r.status] ?? r.status,
        post_count: isGap ? fmtPct(r.post_count) : fmtInt(r.post_count),
        followers_growth: isGap ? fmtPct(r.followers_growth) : fmtInt(r.followers_growth),
        impressions: isGap ? fmtPct(r.impressions) : fmtInt(r.impressions),
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
        new_follows: r.new_follows != null ? parseFloat(r.new_follows) : 0,
        impressions: r.impressions != null ? parseFloat(r.impressions) : 0,
        engagement: r.engagement != null ? parseFloat(r.engagement) : 0,
      })),
      tableRows,
      brand,
      period,
      monthYear,
    });
  } catch (err: unknown) {
    console.error('[tw-growth API]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'DB error', chartData: [], tableRows: [] },
      { status: 500 },
    );
  }
}
