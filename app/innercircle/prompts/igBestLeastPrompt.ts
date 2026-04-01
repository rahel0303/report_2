/**
 * igBestLeastPrompt.ts
 *
 * Analyst Agent system prompt dan prompt builder untuk Instagram Best vs Least slide.
 * Berdasarkan: Agentic AI Analyst System Prompt v1.0
 *
 * Data yang tersedia:
 *   - Best 5 posts vs Least 5 posts by engagement rate
 *   - Per post metrics: follows, reach, engagement, engagement_rate (%)
 *   - Memungkinkan Layer 2: cross-group pattern comparison between top and bottom performers
 */

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface PostMetricSummary {
  rank: number;
  follows: string;
  reach: string;
  engagement: string;
  er: string;
}

export interface IgBestLeastData {
  best: PostMetricSummary[];
  least: PostMetricSummary[];
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

export const IG_BEST_LEAST_ANALYST_SYSTEM_PROMPT = `
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
Identify the most significant performance gap between Best 5 and Least 5 posts. What is the dominant difference in ER, reach, or engagement between the two groups? Brief — exists only to ground the analysis.

Layer 2 — WHY IT HAPPENED
This is where you earn your value. Cross-compare Best vs Least to detect patterns:
- Does the Best group show higher reach AND higher engagement, or only higher ER at lower reach?
- Are saves and shares consistent with ER rankings, or do some posts rank high on ER with low saves/shares?
- Is reach decoupled from engagement in either group (high reach but low ER, or low reach but high ER)?
- What combination of metrics consistently separates top from bottom performers?
Identify which metric combinations explain the performance gap.

Layer 3 — WHAT IT MEANS
Translate detected patterns into strategic meaning about content-audience fit. What does the gap between Best and Least imply about which content formats or approaches resonate with this audience? Stay within what the data supports.

Layer 4 — OPTIMIZATION RECOMMENDATIONS
Actionable direction grounded in the patterns found. Only include categories that the data clearly supports. Use these exact labels, each on its own line:
SCALE: [what shows strong consistent performance worth increasing — max 90 chars]
REFINE: [what has potential but needs improvement — max 90 chars]
EXPLORE: [untested or underused directions the data suggests — max 90 chars]
STOP: [what is consistently underperforming and should be deprioritized — max 90 chars]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATTERN-FIRST THINKING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Look across both groups, not at single posts — recurring patterns are intelligence, single outliers are anecdotes
- Surface posts where multiple metrics align (all strong or all weak) — these are the clearest signal posts
- Flag divergence: high reach + low ER in the Least group, or low reach + high ER in the Best group — these signal structural differences
- Identify the single clearest metric that separates top from bottom performers
- GAP between Best average and Least average is the most important signal — use it to assess the magnitude of the performance divide

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
METRICS VOCABULARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use only these definitions. Do not invent or assume metrics not present in the data.

Distribution Metrics:
- Reach          : unique accounts reached by the post

Consumption / Growth Metrics:
- Followers      : follower count at time of post (context for ER calculation)

Interaction Metrics:
- Engagement     : total audience interactions on the post

Engagement Metrics:
- ER Reach (%)   : Engagement Rate by Reach = total engagement / reach × 100

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
Flowing prose, Layers 1–3. Use **bold** for ALL numbers and percentages. STRICT LIMIT: 1 sentence, max 220 characters total. Start directly with the finding — no label, no heading, no second sentence.

[blank line]

Section 2 — OPTIMIZATION RECOMMENDATIONS (required):
Each recommendation is exactly 1 line: LABEL: text. No line breaks within a recommendation.
SCALE: [max 90 chars — omit entirely if not supported, never write "None"]
REFINE: [max 90 chars — omit entirely if not supported, never write "None"]
EXPLORE: [max 90 chars — omit entirely if not supported, never write "None"]
STOP: [max 90 chars — omit entirely if not supported, never write "None"]

Rules:
- If a category is NOT supported by the data, OMIT the line entirely — do NOT write "(None)" or any placeholder
- If supported, it MUST appear — truncate the text rather than omitting the category
- Do not add any heading, preamble, explanation, or closing remark
- Return ONLY the two sections above
`.trim();

// ─────────────────────────────────────────────────────────────
// PROMPT BUILDER
// ─────────────────────────────────────────────────────────────

export function buildIgBestLeastPrompt(
  clientName: string,
  period: string,
  data: IgBestLeastData,
): string {
  const bestLines = data.best
    .map(
      (p) =>
        `Best #${p.rank}: Follows=${p.follows}, Reach=${p.reach}, Engagement=${p.engagement}, ER=${p.er}%`,
    )
    .join('\n');

  const leastLines = data.least
    .map(
      (p) =>
        `Least #${p.rank}: Follows=${p.follows}, Reach=${p.reach}, Engagement=${p.engagement}, ER=${p.er}%`,
    )
    .join('\n');

  return (
    `Instagram Best vs Least Post Analysis\n` +
    `Brand: ${clientName} | Period: ${period}\n\n` +
    `Best 5 Posts by Engagement Rate:\n${bestLines}\n\n` +
    `Least 5 Posts by Engagement Rate:\n${leastLines}\n\n` +
    `Apply the four-layer reasoning framework. ` +
    `Compare the two groups to identify what pattern separates top from bottom performers. ` +
    `Determine whether the Best group achieves higher ER through reach, engagement, or both, and whether saves and shares are consistent with ER rankings. ` +
    `Flag any divergence between reach and ER within either group. ` +
    `Then produce Optimization Recommendations using only categories the data clearly supports (SCALE / REFINE / EXPLORE / STOP). ` +
    `Bold all numbers and percentages. Analysis: 1 sentence max 220 characters. Recommendations: 1 line each max 90 characters, omit unsupported categories entirely (never write None), truncate rather than skip supported ones. Follow the strict two-section output format.`
  );
}

// ─────────────────────────────────────────────────────────────
// FOCUSED PROMPT BUILDERS (single-group analysis)
// ─────────────────────────────────────────────────────────────

export function buildBestPostsPrompt(
  clientName: string,
  period: string,
  posts: PostMetricSummary[],
): string {
  const lines = posts
    .map((p) => `Best #${p.rank}: Follows=${p.follows}, Reach=${p.reach}, Engagement=${p.engagement}, ER=${p.er}`)
    .join('\n');
  return (
    `Instagram Top 5 Posts Analysis\n` +
    `Brand: ${clientName} | Period: ${period}\n\n` +
    `Best 5 Posts by Engagement Rate:\n${lines}\n\n` +
    `Apply the four-layer reasoning framework focused on this group only. ` +
    `Identify what metric combination makes these posts the top performers — is it high reach, high ER, or both? ` +
    `Flag any posts where reach and ER diverge. What pattern defines this group's success? ` +
    `Then produce Optimization Recommendations (SCALE / EXPLORE only — these are already top performers). ` +
    `Bold all numbers and percentages. Analysis: 1 sentence max 260 characters. Recommendations: 1 line each max 110 characters, omit unsupported categories entirely (never write None), truncate rather than skip. Follow the strict two-section output format.`
  );
}

export function buildLeastPostsPrompt(
  clientName: string,
  period: string,
  posts: PostMetricSummary[],
): string {
  const lines = posts
    .map((p) => `Least #${p.rank}: Follows=${p.follows}, Reach=${p.reach}, Engagement=${p.engagement}, ER=${p.er}`)
    .join('\n');
  return (
    `Instagram Bottom 5 Posts Analysis\n` +
    `Brand: ${clientName} | Period: ${period}\n\n` +
    `Least 5 Posts by Engagement Rate:\n${lines}\n\n` +
    `Apply the four-layer reasoning framework focused on this group only. ` +
    `Identify what metric combination defines these posts as the lowest performers — is it low reach, low ER, or both? ` +
    `Flag any divergence between reach and engagement within this group. What structural issue does this group reveal? ` +
    `Then produce Optimization Recommendations (REFINE / STOP only — these are underperformers). ` +
    `Bold all numbers and percentages. Analysis: 1 sentence max 260 characters. Recommendations: 1 line each max 110 characters, omit unsupported categories entirely (never write None), truncate rather than skip. Follow the strict two-section output format.`
  );
}

// ─────────────────────────────────────────────────────────────
// OUTPUT PARSER
// ─────────────────────────────────────────────────────────────

export function parseIgBestLeastInsight(raw: string): ParsedInsight {
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
