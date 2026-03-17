/**
 * insightPrompts.ts
 * Kumpulan prompt untuk fitur AI Generate Insight di setiap slide.
 * Setiap fungsi menerima data dari slide dan mengembalikan { prompt, systemPrompt }.
 */

export interface PromptResult {
  prompt: string;
  systemPrompt: string;
}

// ─────────────────────────────────────────────────────────────
// SYSTEM PROMPT UMUM (dipakai semua slide kecuali override)
// ─────────────────────────────────────────────────────────────
const BASE_SYSTEM_PROMPT =
  'Kamu adalah analis media sosial senior yang menulis insight tajam, padat, dan bernilai tinggi untuk laporan klien profesional. ' +
  'ATURAN KETAT: ' +
  '1) Tulis dalam Bahasa Indonesia. ' +
  '2) Tulis sebagai kalimat mengalir — TANPA bullet, TANPA dash, TANPA line break. ' +
  '3) WAJIB bungkus setiap angka dan persentase dengan **bold** (contoh: **487%**, **-38%**). TIDAK BOLEH ada angka tanpa bold. ' +
  '4) Sebutkan metrik yang paling relevan dan menonjol dari data. ' +
  '5) Bukan sekadar laporan angka — tarik kesimpulan strategis: apa yang terjadi, mengapa penting, dan apa implikasinya. ' +
  '6) Maksimal 300 karakter total. ' +
  '7) Kembalikan HANYA teks insight — tanpa heading, tanpa pembuka, tanpa penjelasan tambahan.';

// ─────────────────────────────────────────────────────────────
// REFINE SYSTEM PROMPT (sama untuk semua slide)
// ─────────────────────────────────────────────────────────────
export const REFINE_SYSTEM_PROMPT =
  'You are a professional editor. Your task is to improve the clarity, flow, and conciseness of analysis text. STRICT RULES: ' +
  '1) Preserve ALL **bold** markers exactly as-is around numbers and key data (e.g. **+487%** must stay **+487%**). ' +
  '2) Preserve bullet format: lines starting with "- " must remain starting with "- ". ' +
  '3) Keep the refined text within the same character count as the original (±10%). ' +
  '4) Do NOT add new data, facts, or numbers. ' +
  '5) Return ONLY the refined text — no explanation, no preamble.';

// ─────────────────────────────────────────────────────────────
// IG GROWTH SLIDE
// Data: followers growth, profile reach, profile visits,
//       engagement, ER reach, ER followers per month
// ─────────────────────────────────────────────────────────────
interface IgGrowthRow {
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

export function buildIgGrowthPrompt(
  clientName: string,
  period: string,
  tableRows: IgGrowthRow[],
): PromptResult {
  const ctx = tableRows
    .map(
      (r) =>
        `${r.month}: Followers Growth=${r.growth}, Profile Reach=${r.profileReach}, Profile Visit=${r.profileVisit}, Reach=${r.reach}, Engagement=${r.engagement}, Likes=${r.likes}, Comments=${r.comments}, Shares=${r.shares}, Saves=${r.saves}, ER Reach=${r.erReach}, ER Followers=${r.erFolls}`,
    )
    .join('\n');

  const prompt =
    `Analisis performa akun Instagram ${clientName} periode ${period}.\n\n` +
    `Data per bulan:\n${ctx}\n\n` +
    `Dari data di atas, tulis insight strategis yang tajam dan padat. ` +
    `Soroti metrik yang paling menonjol — baik yang naik maupun turun — dan jelaskan apa implikasinya bagi performa akun secara keseluruhan. ` +
    `Bold semua angka. Maksimal 300 karakter.`;

  return { prompt, systemPrompt: BASE_SYSTEM_PROMPT };
}
