import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

// Matches overview_page_2.py SQL
// month_year format for IG/FB/TW is "MM-YYYY", TikTok is "YYYY-MM"
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const brand = searchParams.get('brand');
  const period = searchParams.get('period'); // "January 2026"

  if (!brand || !period) {
    return NextResponse.json({ error: 'Missing brand or period' }, { status: 400 });
  }

  // Parse "January 2026" → "01-2026" and "2026-01"
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

  const monthYearMMYYYY = `${mm}-${yearStr}`; // "01-2026" for IG/FB/TW
  const monthYearYYYYMM = `${yearStr}-${mm}`; // "2026-01" for TikTok

  const sql = `
    WITH params AS (
      SELECT $1::text AS brand, $2::text AS month_year_mmyyyy, $3::text AS month_year_yyyymm
    )

    -- Instagram
    , ig AS (
      SELECT
        'Instagram'::text AS channel,
        i.followers,
        o.ytd_growth,
        i.followers_growth AS monthly_growth,
        i.followers_growth_gap AS monthly_growth_pct,
        o.channel_reach,
        o.channel_reach_inc AS channel_reach_pct,
        i.profile_visit,
        i.profile_visit_gap AS profile_visit_pct,
        i.total_engagement AS engagement,
        i.total_engagement_gap AS engagement_pct
      FROM l2_socmed.ig_profile_overview i
      LEFT JOIN l2_socmed.overview_ytd_growth o
        ON LOWER(o.brand_name_display) = LOWER(i.brand_name_display)
       AND o.month_year = i.month_year
       AND LOWER(o.channel) = 'instagram'
      JOIN params p ON LOWER(i.brand_name_display) = LOWER(p.brand)
       AND i.month_year = p.month_year_mmyyyy
    )

    -- TikTok
    , tt AS (
      SELECT
        'TikTok'::text AS channel,
        t.followers,
        o.ytd_growth,
        t.followers_growth AS monthly_growth,
        t.followers_growth_inc AS monthly_growth_pct,
        o.channel_reach,
        o.channel_reach_inc AS channel_reach_pct,
        t.profile_visit,
        t.profile_visit_inc AS profile_visit_pct,
        tp.engagement_a AS engagement,
        tp.engagement_a_inc AS engagement_pct
      FROM l2_socmed.tiktok_profile_monthly t
      LEFT JOIN l2_socmed.overview_ytd_growth o
        ON LOWER(o.brand_name_display) = LOWER(t.brand_name_display)
       AND (o.month_year = t.month_year OR o.month_year = TO_CHAR(TO_DATE(t.month_year,'YYYY-MM'),'MM-YYYY'))
       AND LOWER(o.channel) = 'tiktok'
      LEFT JOIN l2_socmed.tiktok_post_monthly tp
        ON LOWER(tp.brand_name_display) = LOWER(t.brand_name_display)
       AND (tp.month_year = t.month_year OR tp.month_year = TO_CHAR(TO_DATE(t.month_year,'YYYY-MM'),'MM-YYYY'))
      JOIN params p ON LOWER(t.brand_name_display) = LOWER(p.brand)
       AND (t.month_year = p.month_year_yyyymm OR t.month_year = p.month_year_mmyyyy)
    )

    -- Facebook
    , fb AS (
      SELECT
        'Facebook'::text AS channel,
        f.followers,
        o.ytd_growth,
        f.followers_growth AS monthly_growth,
        f.followers_growth_gap AS monthly_growth_pct,
        o.channel_reach,
        o.channel_reach_inc AS channel_reach_pct,
        f.profile_visit,
        f.profile_visit_gap AS profile_visit_pct,
        f.total_engagement AS engagement,
        f.total_engagement_gap AS engagement_pct
      FROM l2_socmed.fb_profile_overview f
      LEFT JOIN l2_socmed.overview_ytd_growth o
        ON LOWER(o.brand_name_display) = LOWER(f.brand_name_display)
       AND o.month_year = f.month_year
       AND LOWER(o.channel) = 'facebook'
      JOIN params p ON LOWER(f.brand_name_display) = LOWER(p.brand)
       AND f.month_year = p.month_year_mmyyyy
    )

    -- Twitter
    , tw AS (
      SELECT
        'Twitter'::text AS channel,
        twm.followers_count AS followers,
        o.ytd_growth,
        twm.followers_growth AS monthly_growth,
        twm.followers_growth_inc AS monthly_growth_pct,
        o.channel_reach,
        o.channel_reach_inc AS channel_reach_pct,
        twm.profile_visit_month AS profile_visit,
        twm.profile_visit_inc AS profile_visit_pct,
        twm.engagement_a AS engagement,
        twm.engagement_a_inc AS engagement_pct
      FROM l2_socmed.twitter_monthly_profile_metric twm
      JOIN l1_socmed.dim_brands db ON db.id = twm.brand_id
      LEFT JOIN l2_socmed.overview_ytd_growth o
        ON o.brand_id = twm.brand_id
       AND (o.month_year = twm.month_year OR o.month_year = TO_CHAR(TO_DATE(twm.month_year,'YYYY-MM'),'MM-YYYY'))
       AND LOWER(o.channel) = 'twitter'
      JOIN params p ON LOWER(db.brand_name_display) = LOWER(p.brand)
       AND (twm.month_year = p.month_year_mmyyyy OR twm.month_year = p.month_year_yyyymm)
    )

    SELECT * FROM ig
    UNION ALL SELECT * FROM tt
    UNION ALL SELECT * FROM fb
    UNION ALL SELECT * FROM tw
    ORDER BY channel;
  `;

  try {
    const rows = await query<{
      channel: string;
      followers: number | null;
      ytd_growth: number | null;
      monthly_growth: number | null;
      monthly_growth_pct: number | null;
      channel_reach: number | null;
      channel_reach_pct: number | null;
      profile_visit: number | null;
      profile_visit_pct: number | null;
      engagement: number | null;
      engagement_pct: number | null;
    }>(sql, [brand, monthYearMMYYYY, monthYearYYYYMM]);

    return NextResponse.json({ data: rows, brand, period });
  } catch (error) {
    console.error('[innercircle/all-channel-overview] Error:', error);
    return NextResponse.json({ error: String(error), data: [] }, { status: 500 });
  }
}
