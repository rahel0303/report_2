import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

// competitor_page_28.py equivalent
// Tables: IG (ig_competitor_summary + ig_competitor_profile_summary)
//         TikTok (tiktok_post_monthly_competitor + main brand from tiktok_profile_monthly)
//         Twitter (twitter_profile_pov_competitor)

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
  const period = searchParams.get('period'); // "August 2025"

  if (!brand || !period) {
    return NextResponse.json({ error: 'Missing brand or period' }, { status: 400 });
  }

  const [monthName, yearStr] = period.split(' ');
  const mm = MONTH_MAP[monthName];
  if (!mm) return NextResponse.json({ error: `Invalid period: ${period}` }, { status: 400 });
  const monthYear = `${mm}-${yearStr}`; // "08-2025"

  try {
    // Get main_brand_id
    const brandRes = await query(
      `SELECT DISTINCT brand_id
       FROM l2_socmed.ig_competitor_daily_growth
       WHERE LOWER(brand_name_display) = LOWER($1)
       LIMIT 1`,
      [brand],
    );

    if (!(brandRes as any[]).length) {
      // Return empty tables instead of 404 — so slide shows "no data"
      return NextResponse.json({
        igTable: [],
        ttTable: [],
        twTable: [],
        allCompetitors: [],
        brand,
        period,
      });
    }

    const mainBrandId = (brandRes as any[])[0].brand_id;

    const [igRes, ttMainRes, ttCompRes, twRes, compListRes] = await Promise.all([
      // ── Instagram competitor summary ──────────────────────────────────────
      query(
        `SELECT
            cs.brand_name_display               AS competitor,
            cs.ig_followers_increase::numeric   AS followers_inc,
            cs.ig_followers_growth::numeric     AS followers_growth,
            cs.ig_engagement_b::numeric         AS ig_engagement,
            cs.ig_engagement_b_growth::numeric  AS ig_engagement_growth,
            cs.er_folls::numeric                AS er_folls
         FROM l2_socmed.ig_competitor_summary cs
         WHERE cs.main_brand_id = $1
           AND cs.month_year   = $2
         ORDER BY cs.brand_name_display`,
        [mainBrandId, monthYear],
      ),

      // ── TikTok main brand row ──────────────────────────────────────────────
      query(
        `SELECT
            p.followers_growth::numeric        AS followers_growth,
            p.followers_growth_inc::numeric    AS followers_growth_inc,
            m.engagement_a::numeric            AS engagement,
            m.engagement_a_inc::numeric        AS engagement_inc,
            m.avg_views::numeric               AS avg_views,
            m.avg_views_inc::numeric           AS avg_views_inc
         FROM l2_socmed.tiktok_profile_monthly p
         LEFT JOIN l2_socmed.tiktok_post_monthly m
           ON p.brand_id = m.brand_id AND p.month_year = m.month_year
         WHERE p.brand_id   = $1
           AND p.month_year = $2
         LIMIT 1`,
        [mainBrandId, monthYear],
      ),

      // ── TikTok competitor rows ─────────────────────────────────────────────
      query(
        `SELECT
            brand_name_display                       AS competitor,
            followers_growth::numeric                AS followers_growth,
            followers_growth_inc_percent::numeric    AS followers_growth_inc,
            engagement_competitor::numeric           AS engagement,
            engagement_inc_percent::numeric          AS engagement_inc,
            avg_views::numeric                       AS avg_views,
            avg_views_growth::numeric                AS avg_views_inc
         FROM l2_socmed.tiktok_post_monthly_competitor
         WHERE main_brand_id = $1
           AND month_year    = $2
         ORDER BY brand_name_display`,
        [mainBrandId, monthYear],
      ),

      // ── Twitter ───────────────────────────────────────────────────────────
      query(
        `SELECT
            brand_name_display               AS competitor,
            followers_growth::numeric        AS followers_growth,
            followers_growth_inc::numeric    AS followers_growth_inc,
            engagement_b::numeric            AS engagement,
            engagement_b_inc::numeric        AS engagement_inc,
            er_folls::numeric                AS er_folls
         FROM l2_socmed.twitter_profile_pov_competitor
         WHERE main_brand_id = $1
           AND month_year    = $2
           AND status        = 'Current'
         ORDER BY brand_name_display`,
        [mainBrandId, monthYear],
      ),

      // ── Competitor list (for creating detail slides) ───────────────────────
      query(
        `SELECT DISTINCT brand_name_display
         FROM l2_socmed.ig_competitor_overview
         WHERE main_brand_id = $1
         ORDER BY brand_name_display`,
        [mainBrandId],
      ),
    ]);

    const p = (v: any): number | null => (v == null ? null : parseFloat(v));

    const igTable = (igRes as any[]).map((r) => ({
      competitor: r.competitor,
      followers_inc: p(r.followers_inc),
      followers_growth: p(r.followers_growth),
      ig_engagement: p(r.ig_engagement),
      ig_engagement_growth: p(r.ig_engagement_growth),
      er_folls: p(r.er_folls),
    }));

    const ttMain = (ttMainRes as any[])[0];
    const ttTable = [
      ...(ttMain
        ? [
            {
              competitor: 'MAIN BRAND',
              followers_growth: p(ttMain.followers_growth),
              followers_growth_inc: p(ttMain.followers_growth_inc),
              engagement: p(ttMain.engagement),
              engagement_inc: p(ttMain.engagement_inc),
              avg_views: p(ttMain.avg_views),
              avg_views_inc: p(ttMain.avg_views_inc),
            },
          ]
        : []),
      ...(ttCompRes as any[]).map((r) => ({
        competitor: r.competitor,
        followers_growth: p(r.followers_growth),
        followers_growth_inc: p(r.followers_growth_inc),
        engagement: p(r.engagement),
        engagement_inc: p(r.engagement_inc),
        avg_views: p(r.avg_views),
        avg_views_inc: p(r.avg_views_inc),
      })),
    ];

    const twTable = (twRes as any[]).map((r) => ({
      competitor: r.competitor,
      followers_growth: p(r.followers_growth),
      followers_growth_inc: p(r.followers_growth_inc),
      engagement: p(r.engagement),
      engagement_inc: p(r.engagement_inc),
      er_folls: p(r.er_folls),
    }));

    const allCompetitors: string[] = (compListRes as any[]).map((r) => r.brand_name_display);

    return NextResponse.json({ igTable, ttTable, twTable, allCompetitors, brand, period });
  } catch (err: any) {
    console.error('[competitor-overview] error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
