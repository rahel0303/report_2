import React, { useState } from 'react';
import { X, Bot, Sparkles, Loader2 } from 'lucide-react';
import { AiPromptModalProps } from '@/app/types';
import { generateGeminiContent } from '@/app/utils/api';

export const AiPromptModal: React.FC<AiPromptModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  config,
  contextData,
  contextType,
  autoGenerate = false,
}) => {
  if (!isOpen) return null;
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const isDark = config.theme.type === 'dark';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() && !contextData) return;

    setIsGenerating(true);

    try {
      const systemPrompt =
        'Generate SHORT insights for social media report. CRITICAL RULES: 1) WRITE ONLY IN ENGLISH LANGUAGE (NO Indonesian words!) 2) Each MUST be UNDER 150 characters 3) Use **bold** ONLY for key numbers. Use casual, punchy English tone.';

      let fullPrompt = prompt;

      // If we have context data, include it in the analysis
      if (contextData) {
        const contextStr = JSON.stringify(contextData, null, 2);
        fullPrompt = `Context Data:\n${contextStr}\n\nUser Request: ${prompt || 'Provide 3 engaging insights from this data in bullet points'}\n\nIMPORTANT: Provide EXACTLY 3 bullet points IN ENGLISH ONLY:\n- Start with dash (-) + space\n- UNDER 150 characters each\n- Use **bold** ONLY for numbers\n- SHORT and punchy\n- WRITE ONLY IN ENGLISH (NO Indonesian!)\n\nExamples (all in English):\n- ER up **4.2%**! Polls boosted engagement\n- Reach **+35%** at **9 AM** peak`;
      }

      let result = await generateGeminiContent(fullPrompt, systemPrompt);

      // Clean AI response - remove intro phrases but keep bold markers
      result = result
        .replace(/^(Tentu|Sure|Berikut|Here|Okay|Here is|Here's|Berikut adalah)[^\n]*\n*/gi, '')
        .replace(/^[^:]*:\s*/g, '')
        .replace(/(?<!\*)\*(?!\*)/g, '') // Only remove single asterisks, keep **bold**
        .trim();

      onGenerate(result);
      setPrompt('');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md p-6 rounded-2xl shadow-2xl ${
          isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Bot size={18} className="text-purple-500" />
            <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
              AI Insight Generator
            </h3>
          </div>
          <button onClick={onClose} disabled={isGenerating}>
            <X size={18} className="text-slate-400 hover:text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              contextData
                ? "(Optional) Add refinement instructions like 'make it more concise' or 'format as bullet points'..."
                : "What should I analyze? (e.g., 'Summarize the engagement trends...')"
            }
            className={`w-full h-32 p-3 rounded-xl resize-none text-sm border focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none mb-4 ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
            autoFocus={!contextData}
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className={`px-4 py-2 text-xs font-bold rounded-lg ${
                isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 disabled:opacity-50 transition-all"
            >
              {isGenerating ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              {isGenerating ? 'Generating...' : contextData ? 'Generate Insights' : 'Generate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
