/**
 * igGrowthPrompt.ts
 *
 * Analyst Agent system prompt dan prompt builder untuk Instagram Growth slide.
 * Berdasarkan: Agentic AI Analyst System Prompt v1.0
 *
 * Data yang tersedia (richer dari All Channel Overview):
 *   - Monthly time series: profile reach, profile visit, followers growth,
 *     reach, engagement, likes, comments, shares, saves, ER reach, ER followers
 *   - Memungkinkan Layer 2 yang lebih dalam: trend per bulan + pattern across metrics
 */

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface IgGrowthTableRow {
  month: string;
  profileReach: string;
  profileVisit: string;
  growth: string;
  reach: string;
  engagement: string;
  likes: string;
  comments: string;
  shares: string;
  saves: string;
  erReach: string;
  erFolls: string;
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

export const IG_GROWTH_ANALYST_SYSTEM_PROMPT = `
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
Identify the most significant performance outcomes from the monthly data. What moved the most? What is the dominant trend over the period? Brief — exists only to ground the analysis.

Layer 2 — WHY IT HAPPENED
This is where you earn your value. Cross-reference metrics to detect patterns:
- Do months with high reach also show high engagement, or does reach and engagement decouple?
- Are saves and shares tracking together (sustained intent) or diverging?
- When follower growth spikes, does ER follow or decline (dilution signal)?
- Is profile visit declining even when reach is up (distribution without conversion)?
Identify which metric combinations explain the performance pattern.

Layer 3 — WHAT IT MEANS
Translate detected patterns into strategic meaning about audience behavior and content effectiveness. What does the trend imply about content-audience fit, growth quality, or engagement health? Stay within what the data supports.

Layer 4 — OPTIMIZATION RECOMMENDATIONS
Actionable direction grounded in the patterns found. Only include categories that the data clearly supports. Use these exact labels, each on its own line:
SCALE: [what shows strong consistent performance worth increasing — max 90 chars]
REFINE: [what has potential but needs improvement — max 90 chars]
EXPLORE: [untested or underused directions the data suggests — max 90 chars]
STOP: [what is consistently underperforming and should be deprioritized — max 90 chars]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATTERN-FIRST THINKING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Look across months, not at single months — recurring patterns are intelligence, single spikes are anecdotes
- Surface months where multiple metrics align (all strong or all weak) — these are the clearest signal months
- Flag divergence: high reach + low engagement, or high growth + declining ER — these signal structural issues
- Identify the period's single strongest and weakest month with the metrics that explain why
- GAP rows (MoM or YoY change rows in the data) are change indicators — use them to assess acceleration or deceleration

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
METRICS VOCABULARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use only these definitions. Do not invent or assume metrics not present in the data.

Distribution Metrics:
- Profile Reach  : unique accounts exposed to the profile/content
- Reach          : unique accounts reached by posts

Consumption / Growth Metrics:
- Profile Visit  : accounts that visited the brand profile
- Followers Growth: month-over-month follower change

Interaction Metrics:
- Likes, Comments, Shares, Saves : direct audience responses

Engagement Metrics:
- ER Reach (%)   : Engagement Rate by Reach = total engagement / reach × 100
- ER Followers (%): Engagement Rate by Followers = total engagement / followers × 100

Intent Metrics (derived from interaction data):
- Saves signal audience intent to revisit content (high value)
- Shares signal audience intent to amplify content (high value)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BEHAVIORAL RULES — NEVER DO THESE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Do NOT inject platform assumptions (algorithm behavior, posting frequency advice, trending audio, etc.)
- Do NOT use generic recommendations ("post more", "increase engagement", "use better captions")
- Do NOT describe what is already visible without adding interpretation
- Do NOT invent metrics or definitions not in the data
- Do NOT refuse to analyze if data is limited — work with what is available
- Do NOT mix inferences across different brand contexts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT — STRICT STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Return output in exactly this two-section structure:

Section 1 — ANALYSIS (required):
Flowing prose, Layers 1–3. Use **bold** for ALL numbers and percentages. STRICT LIMIT: 1 sentence, max 180 characters total. Start directly with the finding — no label, no heading, no second sentence.

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

export function buildIgGrowthAnalystPrompt(
  clientName: string,
  period: string,
  tableRows: IgGrowthTableRow[],
): string {
  const dataLines = tableRows
    .map(
      (r) =>
        `${r.month}: ProfileReach=${r.profileReach}, ProfileVisit=${r.profileVisit}, ` +
        `FollowersGrowth=${r.growth}, Reach=${r.reach}, Engagement=${r.engagement}, ` +
        `Likes=${r.likes}, Comments=${r.comments}, Shares=${r.shares}, Saves=${r.saves}, ` +
        `ER_Reach=${r.erReach}, ER_Followers=${r.erFolls}`,
    )
    .join('\n');

  return (
    `Instagram Growth Analysis\n` +
    `Brand: ${clientName} | Period: ${period}\n\n` +
    `Monthly Performance Data:\n${dataLines}\n\n` +
    `Apply the four-layer reasoning framework. ` +
    `Identify the dominant trend across the period, then cross-reference metrics to explain what is driving it. ` +
    `Flag any months where reach and engagement decouple, or where follower growth does not correlate with ER. ` +
    `Identify the strongest and weakest months with supporting metrics. ` +
    `Then produce Optimization Recommendations using only categories the data clearly supports (SCALE / REFINE / EXPLORE / STOP). ` +
    `Bold all numbers and percentages. Analysis: 1 sentence max 180 characters. Recommendations: 1 line each max 80 characters, omit unsupported categories entirely (never write None), truncate rather than skip supported ones. Follow the strict two-section output format.`
  );
}

// ─────────────────────────────────────────────────────────────
// OUTPUT PARSER
// ─────────────────────────────────────────────────────────────

export function parseIgGrowthInsight(raw: string): ParsedInsight {
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

    // Format A: "SCALE: text here" — label + text on same line
    const inline = line.match(/^(SCALE|REFINE|EXPLORE|STOP):\s*(.+)/i);
    if (inline) {
      const text = inline[2].trim();
      // Skip placeholder "None" responses
      if (!/^\(?\s*none\s*\)?\.?$/i.test(text)) {
        recommendations.push({ type: inline[1].toUpperCase() as RecommendationType, text });
      }
      i++;
      continue;
    }

    // Format B: "SCALE:" on its own line, text on the next line
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
