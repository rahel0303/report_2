import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

async function batchImageCache(urls: string[]): Promise<Map<string, string>> {
  if (urls.length === 0) return new Map();
  const cached = await query<{ post_url: string; image_url: string }>(
    `SELECT post_url, image_url FROM public.thumbnail_url WHERE post_url = ANY($1) AND chanel = 'instagram'`,
    [urls],
  );
  const map = new Map<string, string>();
  (cached as any[]).forEach((r) => map.set(r.post_url, r.image_url));
  return map;
}

// instagram_page_10.py equivalent
// Table: l1_socmed.fact_ig_daily_engagement — Content Pillar analysis (Lowest/Highest per pillar)

const PILLAR_FILTER = `
  content_pillar IS NOT NULL AND
  TRIM(content_pillar) NOT ILIKE 'by client' AND
  TRIM(content_pillar) NOT ILIKE 'undefined' AND
  TRIM(content_pillar) NOT IN ('x', '')
`;

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

  try {
    // 1. Get distinct content pillars — AON pillars first (matches instagram_page_10.py ORDER BY is_aon DESC)
    const pillarRows = await query<{ content_pillar: string }>(
      `SELECT content_pillar
       FROM l1_socmed.fact_ig_daily_engagement
       WHERE LOWER(brand_name_display) = LOWER($1)
         AND month_year = $2
         AND ${PILLAR_FILTER}
       GROUP BY content_pillar
       ORDER BY BOOL_OR(is_aon) DESC NULLS LAST, content_pillar`,
      [brand, monthYear],
    );

    const pillars = (pillarRows as any[]).map((r) => r.content_pillar as string);

    // 2. For each pillar, fetch lowest 6 and highest 6 by engagement (matches instagram_page_10.py limit=6)
    const pillarData = await Promise.all(
      pillars.map(async (pillar) => {
        const postSelect = `
          SELECT
            reach::numeric                                    AS reach,
            ig_engagement_a::numeric                          AS engagement,
            er_reach::numeric                                 AS engagement_rate,
            saves::numeric                                    AS saves,
            shares::numeric                                   AS shares,
            comments::numeric                                 AS comments,
            CASE WHEN repost = TRUE THEN 1 ELSE 0 END        AS repost,
            format,
            permalink                                         AS url
          FROM l1_socmed.fact_ig_daily_engagement
          WHERE LOWER(brand_name_display) = LOWER($1)
            AND month_year = $2
            AND content_pillar = $3
            AND ${PILLAR_FILTER}
        `;
        // Fetch all posts for this pillar ordered highest→lowest engagement
        // Then split: top 6 → highest, rest (up to 6) → lowest. No post appears in both.
        const allRows = await query(
          `${postSelect} ORDER BY ig_engagement_a::numeric DESC NULLS LAST`,
          [brand, monthYear, pillar],
        ) as any[];

        const parsePost = (r: any, imgMap: Map<string, string>) => ({
          reach: r.reach !== null ? parseFloat(r.reach) : null,
          engagement: r.engagement !== null ? parseFloat(r.engagement) : null,
          engagement_rate: r.engagement_rate !== null ? parseFloat(r.engagement_rate) : null,
          saves: r.saves !== null ? parseFloat(r.saves) : null,
          shares: r.shares !== null ? parseFloat(r.shares) : null,
          comments: r.comments !== null ? parseFloat(r.comments) : null,
          repost: r.repost !== null ? parseInt(r.repost) : null,
          format: r.format || '-',
          url: r.url || null,
          image_url: (r.url && imgMap.get(r.url)) || null,
        });

        // Batch image cache lookup
        const allUrls = allRows.map((r) => r.url).filter(Boolean) as string[];
        const imgMap = await batchImageCache([...new Set(allUrls)]);

        // Split in half: top half → highest (left), bottom half → lowest (right). No overlap.
        const half = Math.ceil(allRows.length / 2);
        const highestRows = allRows.slice(0, half).slice(0, 6);       // best performers, max 6
        const lowestRows = allRows.slice(half).reverse().slice(0, 6); // worst performers, max 6

        return {
          pillar,
          highest: highestRows.map((r) => parsePost(r, imgMap)),
          lowest: lowestRows.map((r) => parsePost(r, imgMap)),
        };
      }),
    );

    return NextResponse.json({ pillars: pillarData, brand, period, monthYear });
  } catch (err: unknown) {
    console.error('[ig-content-pillar API]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'DB error', pillars: [] },
      { status: 500 },
    );
  }
}
