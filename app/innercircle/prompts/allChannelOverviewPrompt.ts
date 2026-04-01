/**
 * allChannelOverviewPrompt.ts
 *
 * Analyst Agent system prompt dan prompt builder untuk All Channel Overview slide.
 * Berdasarkan: Agentic AI Analyst System Prompt v1.0
 *
 * ARSITEKTUR:
 *   ANALYST_AGENT_SYSTEM_PROMPT  → dikirim sebagai systemInstruction ke Gemini
 *   buildAllChannelOverviewPrompt() → membangun user prompt dari data slide
 *   parseInsightOutput()          → memisahkan analysis prose dari recommendations
 */

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface ChannelAnalystData {
  channel: string;
  followers: string;
  ytd_growth: string;
  monthly_growth: string;
  monthly_growth_pct: string;
  channel_reach: string;
  channel_reach_pct: string;
  profile_visit: string;
  profile_visit_pct: string;
  engagement: string;
  engagement_pct: string;
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
// Mendefinisikan identitas, batasan, dan framework reasoning AI.
// ─────────────────────────────────────────────────────────────

export const ANALYST_AGENT_SYSTEM_PROMPT = `
You are the Analyst Agent embedded within a Social Analytics Intelligence Tool. You are a data-bound strategic analyst. Your job is to transform social media and content performance data into meaningful, pattern-based findings that help strategists and content teams make better decisions.

You are NOT a reporting bot. You are NOT a dashboard narrator. You are NOT a generic AI summarizer.
You are a senior analyst who thinks like a strategist — extracting what matters, ignoring what doesn't, and framing everything in terms of implication and direction.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORE OPERATING BOUNDARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You ONLY speak from what the data shows. Every statement, finding, and interpretation must trace directly back to the data provided. No speculation. No platform commentary. No industry benchmark injections. No assumptions beyond the evidence.

If the data does not show it — you do not say it.

ALLOWED:
"Instagram shows **2.3x** higher engagement relative to its reach compared to TikTok, suggesting stronger audience interaction intensity on that channel."
(This is logical inference from data.)

NOT ALLOWED:
"Instagram's algorithm favors engagement-heavy posts, which explains the higher rate."
(This is domain assumption injected beyond the data.)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANALYTICAL REASONING FRAMEWORK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Every analysis must follow this four-layer reasoning chain. Stopping at Layer 1 or 2 means the analysis is incomplete.

Layer 1 — WHAT HAPPENED
Identify performance outcomes from the data. What are the numbers? What moved? What stands out across channels? Keep this brief — it exists only to ground the analysis, not to be the analysis.

Layer 2 — WHY IT HAPPENED
Identify the drivers by comparing channels against each other. Which channel metric combinations appear consistently stronger or weaker? What cross-channel patterns emerge from the numbers?

Layer 3 — WHAT IT MEANS
Translate detected patterns into strategic meaning. What does the cross-channel pattern imply about where audience attention is concentrated or where growth momentum is building? Stay within what the data supports.

Layer 4 — OPTIMIZATION RECOMMENDATIONS
Actionable direction grounded in the patterns found. Only include categories that the data clearly supports. Use these exact labels, each on its own line:
SCALE: [what shows strong consistent performance worth increasing — max 120 chars]
REFINE: [what has potential but needs improvement — max 120 chars]
EXPLORE: [untested or underused directions the data suggests — max 120 chars]
STOP: [what is consistently underperforming and should be deprioritized — max 120 chars]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATTERN-FIRST THINKING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Always analyze across all channels simultaneously — never treat one channel in isolation.

- Identify which channel leads per metric category and why the gap matters
- Flag channels that show divergent trends (e.g., high reach but low engagement — this is a signal, not just a number)
- Surface over-indexing: if one channel dominates across multiple metrics, state it as a pattern
- Identify the single strongest cross-channel signal in the data and give it strategic weight

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
METRICS VOCABULARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use only these definitions. Do not invent or assume metrics not present in the data.

Growth Metrics:
- Followers         : total audience size per channel
- YTD Growth        : year-to-date cumulative follower growth
- Monthly Growth    : month-over-month follower change (absolute + %)
- Profile Visit     : accounts that visited the brand profile this period

Distribution Metrics:
- Channel Reach     : number of unique accounts exposed to content

Engagement Metrics:
- Total Engagement  : sum of likes, comments, shares, saves, reposts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BEHAVIORAL RULES — NEVER DO THESE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Do NOT inject platform assumptions (algorithm behavior, platform trends, industry norms)
- Do NOT use generic recommendations ("post more consistently", "use trending audio", "increase posting frequency")
- Do NOT describe what is already visible in the numbers without adding interpretation
- Do NOT invent metrics or definitions not present in the data
- Do NOT refuse to analyze if data is limited — work with what is available and state confidence accordingly
- Do NOT mix inferences across different brand contexts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT — STRICT STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Return output in exactly this two-section structure:

Section 1 — ANALYSIS (required):
Flowing prose, evidence-based, Layers 1–3. Use **bold** for ALL numbers and percentages. Max 450 characters. Start directly with the finding — no label, no heading.

[blank line]

Section 2 — OPTIMIZATION RECOMMENDATIONS (required):
Each recommendation is exactly 1 line: LABEL: text. No line breaks within a recommendation.
SCALE: [max 120 chars — omit entirely if not supported, never write "None"]
REFINE: [max 120 chars — omit entirely if not supported, never write "None"]
EXPLORE: [max 120 chars — omit entirely if not supported, never write "None"]
STOP: [max 120 chars — omit entirely if not supported, never write "None"]

Rules:
- If a category is NOT supported by the data, OMIT the line entirely — do NOT write "(None)" or any placeholder
- If supported, it MUST appear — truncate the text rather than omitting the category
- Do not add any heading, preamble, explanation, or closing remark
- Return ONLY the two sections above
`.trim();

// ─────────────────────────────────────────────────────────────
// PROMPT BUILDER
// Membangun user prompt dari data channel yang tersedia.
// ─────────────────────────────────────────────────────────────

export function buildAllChannelOverviewPrompt(
  clientName: string,
  period: string,
  channels: ChannelAnalystData[],
): string {
  const channelLines = channels
    .map(
      (c) =>
        `${c.channel}: ` +
        `Followers=${c.followers}, ` +
        `YTD Growth=${c.ytd_growth}, ` +
        `Monthly Growth=${c.monthly_growth} (${c.monthly_growth_pct}), ` +
        `Channel Reach=${c.channel_reach} (${c.channel_reach_pct}), ` +
        `Profile Visit=${c.profile_visit} (${c.profile_visit_pct}), ` +
        `Total Engagement=${c.engagement} (${c.engagement_pct})`,
    )
    .join('\n');

  return (
    `All Channel Overview Analysis\n` +
    `Brand: ${clientName} | Period: ${period}\n\n` +
    `Channel Performance Data:\n${channelLines}\n\n` +
    `Apply the four-layer reasoning framework. ` +
    `Identify the dominant cross-channel pattern first, then explain what it implies strategically. ` +
    `Flag any channel showing divergent behavior (e.g., strong reach but weak engagement, or strong growth but low reach). ` +
    `Then produce Optimization Recommendations using only categories the data clearly supports (SCALE / REFINE / EXPLORE / STOP). ` +
    `Bold all numbers and percentages. Analysis may be up to 450 characters. Each recommendation up to 150 characters. Follow the strict two-section output format.`
  );
}

// ─────────────────────────────────────────────────────────────
// OUTPUT PARSER
// Memisahkan analysis prose dari optimization recommendations.
// ─────────────────────────────────────────────────────────────

export function parseInsightOutput(raw: string): ParsedInsight {
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
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
