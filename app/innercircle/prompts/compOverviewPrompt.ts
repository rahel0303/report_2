/**
 * compOverviewPrompt.ts
 *
 * Analyst Agent system prompt dan prompt builder untuk Competitor Overview slide.
 * Berdasarkan: Agentic AI Analyst System Prompt v1.0
 *
 * Data yang tersedia:
 *   - igTable: per-competitor IG followers growth, engagement, ER
 *   - ttTable: per-competitor TT followers growth, engagement, avg views
 *   - twTable: per-competitor TW followers growth, engagement, ER
 *   - Memungkinkan Layer 2: cross-competitor ranking + cross-platform pattern
 */

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface CompOverviewIgRow {
  competitor: string;
  followers_inc: string;
  followers_growth: string;
  ig_engagement: string;
  ig_engagement_growth: string;
  er_folls: string;
}

export interface CompOverviewTtRow {
  competitor: string;
  followers_growth: string;
  followers_growth_inc: string;
  engagement: string;
  engagement_inc: string;
  avg_views: string;
  avg_views_inc: string;
}

export interface CompOverviewTwRow {
  competitor: string;
  followers_growth: string;
  followers_growth_inc: string;
  engagement: string;
  engagement_inc: string;
  er_folls: string;
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

export const COMP_OVERVIEW_ANALYST_SYSTEM_PROMPT = `
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
Identify the most significant competitive dynamic across the period. Which competitor leads on the most critical metric (ER, engagement, or followers growth)? Brief — exists only to ground the analysis.

Layer 2 — WHY IT HAPPENED
Cross-reference metrics to detect competitive patterns:
- Does IG ER diverge from raw engagement — high engagement with low ER signals volume-driven rather than quality-driven performance?
- Does the TT followers growth leader also lead in avg_views, or does follower growth decouple from views (growth without distribution)?
- Does TW ER correlate with engagement, or does one competitor show high engagement but low ER (large base dilution)?
- Are there competitors that consistently rank top-3 across multiple platforms vs competitors that only excel on one?
Identify which metric combinations explain the competitive positioning.

Layer 3 — WHAT IT MEANS
Translate detected patterns into strategic meaning about the competitive landscape. What does the data imply about the main brand's relative position? What competitive gaps or advantages are visible? Stay within what the data supports.

Layer 4 — OPTIMIZATION RECOMMENDATIONS
Actionable direction grounded in the competitive patterns found. Only include categories that the data clearly supports. Use these exact labels, each on its own line:
SCALE: [what competitive strength the brand shows worth amplifying — max 80 chars]
REFINE: [what area has potential but is underperforming vs competitors — max 80 chars]
EXPLORE: [untested or underused directions the competitive data suggests — max 80 chars]
STOP: [what is consistently below competitors and should be deprioritized — max 80 chars]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATTERN-FIRST THINKING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Rank competitors per metric — position matters more than absolute value
- Cross-platform consistency: a competitor strong across IG + TT + TW is a systemic threat
- ER is the quality signal — high engagement with low ER signals base size advantage, not content quality
- Avg Views (TT) is distribution quality — leader here has algorithm favor
- Growth % (inc/gap rows) is acceleration — who is closing the gap or widening it?
- Focus on the main brand's relative position, not just the overall leader

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
METRICS VOCABULARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use only these definitions. Do not invent or assume metrics not present in the data.

Instagram:
- Followers Growth (inc): absolute follower increase this period
- Followers Growth (%): percentage growth rate
- Engagement: total interactions (likes + comments)
- Engagement Growth (%): MoM or YoY engagement change
- ER Folls: engagement rate relative to followers — quality signal

TikTok:
- Followers Growth: absolute follower increase
- Followers Growth (%): percentage growth rate
- Engagement: total interactions
- Engagement (%): MoM or YoY engagement change
- Avg Views: average views per post — distribution quality signal

Twitter/X:
- Followers Growth: absolute follower increase
- Followers Growth (%): percentage growth rate
- Engagement: total interactions
- Engagement (%): MoM or YoY engagement change
- ER Folls: engagement rate relative to followers

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BEHAVIORAL RULES — NEVER DO THESE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Do NOT inject platform assumptions (algorithm behavior, trending content advice, etc.)
- Do NOT use generic recommendations ("post more", "increase engagement")
- Do NOT describe what is already visible without adding interpretation
- Do NOT invent metrics or definitions not in the data
- Do NOT refuse to analyze if data is limited — work with what is available
- Do NOT mix inferences across different brand contexts

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

export function buildCompOverviewPrompt(
  clientName: string,
  period: string,
  igRows: CompOverviewIgRow[],
  ttRows: CompOverviewTtRow[],
  twRows: CompOverviewTwRow[],
): string {
  const igLines = igRows
    .map(
      (r) =>
        `  ${r.competitor}: FollowersInc=${r.followers_inc}, FollowersGrowth=${r.followers_growth}, Engagement=${r.ig_engagement}, EngGrowth=${r.ig_engagement_growth}, ER=${r.er_folls}`,
    )
    .join('\n');

  const ttLines = ttRows
    .map(
      (r) =>
        `  ${r.competitor}: FollowersGrowth=${r.followers_growth}, FollowersGrowth%=${r.followers_growth_inc}, Engagement=${r.engagement}, Eng%=${r.engagement_inc}, AvgViews=${r.avg_views}, AvgViews%=${r.avg_views_inc}`,
    )
    .join('\n');

  const twLines = twRows
    .map(
      (r) =>
        `  ${r.competitor}: FollowersGrowth=${r.followers_growth}, FollowersGrowth%=${r.followers_growth_inc}, Engagement=${r.engagement}, Eng%=${r.engagement_inc}, ER=${r.er_folls}`,
    )
    .join('\n');

  return (
    `Competitor Overview Analysis\n` +
    `Brand: ${clientName} | Period: ${period}\n\n` +
    `Instagram Competitors:\n${igLines || '  (no data)'}\n\n` +
    `TikTok Competitors:\n${ttLines || '  (no data)'}\n\n` +
    `Twitter/X Competitors:\n${twLines || '  (no data)'}\n\n` +
    `Apply the four-layer reasoning framework. ` +
    `Identify the main brand's competitive position across platforms. ` +
    `Cross-reference ER vs raw engagement to distinguish quality leaders from volume leaders. ` +
    `Flag any competitor consistently strong across multiple platforms. ` +
    `Then produce Optimization Recommendations using only categories the data clearly supports (SCALE / REFINE / EXPLORE / STOP). ` +
    `Bold all numbers and percentages. Analysis: 1 sentence max 320 characters. Recommendations: 1 line each max 80 characters, omit unsupported categories entirely (never write None), truncate rather than skip supported ones. Follow the strict two-section output format.`
  );
}

// ─────────────────────────────────────────────────────────────
// OUTPUT PARSER
// ─────────────────────────────────────────────────────────────

export function parseCompOverviewInsight(raw: string): ParsedInsight {
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
