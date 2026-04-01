/**
 * igContentPillarPrompt.ts
 *
 * Analyst Agent system prompt dan prompt builder untuk Instagram Content Pillar slide.
 * Berdasarkan: Agentic AI Analyst System Prompt v1.0
 *
 * Data yang tersedia:
 *   - Per content pillar: lowest 6 posts vs highest 6 posts
 *   - Per post metrics: reach, engagement, ER (%), saves, shares, comments, format
 *   - Memungkinkan Layer 2: intra-pillar gap analysis between highest and lowest performers
 */

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface PillarPostSummary {
  reach: string;
  engagement: string;
  er: string;
  saves: string;
  shares: string;
  comments: string;
  format: string;
}

export interface ContentPillarAnalystData {
  pillarName: string;
  lowest: PillarPostSummary[];
  highest: PillarPostSummary[];
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

export const CONTENT_PILLAR_ANALYST_SYSTEM_PROMPT = `
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
Identify the most significant performance gap between the Highest 6 and Lowest 6 posts within this content pillar. What metric shows the largest divergence? Brief — exists only to ground the analysis.

Layer 2 — WHY IT HAPPENED
This is where you earn your value. Analyze intra-pillar patterns to detect what drives the gap:
- What metric gap is biggest between Highest and Lowest — is it ER, reach, or absolute engagement?
- Is ER in the Highest group driven by saves and shares (intent metrics), or primarily by comments and likes?
- Does post format appear to correlate with performance within this pillar — do certain formats cluster in Highest vs Lowest?
- Are saves and shares consistent with ER rankings, or do some posts rank high on ER with low intent metrics?
Identify which metric combinations and format patterns explain the intra-pillar performance gap.

Layer 3 — WHAT IT MEANS
Translate detected patterns into strategic meaning about content and format effectiveness within this pillar. What do the Highest vs Lowest patterns imply about which content approach or format drives resonance for this specific pillar? Stay within what the data supports.

Layer 4 — OPTIMIZATION RECOMMENDATIONS
Actionable direction grounded in the patterns found. Only include categories that the data clearly supports. Use these exact labels, each on its own line:
SCALE: [what shows strong consistent performance worth increasing — max 80 chars]
REFINE: [what has potential but needs improvement — max 80 chars]
EXPLORE: [untested or underused directions the data suggests — max 80 chars]
STOP: [what is consistently underperforming and should be deprioritized — max 80 chars]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATTERN-FIRST THINKING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Look across both groups within the same pillar — differences here reflect execution quality, not topic differences
- Surface posts where multiple metrics align (all strong or all weak) — these are the clearest signal posts
- Flag divergence: high reach + low ER, or high ER + low saves/shares — these signal structural content issues
- Identify whether format is a consistent differentiator between Highest and Lowest groups
- Intent metrics (saves, shares) carry more diagnostic weight than passive metrics (likes, comments) — weigh them accordingly

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
METRICS VOCABULARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use only these definitions. Do not invent or assume metrics not present in the data.

Distribution Metrics:
- Reach          : unique accounts reached by the post

Interaction Metrics:
- Engagement     : total audience interactions on the post
- Likes, Comments, Shares, Saves : direct audience responses

Engagement Metrics:
- ER (%)         : Engagement Rate by Reach = total engagement / reach × 100

Intent Metrics (derived from interaction data):
- Saves signal audience intent to revisit content (high value)
- Shares signal audience intent to amplify content (high value)

Format:
- The content delivery type (e.g. Reel, Carousel, Static, Story) — treat as a categorical variable

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
Flowing prose, Layers 1–3. Use **bold** for ALL numbers and percentages. STRICT LIMIT: 1 sentence, max 160 characters total. Start directly with the finding — no label, no heading, no second sentence.

[blank line]

Section 2 — OPTIMIZATION RECOMMENDATIONS (required):
Each recommendation is exactly 1 line: LABEL: text. No line breaks within a recommendation.
SCALE: [max 75 chars — omit entirely if not supported, never write "None"]
REFINE: [max 75 chars — omit entirely if not supported, never write "None"]
EXPLORE: [max 75 chars — omit entirely if not supported, never write "None"]
STOP: [max 75 chars — omit entirely if not supported, never write "None"]

Rules:
- If a category is NOT supported by the data, OMIT the line entirely — do NOT write "(None)" or any placeholder
- If supported, it MUST appear — truncate the text rather than omitting the category
- Do not add any heading, preamble, explanation, or closing remark
- Return ONLY the two sections above
`.trim();

// ─────────────────────────────────────────────────────────────
// PROMPT BUILDER
// ─────────────────────────────────────────────────────────────

export function buildContentPillarPrompt(
  clientName: string,
  period: string,
  data: ContentPillarAnalystData,
): string {
  const highestLines = data.highest
    .map(
      (p, idx) =>
        `Highest #${idx + 1}: Reach=${p.reach}, Engagement=${p.engagement}, ER=${p.er}%, ` +
        `Saves=${p.saves}, Shares=${p.shares}, Comments=${p.comments}, Format=${p.format}`,
    )
    .join('\n');

  const lowestLines = data.lowest
    .map(
      (p, idx) =>
        `Lowest #${idx + 1}: Reach=${p.reach}, Engagement=${p.engagement}, ER=${p.er}%, ` +
        `Saves=${p.saves}, Shares=${p.shares}, Comments=${p.comments}, Format=${p.format}`,
    )
    .join('\n');

  return (
    `Instagram Content Pillar Analysis\n` +
    `Brand: ${clientName} | Period: ${period} | Pillar: ${data.pillarName}\n\n` +
    `Highest 6 Posts within Pillar:\n${highestLines}\n\n` +
    `Lowest 6 Posts within Pillar:\n${lowestLines}\n\n` +
    `Apply the four-layer reasoning framework. ` +
    `Identify what separates highest from lowest performers within this specific content pillar. ` +
    `Determine which metric gap is largest between the two groups, whether ER is driven by intent metrics (saves/shares), and whether format correlates with performance within this pillar. ` +
    `Flag any divergence between reach and ER, or between ER and saves/shares. ` +
    `Then produce Optimization Recommendations using only categories the data clearly supports (SCALE / REFINE / EXPLORE / STOP). ` +
    `Bold all numbers and percentages. Analysis: 1 sentence max 160 characters. Recommendations: 1 line each max 75 characters, omit unsupported categories entirely (never write None), truncate rather than skip supported ones. Follow the strict two-section output format.`
  );
}

// ─────────────────────────────────────────────────────────────
// OUTPUT PARSER
// ─────────────────────────────────────────────────────────────

export function parseContentPillarInsight(raw: string): ParsedInsight {
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
