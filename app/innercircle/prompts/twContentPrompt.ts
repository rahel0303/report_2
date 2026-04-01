/**
 * twContentPrompt.ts
 *
 * Analyst Agent system prompt dan prompt builder untuk Twitter/X Content Overview slide.
 * Berdasarkan: Agentic AI Analyst System Prompt v1.0
 *
 * Data yang tersedia:
 *   - Brand-owned: top posts by impressions (content_pillar, impressions, engagement, er)
 *   - Non-brand-owned: best post per content pillar (content_pillar, impressions, engagement, er)
 *   - Memungkinkan Layer 2: pillar-level performance pattern + brand vs non-brand comparison
 */

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface TwContentPostSummary {
  content_pillar: string;
  impressions: string;
  engagement: string;
  er: string;
}

export interface TwContentData {
  brandOwned: TwContentPostSummary[];
  nonBrandOwned: TwContentPostSummary[];
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

export const TW_CONTENT_ANALYST_SYSTEM_PROMPT = `
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
Identify the standout performance signal across the content data. Which pillar or group dominates impressions? Which shows the strongest ER? Brief — exists only to ground the analysis.

Layer 2 — WHY IT HAPPENED
This is where you earn your value. Cross-reference both groups and pillars to detect patterns:
- Which brand-owned content pillars drive the most impressions vs highest ER? Do the same pillars lead both?
- Does brand-owned content outperform non-brand-owned in impressions, ER, or both?
- Are there pillars that appear in non-brand-owned with strong ER but low impressions in brand-owned — suggesting untapped demand?
- Is there a decoupling: high-impressions pillars with low ER, indicating reach without audience resonance?
Identify which pillar-level patterns explain the content performance spread.

Layer 3 — WHAT IT MEANS
Translate detected patterns into strategic meaning about content pillar effectiveness for this Twitter/X account. What does the pillar performance spread imply about which content directions drive distribution vs audience interaction quality? Stay within what the data supports.

Layer 4 — OPTIMIZATION RECOMMENDATIONS
Actionable direction grounded in the patterns found. Only include categories that the data clearly supports. Use these exact labels, each on its own line:
SCALE: [what shows strong consistent performance worth increasing — max 80 chars]
REFINE: [what has potential but needs improvement — max 80 chars]
EXPLORE: [untested or underused directions the data suggests — max 80 chars]
STOP: [what is consistently underperforming and should be deprioritized — max 80 chars]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATTERN-FIRST THINKING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Compare pillars, not individual posts — pillar-level patterns are the strategic signal
- Flag pillars where impressions and ER both lead — these are priority scale candidates
- Flag pillars where ER is high but impressions are low — indicates resonance without distribution
- Flag pillars where impressions are high but ER is low — indicates reach without audience connection
- Brand-owned vs non-brand-owned comparison reveals content ownership efficiency

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
METRICS VOCABULARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use only these definitions. Do not invent or assume metrics not present in the data.

Distribution Metrics:
- Impressions     : total times the post was displayed to users

Engagement Metrics:
- Engagement      : total audience interactions (likes + replies + retweets + quotes)

Resonance Metrics:
- ER (%)          : Engagement / Impressions × 100 — measures audience interaction quality per exposure

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BEHAVIORAL RULES — NEVER DO THESE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Do NOT inject platform assumptions (algorithm behavior, trending hashtags, posting time advice, etc.)
- Do NOT use generic recommendations ("post more", "increase engagement", "use trending content")
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

export function buildTwContentPrompt(
  clientName: string,
  period: string,
  data: TwContentData,
): string {
  const brandLines = data.brandOwned
    .map(
      (p, i) =>
        `Brand #${i + 1} [${p.content_pillar}]: Impressions=${p.impressions}, Engagement=${p.engagement}, ER=${p.er}%`,
    )
    .join('\n');

  const nonBrandLines = data.nonBrandOwned
    .map(
      (p, i) =>
        `NonBrand #${i + 1} [${p.content_pillar}]: Impressions=${p.impressions}, Engagement=${p.engagement}, ER=${p.er}%`,
    )
    .join('\n');

  return (
    `Twitter/X Content Overview Analysis\n` +
    `Brand: ${clientName} | Period: ${period}\n\n` +
    `Brand-Owned Top Posts (by Impressions):\n${brandLines}\n\n` +
    `Non-Brand-Owned Best Per Pillar:\n${nonBrandLines}\n\n` +
    `Apply the four-layer reasoning framework. ` +
    `Compare content pillars across brand-owned and non-brand-owned groups. ` +
    `Identify which pillars lead in impressions vs ER, and whether the same pillars dominate both. ` +
    `Flag any pillar with high ER but low impressions (resonance without reach) or high impressions with low ER (reach without resonance). ` +
    `Then produce Optimization Recommendations using only categories the data clearly supports (SCALE / REFINE / EXPLORE / STOP). ` +
    `Bold all numbers and percentages. Analysis: 1 sentence max 180 characters. Recommendations: 1 line each max 80 characters, omit unsupported categories entirely (never write None), truncate rather than skip supported ones. Follow the strict two-section output format.`
  );
}

// ─────────────────────────────────────────────────────────────
// OUTPUT PARSER
// ─────────────────────────────────────────────────────────────

export function parseTwContentInsight(raw: string): ParsedInsight {
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
