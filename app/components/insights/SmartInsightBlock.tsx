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
          'You are a social media analyst. Generate 3 SHORT, punchy insights for Instagram report. CRITICAL RULES: 1) WRITE ONLY IN ENGLISH LANGUAGE (NO Indonesian words!) 2) Each insight MUST be UNDER 150 characters 3) Use **bold** ONLY for key numbers. Use casual English tone.';
        dataPrompt = `Instagram Performance Data:\n${JSON.stringify(contextData, null, 2)}`;
      } else if (contextType === 'growth_analysis') {
        systemPrompt =
          'You are a growth analyst. Generate 3 SHORT insights for social media growth report. CRITICAL: Each MUST be UNDER 150 characters. Use **bold** ONLY for key numbers. Write in casual, data-driven Indonesian tone.';
        dataPrompt = `Growth Analysis Data:\n${JSON.stringify(contextData, null, 2)}`;
      } else if (contextType === 'content_performance') {
        systemPrompt =
          'You are a content strategist. Generate 3 SHORT insights for content performance. CRITICAL: Each MUST be UNDER 150 characters. Use **bold** ONLY for key numbers. Write in clear, actionable Indonesian tone.';
        dataPrompt = `Content Performance Data:\n${JSON.stringify(contextData, null, 2)}`;
      } else {
        // Generic analysis
        systemPrompt =
          'You are a data analyst. Generate 3 SHORT insights for social media report. CRITICAL: Each MUST be UNDER 150 characters. Use **bold** ONLY for key numbers. Write in engaging Indonesian tone.';
        dataPrompt = `Data:\n${JSON.stringify(contextData, null, 2)}`;
      }

      const fullPrompt = `${dataPrompt}\n\nIMPORTANT: Provide EXACTLY 3 bullet points IN ENGLISH ONLY. Each point MUST:\n- Start with dash (-) + one space\n- Be UNDER 150 characters (COUNT CAREFULLY!)\n- Use **bold** ONLY for numbers/percentages\n- Be SHORT, punchy, and actionable\n- WRITE ONLY IN ENGLISH (absolutely NO Indonesian words!)\n\nGOOD Examples (all in English, under 150 chars):\n- ER jumped **4.2%**! Polls and Q&A boosted interaction\n- Reach spiked **35%** at **9 AM** peak time\n- Reels got **2x** more saves than regular feed posts`;

      let result = await generateGeminiContent(fullPrompt, systemPrompt);

      // Clean AI response - remove intro/outro text but keep bold markers
      result = result
        .replace(/^(Tentu|Sure|Berikut|Here|Okay)[^\n]*\n*/gi, '')
        .replace(/^[^-]*?((?=-)|(?=\*\*))/, '')
        .trim();

      // Parse bullet points
      const lines = result
        .split('\n')
        .filter((line) => line.trim().startsWith('-'))
        .map((l) => {
          let cleaned = l.replace(/^-\s*/, '').trim();
          // Keep **bold** markers, only remove single asterisks if needed
          cleaned = cleaned.replace(/(?<!\*)\*(?!\*)/g, '');

          // AGGRESSIVE truncation to ensure MAXIMUM 150 characters
          const textOnly = cleaned.replace(/\*\*/g, '');
          if (textOnly.length > 150) {
            // Need to truncate while preserving bold markers
            let charCount = 0;
            let result = '';
            let inBold = false;
            let i = 0;

            while (i < cleaned.length && charCount < 147) {
              if (cleaned.substring(i, i + 2) === '**') {
                result += '**';
                inBold = !inBold;
                i += 2;
              } else {
                result += cleaned[i];
                charCount++;
                i++;
              }
            }

            // Close bold if still open
            if (inBold) result += '**';
            cleaned = result + '...';
          }

          // Double check: if still over 150 after processing, force truncate
          const finalCheck = cleaned.replace(/\*\*/g, '');
          if (finalCheck.length > 150) {
            cleaned = cleaned.substring(0, 147) + '...';
          }

          return cleaned;
        })
        .filter((l) => l.length > 0)
        .slice(0, 3); // Only take first 3

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
      // Use the SAME system prompt as autoGenerateInsight
      let systemPrompt = '';
      let dataPrompt = '';

      // Build prompts based on context type (SAME as autoGenerateInsight)
      if (contextType === 'instagram_summary') {
        systemPrompt =
          'You are a social media analyst. Generate 3 SHORT, punchy insights for Instagram report. CRITICAL RULES: 1) WRITE ONLY IN ENGLISH LANGUAGE (NO Indonesian words!) 2) Each insight MUST be UNDER 150 characters 3) Use **bold** ONLY for key numbers. Use casual English tone.';
        dataPrompt = `Instagram Performance Data:\n${JSON.stringify(contextData, null, 2)}`;
      } else if (contextType === 'growth_analysis') {
        systemPrompt =
          'You are a growth analyst. Generate 3 SHORT insights for social media growth report. CRITICAL RULES: 1) WRITE ONLY IN ENGLISH LANGUAGE (NO Indonesian!) 2) Each MUST be UNDER 150 characters 3) Use **bold** ONLY for key numbers. Use casual English tone.';
        dataPrompt = `Growth Analysis Data:\n${JSON.stringify(contextData, null, 2)}`;
      } else if (contextType === 'content_performance') {
        systemPrompt =
          'You are a content strategist. Generate 3 SHORT insights for content performance. CRITICAL RULES: 1) WRITE ONLY IN ENGLISH LANGUAGE (NO Indonesian!) 2) Each MUST be UNDER 150 characters 3) Use **bold** ONLY for key numbers. Use clear English tone.';
        dataPrompt = `Content Performance Data:\n${JSON.stringify(contextData, null, 2)}`;
      } else {
        // Generic analysis
        systemPrompt =
          'You are a data analyst. Generate 3 SHORT insights for social media report. CRITICAL RULES: 1) WRITE ONLY IN ENGLISH LANGUAGE (NO Indonesian!) 2) Each MUST be UNDER 150 characters 3) Use **bold** ONLY for key numbers. Use engaging English tone.';
        dataPrompt = `Data:\n${JSON.stringify(contextData, null, 2)}`;
      }

      // Same base prompt as autoGenerateInsight, but ADD user refinement instruction
      const fullPrompt = `${dataPrompt}\n\nUser additional request: ${refinementPrompt}\n\nIMPORTANT: Provide EXACTLY 3 bullet points IN ENGLISH ONLY. Each point MUST:\n- Start with dash (-) + one space\n- Be UNDER 150 characters (COUNT CAREFULLY!)\n- Use **bold** ONLY for numbers/percentages\n- Be SHORT, punchy, and actionable\n- WRITE ONLY IN ENGLISH (absolutely NO Indonesian words!)\n- Follow user's additional request above\n\nGOOD Examples (all in English, under 150 chars):\n- ER jumped **4.2%**! Polls and Q&A boosted interaction\n- Reach spiked **35%** at **9 AM** peak time\n- Reels got **2x** more saves than regular feed posts`;

      let result = await generateGeminiContent(fullPrompt, systemPrompt);

      // Clean AI response - remove intro/outro text but keep bold markers
      result = result
        .replace(/^(Tentu|Sure|Berikut|Here|Okay|Here is|Here's|Berikut adalah)[^\n]*\n*/gi, '')
        .replace(/^[^:]*:\s*/g, '')
        .replace(/^[^-]*?((?=-)|(?=\*\*))/, '')
        .trim();

      // Parse bullet points (SAME logic as autoGenerateInsight)
      const lines = result
        .split('\n')
        .filter((line) => line.trim().startsWith('-'))
        .map((l) => {
          let cleaned = l.replace(/^-\s*/, '').trim();
          // Keep **bold** markers, only remove single asterisks if needed
          cleaned = cleaned.replace(/(?<!\*)\*(?!\*)/g, '');

          // AGGRESSIVE truncation to ensure MAXIMUM 150 characters
          const textOnly = cleaned.replace(/\*\*/g, '');
          if (textOnly.length > 150) {
            // Need to truncate while preserving bold markers
            let charCount = 0;
            let result = '';
            let inBold = false;
            let i = 0;

            while (i < cleaned.length && charCount < 147) {
              if (cleaned.substring(i, i + 2) === '**') {
                result += '**';
                inBold = !inBold;
                i += 2;
              } else {
                result += cleaned[i];
                charCount++;
                i++;
              }
            }

            // Close bold if still open
            if (inBold) result += '**';
            cleaned = result + '...';
          }

          // Double check: if still over 150 after processing, force truncate
          const finalCheck = cleaned.replace(/\*\*/g, '');
          if (finalCheck.length > 150) {
            cleaned = cleaned.substring(0, 147) + '...';
          }

          return cleaned;
        })
        .filter((l) => l.length > 0)
        .slice(0, 3); // Only take first 3 (SAME as autoGenerateInsight)

      if (lines.length > 0) {
        const refinedText = lines.join('\n');
        setContent(refinedText);
        if (onSave) onSave(refinedText);
      } else {
        // If no bullet points found, show error
        alert('Failed to generate proper format. Please try again.');
      }
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
                className={`h-full w-full p-3 rounded-lg border relative transition-all group-hover:ring-2 group-hover:ring-blue-400/50 flex flex-col ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-slate-300'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex justify-between items-start mb-2 opacity-50 flex-shrink-0">
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
                  className={`${fontSize.content} leading-relaxed whitespace-pre-wrap font-medium overflow-y-auto overflow-x-hidden flex-1 break-words overflow-wrap-anywhere max-w-full pr-1`}
                  style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
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
