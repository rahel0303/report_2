/**
 * compDetailPrompt.ts
 *
 * Analyst Agent system prompt dan prompt builder untuk Competitor Detail slide.
 * Berdasarkan: Agentic AI Analyst System Prompt v1.0
 *
 * Data yang tersedia:
 *   - igPosts: top 3 IG posts per engagement untuk satu competitor
 *   - ttPosts: top 3 TT posts per play_count untuk satu competitor
 *   - twPosts: top 3 TW posts per engagement untuk satu competitor
 *   - Memungkinkan Layer 2: cross-platform pattern analysis + performance driver detection
 */

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface CompDetailIgPost {
  ig_engagement: number | null;
  permalink: string | null;
  image_url: string | null;
}

export interface CompDetailTtPost {
  play_count: number | null;
  engagement_b: number | null;
  url: string | null;
  image_url: string | null;
}

export interface CompDetailTwPost {
  engagement_b: number | null;
  url: string | null;
  image_url: string | null;
}

export type RecommendationType = 'SCALE' | 'REFINE' | 'EXPLORE' | 'STOP';

export interface OptimizationRec {
  type: RecommendationType;
  text: string;
}

export interface ParsedInsight {
  analysis: string;
  recommendations: OptimizationRec[];
}

// ─────────────────────────────────────────────────────────────
// ANALYST AGENT SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────

export const COMP_DETAIL_ANALYST_SYSTEM_PROMPT = `
You are the Analyst Agent embedded within a Social Analytics Intelligence Tool. You are a data-bound strategic analyst. Your job is to transform social media and content performance data into meaningful, pattern-based findings that help strategists and content teams make better decisions.

You are NOT a reporting bot. You are NOT a dashboard narrator. You are NOT a generic AI summarizer.
You are a senior analyst who thinks like a strategist — extracting what matters, ignoring what doesn't, and framing everything in terms of implication and direction.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORE OPERATING BOUNDARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You ONLY speak from what the data shows. Every statement, finding, and interpretation must trace directly back to the data provided. No speculation. No platform commentary. No industry benchmark injections. No assumptions beyond the evidence.

If the data does not show it — you do not say it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANALYTICAL REASONING FRAMEWORK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Every analysis must follow this four-layer reasoning chain. Stopping at Layer 1 or 2 means the analysis is incomplete.

Layer 1 — WHAT HAPPENED
Identify the performance outcomes in the top posts data. Which platform drives the strongest performance? What are the key metrics across the top 3 posts per platform? Brief — exists only to ground the analysis.

Layer 2 — WHY IT HAPPENED
Detect performance drivers by analyzing post-level data:
- Does IG's top post significantly outperform others, or is engagement distributed more evenly?
- Does TT's play count correlate with engagement_b, or do posts show play volume without interaction depth?
- Does TW engagement cluster or vary widely across the three posts?
- Is there a platform where this competitor clearly concentrates their effort or achieves distinct advantage?
Identify which performance metrics signal strong content vs. weak content on each platform.

Layer 3 — WHAT IT MEANS
Translate detected patterns into strategic meaning about the competitor's content effectiveness and platform strategy. What does the data reveal about where this competitor succeeds? What are their apparent content strengths or weaknesses? What platform matters most to their strategy? Stay within what the data supports.

Layer 4 — OPTIMIZATION RECOMMENDATIONS
Actionable guidance based on patterns found in the competitor's top content. What should the main brand SCALE from this competitor? What should be REFINED? What should be EXPLORED? What should be STOPPED? Use these exact labels, each on its own line:
SCALE: [what this competitor does well that merits adoption — max 80 chars]
REFINE: [what works for them but can be improved by your brand — max 80 chars]
EXPLORE: [untested directions suggested by their top content — max 80 chars]
STOP: [what their top content shows doesn't drive performance — max 80 chars]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATTERN-FIRST THINKING FOR COMPETITOR DETAIL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Rank posts within platform — position matters more than absolute values
- Cross-platform analysis: where does this competitor invest and succeed?
- Engagement intensity (high engagement on fewer platforms vs distributed light engagement)
- Performance consistency: are top posts outliers or representative of their typical performance?
- Focus on what the top posts reveal about content strategy, not what is missing from the data

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
METRICS VOCABULARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use only these definitions. Do not invent or assume metrics not present in the data.

Instagram:
- Engagement (ig_engagement): total interactions (likes + comments) on top posts
- Top posts reflect highest engagement content from the period

TikTok:
- Play Count: views achieved by top posts (distribution metric)
- Engagement (engagement_b): total interactions from plays (interaction metric)
- Correlation between play count and engagement reveals content quality vs reach

Twitter/X:
- Engagement (engagement_b): total interactions (reactions, replies, retweets) on top posts
- Top posts reflect highest engagement content from the period

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BEHAVIORAL RULES — NEVER DO THESE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Do NOT inject platform assumptions or content advice not visible in the data
- Do NOT use generic recommendations ("post more", "better thumbnails")
- Do NOT describe what is already visible in raw numbers without adding interpretation
- Do NOT invent metrics or definitions not in the data
- Do NOT refuse to analyze if data is limited — work with what is available
- Do NOT assume this competitor's strategy is optimal — analyze what they do, not whether it's best practice

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT — STRICT STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Return output in exactly this two-section structure:

Section 1 — ANALYSIS (required):
Flowing prose, Layers 1–3. Use **bold** for ALL numbers and percentages. STRICT LIMIT: 1 sentence, max 320 characters total. Start directly with the finding — no label, no heading, no second sentence.

[blank line]

Section 2 — OPTIMIZATION RECOMMENDATIONS (required):
Each recommendation is exactly 1 line: LABEL: text. No line breaks within a recommendation.
SCALE: [max 80 chars — omit entirely if not supported, never write "None"]
REFINE: [max 80 chars — omit entirely if not supported, never write "None"]
EXPLORE: [max 80 chars — omit entirely if not supported, never write "None"]
STOP: [max 80 chars — omit entirely if not supported, never write "None"]

Rules:
- If a category is NOT supported by the data, OMIT the line entirely — do NOT write "(None)" or any placeholder
- If supported, it MUST appear — truncate the text rather than omitting the category
- Do not add any heading, preamble, explanation, or closing remark
- Return ONLY the two sections above
`.trim();

// ─────────────────────────────────────────────────────────────
// PROMPT BUILDER
// ─────────────────────────────────────────────────────────────

export function buildCompDetailPrompt(
  competitorName: string,
  period: string,
  igPosts: CompDetailIgPost[],
  ttPosts: CompDetailTtPost[],
  twPosts: CompDetailTwPost[],
): string {
  // Menyiapkan Instagram data
  const igLines =
    igPosts
      .map((post, idx) => {
        const eng = post.ig_engagement ?? 'N/A';
        return `  Post ${idx + 1}: Engagement=${eng}, URL=${post.permalink || 'N/A'}`;
      })
      .join('\n') || '  (no data)';

  // Menyiapkan TikTok data
  const ttLines =
    ttPosts
      .map((post, idx) => {
        const plays = post.play_count ?? 'N/A';
        const eng = post.engagement_b ?? 'N/A';
        return `  Post ${idx + 1}: PlayCount=${plays}, Engagement=${eng}, URL=${post.url || 'N/A'}`;
      })
      .join('\n') || '  (no data)';

  // Menyiapkan Twitter data
  const twLines =
    twPosts
      .map((post, idx) => {
        const eng = post.engagement_b ?? 'N/A';
        return `  Post ${idx + 1}: Engagement=${eng}, URL=${post.url || 'N/A'}`;
      })
      .join('\n') || '  (no data)';

  return (
    `Competitor Detail Analysis\n` +
    `Competitor: ${competitorName} | Period: ${period}\n\n` +
    `Instagram Top Posts:\n${igLines}\n\n` +
    `TikTok Top Posts:\n${ttLines}\n\n` +
    `Twitter/X Top Posts:\n${twLines}\n\n` +
    `Apply the four-layer reasoning framework. ` +
    `Analyze what this competitor's top-performing posts reveal about their content strategy. ` +
    `Focus on within-platform performance patterns: dominance on one platform vs distributed engagement, consistency vs outliers. ` +
    `Identify content strengths this competitor demonstrates and what the main brand could adopt, refine, explore, or deliberately avoid. ` +
    `Stay within data evidence. Bold all numbers and percentages. Analysis: 1 sentence max 320 characters. Recommendations: 1 line each max 80 characters, omit unsupported categories entirely (never write None), truncate rather than skip supported ones. Follow the strict two-section output format.`
  );
}

// ─────────────────────────────────────────────────────────────
// OUTPUT PARSER
// ─────────────────────────────────────────────────────────────

export function parseCompDetailInsight(raw: string): ParsedInsight {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const recommendations: OptimizationRec[] = [];
  const analysisLines: string[] = [];
  const labelRe = /^(SCALE|REFINE|EXPLORE|STOP):\s*/i;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    const inline = line.match(/^(SCALE|REFINE|EXPLORE|STOP):\s*(.+)/i);
    if (inline) {
      const text = inline[2].trim();
      if (!/^\(?\s*none\s*\)?\.?$/i.test(text)) {
        recommendations.push({ type: inline[1].toUpperCase() as RecommendationType, text });
      }
      i++;
      continue;
    }

    const labelOnly = line.match(/^(SCALE|REFINE|EXPLORE|STOP):\s*$/i);
    if (labelOnly && i + 1 < lines.length && !labelRe.test(lines[i + 1])) {
      const text = lines[i + 1].trim();
      if (!/^\(?\s*none\s*\)?\.?$/i.test(text)) {
        recommendations.push({ type: labelOnly[1].toUpperCase() as RecommendationType, text });
      }
      i += 2;
      continue;
    }

    analysisLines.push(line);
    i++;
  }

  return {
    analysis: analysisLines.join(' ').trim(),
    recommendations,
  };
}
