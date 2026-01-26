import React, { useState, useEffect, useRef } from 'react';
import { PenTool, X, Check, Edit3, Sparkles, Loader2 } from 'lucide-react';
import { SmartInsightBlockProps } from '@/app/types';
import { InsightMethodSelectionModal, AiPromptModal } from '@/app/components/ui';
import { renderTextWithHighlights } from '@/app/utils/helpers';
import { generateGeminiContent } from '@/app/utils/api';

export const SmartInsightBlock: React.FC<SmartInsightBlockProps> = ({
  icon,
  label,
  className,
  config,
  savedState,
  onSave,
  contextData,
  contextType,
  isExport = false,
}) => {
  const [content, setContent] = useState<string | null>(savedState || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setContent(savedState || null);
  }, [savedState]);

  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [showAiPromptModal, setShowAiPromptModal] = useState(false);
  const [showRefinementModal, setShowRefinementModal] = useState(false);

  const isDark = config.theme.type === 'dark';
  const colorPrimary = config.theme.brandColor;
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Font sizes for export
  const fontSize = {
    title: isExport ? 'text-xl' : 'text-xs',
    content: isExport ? 'text-lg' : 'text-xs',
    listItem: isExport ? 'text-lg' : 'text-xs',
  };

  const handleBlockClick = () => {
    if (content && !isEditing) {
      setEditValue(content);
      setIsEditing(true);
    } else if (!isEditing) {
      setShowSelectionModal(true);
    }
  };

  const handleSelectManual = () => {
    setShowSelectionModal(false);
    setEditValue(content || '');
    setIsEditing(true);
  };

  const handleSelectAI = async () => {
    setShowSelectionModal(false);

    // If we have contextData, auto-generate immediately
    if (contextData) {
      await autoGenerateInsight();
    } else {
      // Otherwise show prompt modal
      setShowAiPromptModal(true);
    }
  };

  const autoGenerateInsight = async () => {
    setIsGenerating(true);
    try {
      let systemPrompt = '';
      let dataPrompt = '';

      // Build prompts based on context type
      if (contextType === 'instagram_summary') {
        systemPrompt =
          'You are a professional social media analyst. Analyze the Instagram performance data and generate 3 concise key takeaways (bullet points). Focus on significant changes in reach, engagement, and growth. Use *bold* for key numbers. Each point should be under 50 words.';
        dataPrompt = `Instagram Performance Data:\n${JSON.stringify(contextData, null, 2)}`;
      } else if (contextType === 'growth_analysis') {
        systemPrompt =
          'You are a growth analytics expert. Analyze the growth data and provide 3 actionable insights about trends, patterns, and opportunities. Use *bold* for percentages and key metrics.';
        dataPrompt = `Growth Analysis Data:\n${JSON.stringify(contextData, null, 2)}`;
      } else if (contextType === 'content_performance') {
        systemPrompt =
          'You are a content strategist. Analyze post performance data and provide 3 strategic insights about what content performs best. Highlight top performers with *bold*.';
        dataPrompt = `Content Performance Data:\n${JSON.stringify(contextData, null, 2)}`;
      } else {
        // Generic analysis
        systemPrompt =
          'You are a data analyst. Provide 3 professional insights based on the data below. Use *bold* for emphasis on key findings.';
        dataPrompt = `Data:\n${JSON.stringify(contextData, null, 2)}`;
      }

      const fullPrompt = `${dataPrompt}\n\nProvide 3 bullet points (start each with '-' or '*'). Keep each point concise and actionable.`;

      let result = await generateGeminiContent(fullPrompt, systemPrompt);

      // Clean AI response - remove intro/outro text
      result = result
        .replace(/^(Tentu|Sure|Berikut|Here|Okay)[^\n]*\n*/gi, '')
        .replace(/^[^-*]*?((?=-)|(?=\*))/, '')
        .trim();

      // Parse bullet points
      const lines = result
        .split('\n')
        .filter((line) => line.trim().startsWith('-') || line.trim().startsWith('*'))
        .map((l) => l.replace(/^[-*]\s*/, ''));

      if (lines.length > 0) {
        const generatedText = lines.join('\n');
        setEditValue(generatedText);
        setIsEditing(true);
      } else {
        // If no bullet points found, use the whole result
        setEditValue(result);
        setIsEditing(true);
      }
    } catch (error) {
      console.error('AI generation failed:', error);
      alert('Failed to generate insights. Please try manual entry.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAiGenerated = (generatedText: string) => {
    setShowAiPromptModal(false);
    setEditValue(generatedText);
    setIsEditing(true);
  };

  const handleRefineWithAI = async (refinementPrompt: string) => {
    setShowRefinementModal(false);
    setIsGenerating(true);

    try {
      const systemPrompt =
        "You are a professional content editor. Modify the existing content based on the user's instructions. Maintain the core information but adjust the format, style, or structure as requested. Use *bold* for emphasis. Return ONLY the refined content without any intro text.";
      const fullPrompt = `Current content:\n${content}\n\nUser instruction: ${refinementPrompt}\n\nProvide ONLY the refined version without any intro text:`;

      let result = await generateGeminiContent(fullPrompt, systemPrompt);

      // Clean AI response - remove common intro phrases
      result = result
        .replace(/^(Tentu|Sure|Berikut|Here|Okay|Here is|Here's|Berikut adalah)[^\n]*\n*/gi, '')
        .replace(/^[^:]*:\s*/g, '')
        .trim();

      setContent(result);
      if (onSave) onSave(result);
    } catch (error) {
      console.error('AI refinement failed:', error);
      alert('Failed to refine content. Please try manual editing.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    setContent(editValue);
    if (onSave) onSave(editValue);
    setIsEditing(false);
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(
        inputRef.current.value.length,
        inputRef.current.value.length,
      );
    }
  }, [isEditing]);

  return (
    <>
      <div className="h-full w-full group relative">
        {isGenerating ? (
          <div
            className={`h-full w-full rounded-lg border flex flex-col items-center justify-center gap-3 animate-in fade-in duration-200 ${
              isDark ? 'bg-slate-800 border-purple-500/50' : 'bg-purple-50 border-purple-300'
            }`}
          >
            <Loader2 size={24} className="animate-spin text-purple-500" />
            <div className="text-center">
              <p
                className={`${fontSize.title} font-bold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}
              >
                AI is analyzing your data...
              </p>
              <p
                className={`${fontSize.content} mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
              >
                Generating insights
              </p>
            </div>
          </div>
        ) : isEditing ? (
          <div
            className={`h-full w-full rounded-lg border flex flex-col relative animate-in fade-in duration-200 ring-2 ring-blue-500/20 ${
              isDark ? 'bg-slate-800 border-blue-500/50' : 'bg-white border-blue-400'
            }`}
          >
            <div
              className={`px-3 py-2 border-b flex justify-between items-center ${
                isDark ? 'border-slate-700' : 'border-slate-100'
              }`}
            >
              <span
                className={`${fontSize.content} font-bold uppercase tracking-wider text-blue-500 flex items-center gap-1`}
              >
                <PenTool size={10} /> Editing...
              </span>
            </div>
            <textarea
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className={`flex-1 w-full p-3 resize-none ${fontSize.content} leading-relaxed outline-none bg-transparent ${
                isDark
                  ? 'text-white placeholder:text-slate-600'
                  : 'text-slate-800 placeholder:text-slate-400'
              }`}
              placeholder="Type your notes here..."
            />
            <div className="absolute bottom-3 right-3 flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className={`p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors`}
                title="Cancel"
              >
                <X size={14} />
              </button>
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white p-1.5 rounded-md hover:bg-blue-700 shadow-md transition-transform hover:scale-105"
                title="Save"
              >
                <Check size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div onClick={handleBlockClick} className="h-full w-full cursor-pointer">
            {content ? (
              <div
                className={`h-full w-full p-3 rounded-lg border overflow-hidden relative transition-all group-hover:ring-2 group-hover:ring-blue-400/50 ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-slate-300'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex justify-between items-start mb-2 opacity-50">
                  <div className="flex items-center gap-1.5">
                    {icon && React.createElement(icon, { size: 12 })}
                    <span className={`font-bold uppercase tracking-wider ${fontSize.content}`}>
                      {label}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowRefinementModal(true);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-purple-500"
                      title="Refine with AI"
                    >
                      <Sparkles size={12} />
                    </button>
                    <Edit3 size={12} />
                  </div>
                </div>
                <div
                  className={`${fontSize.content} leading-relaxed whitespace-pre-wrap font-medium`}
                >
                  {renderTextWithHighlights(content, isDark, colorPrimary)}
                </div>
              </div>
            ) : (
              <div
                className={`w-full h-full border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center bg-slate-50/50 text-slate-400 transition-all hover:bg-blue-50/50 hover:border-blue-300 hover:text-blue-500 cursor-pointer group ${className}`}
              >
                {icon &&
                  React.createElement(icon, {
                    size: 24,
                    className: 'mb-2 opacity-50 group-hover:scale-110 transition-transform',
                  })}
                <span className={`${fontSize.content} font-bold uppercase tracking-wider`}>
                  {label}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <InsightMethodSelectionModal
        isOpen={showSelectionModal}
        onClose={() => setShowSelectionModal(false)}
        onSelectManual={handleSelectManual}
        onSelectAI={handleSelectAI}
        config={config}
      />

      <AiPromptModal
        isOpen={showAiPromptModal}
        onClose={() => setShowAiPromptModal(false)}
        onGenerate={handleAiGenerated}
        config={config}
        contextData={contextData}
        contextType={contextType}
      />

      <AiPromptModal
        isOpen={showRefinementModal}
        onClose={() => setShowRefinementModal(false)}
        onGenerate={handleRefineWithAI}
        config={config}
      />
    </>
  );
};
