import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

// Matches overview_page_3.py SQL
// Fetches daily sentiment counts for all channels
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const brand = searchParams.get('brand');
  const period = searchParams.get('period'); // "January 2026"

  if (!brand || !period) {
    return NextResponse.json({ error: 'Missing brand or period' }, { status: 400 });
  }

  // Parse "January 2026" → "01-2026"
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

  const monthYearMMYYYY = `${mm}-${yearStr}`;

  const sql = `
    SELECT
      post_date,
      COALESCE(sentiment_neutral, 0)  AS neutral,
      COALESCE(sentiment_positive, 0) AS positive,
      COALESCE(sentiment_negative, 0) AS negative,
      neutral_text,
      positive_text,
      negative_text
    FROM l2_socmed.all_channel_daily_sentiment_count
    WHERE LOWER(brand_name_display) = LOWER($1)
      AND month_year = $2
    ORDER BY post_date;
  `;

  const targetPrefix = `${yearStr}-${mm}`;

  const toDateStr = (v: unknown): string => {
    if (v instanceof Date) {
      const y = v.getFullYear();
      const mo = String(v.getMonth() + 1).padStart(2, '0');
      const d = String(v.getDate()).padStart(2, '0');
      return `${y}-${mo}-${d}`;
    }
    return String(v).slice(0, 10);
  };

  try {
    const rawRows = await query<{
      post_date: unknown;
      neutral: number;
      positive: number;
      negative: number;
      neutral_text: string | null;
      positive_text: string | null;
      negative_text: string | null;
    }>(sql, [brand, monthYearMMYYYY]);

    const rows = rawRows
      .map((r) => ({ ...r, post_date: toDateStr(r.post_date) }))
      .filter((r) => r.post_date.startsWith(targetPrefix));

    // Aggregate totals for percentage boxes
    const totals = rows.reduce(
      (acc, r) => ({
        positive: acc.positive + Number(r.positive),
        neutral: acc.neutral + Number(r.neutral),
        negative: acc.negative + Number(r.negative),
      }),
      { positive: 0, neutral: 0, negative: 0 },
    );
    const total = totals.positive + totals.neutral + totals.negative || 1;

    // Helper: tokenize text into word frequencies
    function tokenize(texts: (string | null)[]): Record<string, number> {
      const freq: Record<string, number> = {};
      const words = texts
        .join(' ')
        .toLowerCase()
        .replace(/https?:\/\/\S+/g, '')
        .replace(/@\w+/g, '')
        .replace(/#\w+/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2);
      for (const w of words) freq[w] = (freq[w] || 0) + 1;
      return freq;
    }
    function topN(freq: Record<string, number>, n: number) {
      return Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([word, count]) => ({ word, count }));
    }

    const positiveKeywords = topN(tokenize(rows.map((r) => r.positive_text)), 50);
    const neutralKeywords = topN(tokenize(rows.map((r) => r.neutral_text)), 50);
    const negativeKeywords = topN(tokenize(rows.map((r) => r.negative_text)), 50);
    // Combined for backward compat
    const topKeywords = topN(
      tokenize(rows.map((r) => [r.positive_text, r.neutral_text, r.negative_text].join(' '))),
      40,
    );

    return NextResponse.json({
      data: rows,
      totals: {
        positive: totals.positive,
        neutral: totals.neutral,
        negative: totals.negative,
        positive_pct: (totals.positive / total) * 100,
        neutral_pct: (totals.neutral / total) * 100,
        negative_pct: (totals.negative / total) * 100,
      },
      keywords: topKeywords,
      positiveKeywords,
      neutralKeywords,
      negativeKeywords,
      brand,
      period,
    });
  } catch (error) {
    console.error('[innercircle/all-channel-sentiment] Error:', error);
    return NextResponse.json({ error: String(error), data: [] }, { status: 500 });
  }
}
