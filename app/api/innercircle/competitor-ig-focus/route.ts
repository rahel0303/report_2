import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

async function batchImageCache(urls: string[], channel: string): Promise<Map<string, string>> {
  if (urls.length === 0) return new Map();
  const cached = await query<{ post_url: string; image_url: string }>(
    `SELECT post_url, image_url FROM public.thumbnail_url WHERE post_url = ANY($1) AND chanel = $2`,
    [urls, channel],
  );
  const map = new Map<string, string>();
  (cached as any[]).forEach((r) => map.set(r.post_url, r.image_url));
  return map;
}

// competitor_instagram_focus.py equivalent
// Per-competitor IG focus slide:
//   - Top 3 IG posts      → l1_socmed.fact_ig_daily_competitor
//   - Followers growth    → l2_socmed.ig_competitor_daily_growth
//   - Main brand row      → l2_socmed.ig_profile_overview
//   - Competitor summary  → l2_socmed.ig_competitor_summary

const MONTH_MAP: Record<string, string> = {
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const brand = searchParams.get('brand');
  const period = searchParams.get('period');
  const competitor = searchParams.get('competitor');

  if (!brand || !period || !competitor) {
    return NextResponse.json({ error: 'Missing brand, period, or competitor' }, { status: 400 });
  }

  const [monthName, yearStr] = period.split(' ');
  const mm = MONTH_MAP[monthName];
  if (!mm) return NextResponse.json({ error: `Invalid period: ${period}` }, { status: 400 });
  const monthYear = `${mm}-${yearStr}`;

  try {
    const [top3Res, growthRes, mainBrandRes, compSummaryRes] = await Promise.all([
      // ── Top 3 IG posts for the competitor ──────────────────────────────────
      query(
        `SELECT
            ig_engagement::numeric  AS ig_engagement,
            likes::numeric          AS likes,
            comments::numeric       AS comments,
            er_folls::numeric       AS er_folls,
            permalink
         FROM l1_socmed.fact_ig_daily_competitor
         WHERE LOWER(brand_name_display) = LOWER($1)
           AND month_year = $2
         ORDER BY ig_engagement::numeric DESC NULLS LAST
         LIMIT 3`,
        [competitor, monthYear],
      ),

      // ── Daily followers growth series for line chart ───────────────────────
      query(
        `SELECT
            date::text              AS date,
            daily_foll_growth::numeric AS daily_foll_growth
         FROM l2_socmed.ig_competitor_daily_growth
         WHERE LOWER(brand_name_display) = LOWER($1)
           AND to_char(date,'MM-YYYY') = $2
         ORDER BY date`,
        [competitor, monthYear],
      ),

      // ── Main brand profile overview row ────────────────────────────────────
      query(
        `SELECT
            brand_name_display,
            followers_growth::numeric        AS followers_growth,
            followers_growth_gap::numeric    AS followers_growth_gap,
            post_count::numeric              AS post_count,
            post_count_growth::numeric       AS post_count_growth,
            total_engagement::numeric        AS total_engagement,
            total_engagement_gap::numeric    AS total_engagement_gap,
            avg_er_folls_b::numeric          AS avg_er_folls_b
         FROM l2_socmed.ig_profile_overview
         WHERE LOWER(brand_name_display) = LOWER($1)
           AND month_year = $2
         ORDER BY month_year DESC
         LIMIT 1`,
        [brand, monthYear],
      ),

      // ── Competitor summary row ─────────────────────────────────────────────
      query(
        `SELECT
            brand_name_display,
            ig_followers_increase::numeric   AS ig_followers_increase,
            ig_followers_growth::numeric     AS ig_followers_growth,
            post_count::numeric              AS post_count,
            post_count_growth::numeric       AS post_count_growth,
            ig_engagement_b::numeric         AS ig_engagement_b,
            ig_engagement_b_growth::numeric  AS ig_engagement_b_growth,
            er_folls::numeric                AS er_folls
         FROM l2_socmed.ig_competitor_summary
         WHERE LOWER(brand_name_display) = LOWER($1)
           AND month_year = $2
         ORDER BY month_year DESC
         LIMIT 1`,
        [competitor, monthYear],
      ),
    ]);

    const top3Raw = (top3Res as any[]).map((r) => ({
      ig_engagement: r.ig_engagement != null ? Number(r.ig_engagement) : null,
      likes: r.likes != null ? Number(r.likes) : null,
      comments: r.comments != null ? Number(r.comments) : null,
      er_folls: r.er_folls != null ? Number(r.er_folls) : null,
      permalink: r.permalink ?? null,
    }));

    const top3Urls = top3Raw.map((r) => r.permalink).filter(Boolean) as string[];
    const imgMap = await batchImageCache(top3Urls, 'instagram');
    const top3 = top3Raw.map((r) => ({
      ...r,
      image_url: (r.permalink && imgMap.get(r.permalink)) || null,
    }));

    const growthSeries = (growthRes as any[]).map((r) => ({
      date: r.date,
      daily_foll_growth: r.daily_foll_growth != null ? Number(r.daily_foll_growth) : null,
    }));

    const mb = (mainBrandRes as any[])[0] ?? null;
    const cs = (compSummaryRes as any[])[0] ?? null;

    const mainBrandRow = mb
      ? {
          brand: mb.brand_name_display ?? brand,
          followers_growth: mb.followers_growth != null ? Number(mb.followers_growth) : null,
          followers_growth_gap:
            mb.followers_growth_gap != null ? Number(mb.followers_growth_gap) : null,
          post_count: mb.post_count != null ? Number(mb.post_count) : null,
          post_count_growth: mb.post_count_growth != null ? Number(mb.post_count_growth) : null,
          total_engagement: mb.total_engagement != null ? Number(mb.total_engagement) : null,
          total_engagement_gap:
            mb.total_engagement_gap != null ? Number(mb.total_engagement_gap) : null,
          avg_er_folls_b: mb.avg_er_folls_b != null ? Number(mb.avg_er_folls_b) : null,
        }
      : null;

    const compRow = cs
      ? {
          brand: cs.brand_name_display ?? competitor,
          ig_followers_increase:
            cs.ig_followers_increase != null ? Number(cs.ig_followers_increase) : null,
          ig_followers_growth:
            cs.ig_followers_growth != null ? Number(cs.ig_followers_growth) : null,
          post_count: cs.post_count != null ? Number(cs.post_count) : null,
          post_count_growth: cs.post_count_growth != null ? Number(cs.post_count_growth) : null,
          ig_engagement_b: cs.ig_engagement_b != null ? Number(cs.ig_engagement_b) : null,
          ig_engagement_b_growth:
            cs.ig_engagement_b_growth != null ? Number(cs.ig_engagement_b_growth) : null,
          er_folls: cs.er_folls != null ? Number(cs.er_folls) : null,
        }
      : null;

    return NextResponse.json({ top3, growthSeries, mainBrandRow, compRow });
  } catch (err: any) {
    console.error('[competitor-ig-focus]', err);
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
