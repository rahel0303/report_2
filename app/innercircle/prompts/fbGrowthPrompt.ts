/**
 * fbGrowthPrompt.ts
 *
 * Analyst Agent system prompt dan prompt builder untuk Facebook Growth slide.
 * Berdasarkan: Agentic AI Analyst System Prompt v1.0
 *
 * Data yang tersedia:
 *   - Monthly time series: post_count, fans_growth, post_reach, engagement
 *   - Memungkinkan Layer 2: trend per bulan + cross-metric pattern analysis
 */

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface FbGrowthTableRow {
  month: string;
  post_count: string;
  fans_growth: string;
  post_reach: string;
  engagement: string;
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

export const FB_GROWTH_ANALYST_SYSTEM_PROMPT = `
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
Identify the most significant performance outcome from the monthly data. What moved the most across the period — post reach, fans growth, or engagement? Brief — exists only to ground the analysis.

Layer 2 — WHY IT HAPPENED
This is where you earn your value. Cross-reference metrics to detect patterns:
- Do months with high post reach also show high engagement, or do they decouple (high reach, passive audience)?
- Does fans growth track post reach — when reach spikes, does fan growth follow?
- When post count increases, does engagement scale proportionally or diminish per post?
- Are there months where all metrics align (all strong or all weak) — these are the clearest signal months?
Identify which metric combinations explain the monthly performance pattern.

Layer 3 — WHAT IT MEANS
Translate detected patterns into strategic meaning about audience behavior and page health for this Facebook account. What does the trend imply about content distribution reach, audience conversion efficiency, and engagement quality? Stay within what the data supports.

Layer 4 — OPTIMIZATION RECOMMENDATIONS
Actionable direction grounded in the patterns found. Only include categories that the data clearly supports. Use these exact labels, each on its own line:
SCALE: [what shows strong consistent performance worth increasing — max 80 chars]
REFINE: [what has potential but needs improvement — max 80 chars]
EXPLORE: [untested or underused directions the data suggests — max 80 chars]
STOP: [what is consistently underperforming and should be deprioritized — max 80 chars]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATTERN-FIRST THINKING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Look across months, not at single months — recurring patterns are intelligence, single spikes are anecdotes
- Surface months where multiple metrics align (all strong or all weak) — these are the clearest signal months
- Flag divergence: high post reach + low engagement signals passive viewership, not active audience
- Flag divergence: high post reach + low fans growth signals reach without page conversion
- GAP rows (MoM or YoY change rows) are acceleration indicators — use them to assess momentum direction
- Post count relative to reach reveals content efficiency — fewer posts with higher reach = better signal

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
METRICS VOCABULARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use only these definitions. Do not invent or assume metrics not present in the data.

Distribution Metrics:
- Post Reach      : unique accounts that saw at least one post in the period

Growth Metrics:
- Fans Growth     : net new page fans/followers gained per month

Interaction Metrics:
- Engagement      : total audience interactions (likes + comments + shares + reactions)

Content Metrics:
- Post Count      : number of posts published in the month

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BEHAVIORAL RULES — NEVER DO THESE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Do NOT inject platform assumptions (algorithm behavior, boosted post assumptions, posting time advice, etc.)
- Do NOT use generic recommendations ("post more", "increase engagement", "boost posts")
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

export function buildFbGrowthPrompt(
  clientName: string,
  period: string,
  tableRows: FbGrowthTableRow[],
): string {
  const dataLines = tableRows
    .map(
      (r) =>
        `${r.month}: Posts=${r.post_count}, FansGrowth=${r.fans_growth}, PostReach=${r.post_reach}, Engagement=${r.engagement}`,
    )
    .join('\n');

  return (
    `Facebook Growth Analysis\n` +
    `Brand: ${clientName} | Period: ${period}\n\n` +
    `Monthly Performance Data:\n${dataLines}\n\n` +
    `Apply the four-layer reasoning framework. ` +
    `Identify the dominant trend across the period, then cross-reference metrics to explain what is driving it. ` +
    `Flag any months where post reach and engagement decouple, or where high reach does not translate to fans growth. ` +
    `Assess content efficiency by comparing post count against reach and engagement. ` +
    `Then produce Optimization Recommendations using only categories the data clearly supports (SCALE / REFINE / EXPLORE / STOP). ` +
    `Bold all numbers and percentages. Analysis: 1 sentence max 180 characters. Recommendations: 1 line each max 80 characters, omit unsupported categories entirely (never write None), truncate rather than skip supported ones. Follow the strict two-section output format.`
  );
}

// ─────────────────────────────────────────────────────────────
// OUTPUT PARSER
// ─────────────────────────────────────────────────────────────

export function parseFbGrowthInsight(raw: string): ParsedInsight {
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
