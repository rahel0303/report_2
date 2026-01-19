import React, { useState } from 'react';
import { X, Bot, Sparkles, Loader2 } from 'lucide-react';
import { AiPromptModalProps } from '@/app/types';
import { generateGeminiContent } from '@/app/utils/api';

export const AiPromptModal: React.FC<AiPromptModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  config,
}) => {
  if (!isOpen) return null;
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const isDark = config.theme.type === 'dark';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);

    try {
      const systemPrompt =
        "You are a professional social media analyst helper. Your goal is to generate a single, professional insight paragraph suitable for a presentation slide based on the user's request. Use *bold* for emphasis on key metrics or trends. Keep it concise (under 50 words) and impactful.";
      const result = await generateGeminiContent(prompt, systemPrompt);
      onGenerate(result);
      setPrompt('');
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
            placeholder="What should I analyze? (e.g., 'Summarize the engagement drop...')"
            className={`w-full h-32 p-3 rounded-xl resize-none text-sm border focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none mb-4 ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
            autoFocus
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
              disabled={!prompt.trim() || isGenerating}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 disabled:opacity-50 transition-all"
            >
              {isGenerating ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              {isGenerating ? 'Generating...' : 'Generate Insight'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
