import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

// instagram_page_8.py equivalent
// Tables: l2_socmed.ig_profile_aggregate (line chart), l2_socmed.ig_post_monthly (overview table)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const brand = searchParams.get('brand');
  const period = searchParams.get('period'); // "August 2025"

  if (!brand || !period) {
    return NextResponse.json({ error: 'Missing brand or period' }, { status: 400 });
  }

  // Parse "August 2025" → "08-2025"
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
  const monthNum = months[monthName];
  if (!monthNum) {
    return NextResponse.json({ error: `Unknown month: ${monthName}` }, { status: 400 });
  }
  const monthYear = `${monthNum}-${yearStr}`; // "08-2025"

  const [mNum, yNum] = monthYear.split('-').map(Number);

  try {
    // ── Line chart data ── WIB = UTC+7, use interval offset for portability ──
    const lineResult = await query(
      `SELECT
          (publish_time + INTERVAL '7 hours')::date AS date,
          followers_growth::numeric AS followers_growth,
          profile_reach::numeric    AS profile_reach
       FROM l2_socmed.ig_profile_aggregate
       WHERE LOWER(brand_name_display) = LOWER($1)
         AND month_year = $2
       ORDER BY (publish_time + INTERVAL '7 hours')::date ASC`,
      [brand, monthYear],
    );

    // ── Overview table ─────────────────────────────────────────────────────
    const tableResult = await query(
      `SELECT
          row_type,
          profile_reach,
          profile_visit,
          follows_increase AS growth,
          reach,
          engagement,
          likes,
          comments,
          shares,
          saves,
          ROUND((er_reach * 100)::numeric, 2)  AS er_reach_pct,
          ROUND((er_folls * 100)::numeric, 2)  AS er_folls_pct
       FROM l2_socmed.ig_post_monthly
       WHERE LOWER(brand_name_display) = LOWER($1)
         AND month_year = $2
       ORDER BY
         CASE
           WHEN LOWER(row_type) LIKE 'previous%' THEN 1
           WHEN LOWER(row_type) LIKE 'current%'  THEN 2
           WHEN LOWER(row_type) LIKE 'gap%'      THEN 3
           ELSE 4
         END`,
      [brand, monthYear],
    );

    // Build friendly month labels (same as Python dateutil logic)
    const [m, y] = monthYear.split('-').map(Number);
    const currentDt = new Date(y, m - 1, 1);
    const previousDt = new Date(y, m - 2, 1);
    const fmtMonth = (d: Date) => d.toLocaleString('en', { month: 'long' }) + ' ' + d.getFullYear();
    const labelMap: Record<string, string> = {
      previous: fmtMonth(previousDt),
      current: fmtMonth(currentDt),
      gap: 'Gap (%)',
    };

    const tableRows = (tableResult as any[]).map((r) => {
      const rawLabel = String(r.row_type).toLowerCase();
      const label = rawLabel.startsWith('prev')
        ? labelMap.previous
        : rawLabel.startsWith('curr')
          ? labelMap.current
          : labelMap.gap;

      const fmt = (v: unknown, isGap: boolean) => {
        if (v === null || v === undefined || v === '') return '-';
        const n = parseFloat(String(v));
        if (isNaN(n)) return String(v);
        if (isGap) return `${n.toFixed(2)}%`;
        if (Math.abs(n - Math.round(n)) < 0.001) return Math.round(n).toLocaleString();
        return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
      };

      const isGap = rawLabel.startsWith('gap');
      return {
        month: label,
        profileReach: fmt(r.profile_reach, isGap),
        profileVisit: fmt(r.profile_visit, isGap),
        growth: fmt(r.growth, isGap),
        reach: fmt(r.reach, isGap),
        engagement: fmt(r.engagement, isGap),
        likes: fmt(r.likes, isGap),
        comments: fmt(r.comments, isGap),
        shares: fmt(r.shares, isGap),
        saves: fmt(r.saves, isGap),
        erReach: fmt(r.er_reach_pct, isGap),
        erFolls: fmt(r.er_folls_pct, isGap),
      };
    });

    // Convert pg date (may be a JS Date object) to 'YYYY-MM-DD' string
    const toDateStr = (v: unknown): string => {
      if (v instanceof Date) {
        const y = v.getFullYear();
        const m = String(v.getMonth() + 1).padStart(2, '0');
        const d = String(v.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
      return String(v).slice(0, 10);
    };

    // Only keep dates that belong to the selected month
    const targetPrefix = `${yNum}-${String(mNum).padStart(2, '0')}`;

    return NextResponse.json({
      lineData: (lineResult as any[])
        .map((r) => ({
          date: toDateStr(r.date),
          followersGrowth: parseFloat(r.followers_growth) || 0,
          profileReach: parseFloat(r.profile_reach) || 0,
        }))
        .filter((r) => r.date.startsWith(targetPrefix)),
      tableRows,
      monthYear,
    });
  } catch (err: unknown) {
    console.error('[ig-growth API]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'DB error', lineData: [], tableRows: [] },
      { status: 500 },
    );
  }
}
