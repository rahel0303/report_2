import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

// Slides 11 & 12 equivalent from instagram_visualization/instagram_page_11.py & instagram_page_12.py
// Metrics: Average Engagement + Total Post per Content Pillar
// Filter: is_aon = TRUE (aon=true) or is_aon = FALSE (aon=false)

const MONTHS: Record<string, string> = {
  January: '01', February: '02', March: '03', April: '04',
  May: '05', June: '06', July: '07', August: '08',
  September: '09', October: '10', November: '11', December: '12',
};

const PILLAR_FILTER = `
  content_pillar IS NOT NULL AND
  TRIM(content_pillar) NOT ILIKE 'by client' AND
  TRIM(content_pillar) NOT ILIKE 'undefined' AND
  TRIM(content_pillar) NOT IN ('x', '')
`;

function parsePeriod(period: string): { currMonth: string; prevMonth: string } | null {
  const [monthName, yearStr] = period.split(' ');
  const mm = MONTHS[monthName];
  if (!mm) return null;
  const yyyy = parseInt(yearStr);
  const currMonth = `${mm}-${yyyy}`;
  const mmNum = parseInt(mm);
  const prevMm = mmNum === 1 ? 12 : mmNum - 1;
  const prevYyyy = mmNum === 1 ? yyyy - 1 : yyyy;
  const prevMonth = `${String(prevMm).padStart(2, '0')}-${prevYyyy}`;
  return { currMonth, prevMonth };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const brand = searchParams.get('brand');
  const period = searchParams.get('period');
  const aon = searchParams.get('aon'); // 'true' | 'false'

  if (!brand || !period || !aon) {
    return NextResponse.json({ error: 'Missing brand, period, or aon' }, { status: 400 });
  }

  const parsed = parsePeriod(period);
  if (!parsed) return NextResponse.json({ error: 'Invalid period' }, { status: 400 });
  const { currMonth, prevMonth } = parsed;

  const aonFilter = aon === 'true' ? 'is_aon IS TRUE' : 'is_aon IS FALSE';

  try {
    // Fetch avg engagement — current & previous month
    const [engCurr, engPrev, postCurr, postPrev] = await Promise.all([
      query<{ content_pillar: string; avg_engagement: string }>(
        `SELECT content_pillar, AVG(ig_engagement_a::numeric) AS avg_engagement
         FROM l1_socmed.fact_ig_daily_engagement
         WHERE LOWER(brand_name_display) = LOWER($1)
           AND month_year = $2
           AND ${aonFilter}
           AND ${PILLAR_FILTER}
         GROUP BY content_pillar
         ORDER BY content_pillar`,
        [brand, currMonth],
      ),
      query<{ content_pillar: string; avg_engagement: string }>(
        `SELECT content_pillar, AVG(ig_engagement_a::numeric) AS avg_engagement
         FROM l1_socmed.fact_ig_daily_engagement
         WHERE LOWER(brand_name_display) = LOWER($1)
           AND month_year = $2
           AND ${aonFilter}
           AND ${PILLAR_FILTER}
         GROUP BY content_pillar
         ORDER BY content_pillar`,
        [brand, prevMonth],
      ),
      query<{ content_pillar: string; total_post: string }>(
        `SELECT content_pillar, COUNT(permalink) AS total_post
         FROM l1_socmed.fact_ig_daily_engagement
         WHERE LOWER(brand_name_display) = LOWER($1)
           AND month_year = $2
           AND ${aonFilter}
           AND ${PILLAR_FILTER}
         GROUP BY content_pillar
         ORDER BY content_pillar`,
        [brand, currMonth],
      ),
      query<{ content_pillar: string; total_post: string }>(
        `SELECT content_pillar, COUNT(permalink) AS total_post
         FROM l1_socmed.fact_ig_daily_engagement
         WHERE LOWER(brand_name_display) = LOWER($1)
           AND month_year = $2
           AND ${aonFilter}
           AND ${PILLAR_FILTER}
         GROUP BY content_pillar
         ORDER BY content_pillar`,
        [brand, prevMonth],
      ),
    ]);

    // Fetch delta from l2_socmed.content_pillar_overview
    const deltaRows = await query<{
      content_pillar: string;
      average_engagement_inc: string | null;
      total_post_inc: string | null;
    }>(
      `SELECT content_pillar,
              ROUND(average_engagement_inc::numeric, 0) AS average_engagement_inc,
              ROUND(total_post_inc::numeric, 0)         AS total_post_inc
       FROM l2_socmed.content_pillar_overview
       WHERE LOWER(brand_name_display) = LOWER($1)
         AND month_year = $2
         AND ${aonFilter}
         AND ${PILLAR_FILTER}
         AND LOWER(status) = 'current'
       ORDER BY content_pillar`,
      [brand, currMonth],
    );

    const parse = (rows: any[], numCol: string) =>
      (rows as any[]).map((r) => ({
        content_pillar: r.content_pillar as string,
        value: r[numCol] !== null && r[numCol] !== undefined ? parseFloat(r[numCol]) : 0,
      }));

    const parseDelta = (rows: any[], col: string) =>
      (rows as any[]).map((r) => ({
        content_pillar: r.content_pillar as string,
        inc: r[col] !== null && r[col] !== undefined ? parseFloat(r[col]) : null,
      }));

    return NextResponse.json({
      currMonth,
      prevMonth,
      engCurr: parse(engCurr as any[], 'avg_engagement'),
      engPrev: parse(engPrev as any[], 'avg_engagement'),
      postCurr: parse(postCurr as any[], 'total_post'),
      postPrev: parse(postPrev as any[], 'total_post'),
      deltaEng: parseDelta(deltaRows as any[], 'average_engagement_inc'),
      deltaPost: parseDelta(deltaRows as any[], 'total_post_inc'),
    });
  } catch (err: unknown) {
    console.error('[ig-cp-engagement API]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'DB error' },
      { status: 500 },
    );
  }
}
