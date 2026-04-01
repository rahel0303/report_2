/**
 * compIgFocusPrompt.ts
 *
 * Analyst Agent system prompt dan prompt builder untuk Competitor IG Focus slide.
 * Berdasarkan: Agentic AI Analyst System Prompt v1.0
 *
 * Data yang tersedia:
 *   - mainBrandRow: brand's IG followers growth, post count, engagement, avg ER
 *   - compRow: competitor's IG followers growth, post count, engagement, ER
 *   - top3Posts: competitor's top 3 IG posts by engagement/ER
 *   - Memungkinkan Layer 2: head-to-head comparison + content quality signal from top posts
 */

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface CompIgFocusMainBrand {
  brand: string;
  followers_growth: string;
  followers_growth_gap: string;
  post_count: string;
  post_count_growth: string;
  total_engagement: string;
  total_engagement_gap: string;
  avg_er_folls: string;
}

export interface CompIgFocusCompRow {
  brand: string;
  ig_followers_increase: string;
  ig_followers_growth: string;
  post_count: string;
  post_count_growth: string;
  ig_engagement: string;
  ig_engagement_growth: string;
  er_folls: string;
}

export interface CompIgFocusTop3Post {
  rank: number;
  ig_engagement: string;
  likes: string;
  comments: string;
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

export const COMP_IG_FOCUS_ANALYST_SYSTEM_PROMPT = `
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
Identify the most decisive competitive difference between the main brand and the competitor on Instagram this period. Who leads on the most critical metric and by how much? Brief — exists only to ground the analysis.

Layer 2 — WHY IT HAPPENED
Cross-reference metrics to detect head-to-head patterns:
- Does the competitor's followers growth gap signal audience acquisition advantage or disadvantage vs the brand?
- Does engagement gap correlate with ER gap — high engagement with lower ER means the competitor has a larger base, not necessarily better content?
- Does post count gap explain engagement differences — more posts = more engagement opportunities, but lower ER per post suggests volume padding?
- Do the competitor's top 3 posts show high ER — if top posts have high ER, the competitor's best content is resonant; if top post ER is low despite high engagement, it is base-driven?
- Does the followers_growth_gap (% vs brand) reveal acceleration or deceleration in the competitor's growth relative to the brand?
Identify which metric combinations explain the competitive gap.

Layer 3 — WHAT IT MEANS
Translate detected patterns into strategic meaning about the brand's Instagram position vs this specific competitor. What is the competitive risk or opportunity? What does the competitor's top post quality signal about their content strategy? Stay within what the data supports.

Layer 4 — OPTIMIZATION RECOMMENDATIONS
Actionable direction grounded in the head-to-head patterns found. Only include categories that the data clearly supports. Use these exact labels, each on its own line:
SCALE: [what the brand does better than the competitor that is worth amplifying — max 80 chars]
REFINE: [where the brand trails the competitor with clear room to improve — max 80 chars]
EXPLORE: [directions the competitor's top posts suggest the brand has not explored — max 80 chars]
STOP: [what is clearly underperforming vs the competitor and should be deprioritized — max 80 chars]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATTERN-FIRST THINKING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- ER is the content quality signal — compare brand ER vs competitor ER to assess content resonance
- Engagement gap is volume signal — driven by audience base size as much as content quality
- followers_growth_gap (% vs brand) is acceleration signal — negative means competitor is closing the gap
- Post count efficiency: engagement ÷ post count reveals output quality vs volume strategy
- Top 3 posts ER reveals competitor's content ceiling — high ER posts are their best-performing format
- Comments/Likes ratio in top posts: high comments suggests discussion-driven content type

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
METRICS VOCABULARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use only these definitions. Do not invent or assume metrics not present in the data.

Main Brand:
- Followers Growth: absolute follower increase this period
- Followers Growth Gap (%): how brand's growth rate compares to competitor (positive = brand outpacing)
- Post Count: total posts published this period
- Post Count Growth (%): MoM or YoY change in posting frequency
- Total Engagement: total interactions (likes + comments)
- Total Engagement Gap (%): how brand's engagement compares to competitor
- Avg ER Folls: average engagement rate relative to followers

Competitor:
- IG Followers Increase: absolute follower increase
- IG Followers Growth (%): percentage growth rate
- Post Count: total posts published
- Post Count Growth (%): MoM or YoY change
- IG Engagement: total interactions
- IG Engagement Growth (%): MoM or YoY change
- ER Folls: engagement rate relative to followers

Top 3 Posts (Competitor's best-performing):
- Engagement: total interactions on this post
- Likes: like count
- Comments: comment count
- ER Folls: post-level engagement rate

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BEHAVIORAL RULES — NEVER DO THESE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Do NOT inject platform assumptions (algorithm behavior, caption advice, hashtag advice, etc.)
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

export function buildCompIgFocusPrompt(
  clientName: string,
  period: string,
  mainBrand: CompIgFocusMainBrand | null,
  comp: CompIgFocusCompRow | null,
  top3: CompIgFocusTop3Post[],
): string {
  const mainLines = mainBrand
    ? `  Brand: ${mainBrand.brand}\n` +
      `  FollowersGrowth=${mainBrand.followers_growth}, GrowthGap=${mainBrand.followers_growth_gap}\n` +
      `  PostCount=${mainBrand.post_count}, PostCountGrowth=${mainBrand.post_count_growth}\n` +
      `  TotalEngagement=${mainBrand.total_engagement}, EngagementGap=${mainBrand.total_engagement_gap}\n` +
      `  AvgER=${mainBrand.avg_er_folls}`
    : '  (no data)';

  const compLines = comp
    ? `  Competitor: ${comp.brand}\n` +
      `  FollowersIncrease=${comp.ig_followers_increase}, FollowersGrowth=${comp.ig_followers_growth}\n` +
      `  PostCount=${comp.post_count}, PostCountGrowth=${comp.post_count_growth}\n` +
      `  Engagement=${comp.ig_engagement}, EngGrowth=${comp.ig_engagement_growth}\n` +
      `  ER=${comp.er_folls}`
    : '  (no data)';

  const top3Lines =
    top3.length > 0
      ? top3
          .map(
            (p) =>
              `  #${p.rank}: Engagement=${p.ig_engagement}, Likes=${p.likes}, Comments=${p.comments}, ER=${p.er_folls}`,
          )
          .join('\n')
      : '  (no data)';

  return (
    `Competitor Instagram Focus Analysis\n` +
    `Brand: ${clientName} vs Competitor | Period: ${period}\n\n` +
    `Main Brand:\n${mainLines}\n\n` +
    `Competitor:\n${compLines}\n\n` +
    `Competitor Top 3 Posts:\n${top3Lines}\n\n` +
    `Apply the four-layer reasoning framework. ` +
    `Compare the main brand vs competitor head-to-head: assess ER gap (quality signal), engagement gap (volume signal), and post count efficiency. ` +
    `Use competitor's top 3 posts ER to assess their content ceiling. ` +
    `Flag if the followers_growth_gap shows the competitor is closing or widening the gap vs the brand. ` +
    `Then produce Optimization Recommendations using only categories the data clearly supports (SCALE / REFINE / EXPLORE / STOP). ` +
    `Bold all numbers and percentages. Analysis: 1 sentence max 320 characters. Recommendations: 1 line each max 80 characters, omit unsupported categories entirely (never write None), truncate rather than skip supported ones. Follow the strict two-section output format.`
  );
}

// ─────────────────────────────────────────────────────────────
// OUTPUT PARSER
// ─────────────────────────────────────────────────────────────

export function parseCompIgFocusInsight(raw: string): ParsedInsight {
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
