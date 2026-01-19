import React, { useState, useEffect, useRef } from 'react';
import { PenTool, X, Check, Edit3 } from 'lucide-react';
import { SmartInsightBlockProps } from '@/app/types';
import { InsightMethodSelectionModal, AiPromptModal } from '@/app/components/ui';
import { renderTextWithHighlights } from '@/app/utils/helpers';

export const SmartInsightBlock: React.FC<SmartInsightBlockProps> = ({
  icon,
  label,
  className,
  config,
  savedState,
  onSave,
}) => {
  const [content, setContent] = useState<string | null>(savedState || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    setContent(savedState || null);
  }, [savedState]);

  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [showAiPromptModal, setShowAiPromptModal] = useState(false);

  const isDark = config.theme.type === 'dark';
  const colorPrimary = config.theme.brandColor;
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  const handleSelectAI = () => {
    setShowSelectionModal(false);
    setShowAiPromptModal(true);
  };

  const handleAiGenerated = (generatedText: string) => {
    setShowAiPromptModal(false);
    setEditValue(generatedText);
    setIsEditing(true);
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
        inputRef.current.value.length
      );
    }
  }, [isEditing]);

  return (
    <>
      <div className="h-full w-full group relative">
        {isEditing ? (
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
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 flex items-center gap-1">
                <PenTool size={10} /> Editing...
              </span>
            </div>
            <textarea
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className={`flex-1 w-full p-3 resize-none text-[10px] leading-relaxed outline-none bg-transparent ${
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
                    <span className="font-bold uppercase tracking-wider text-[9px]">{label}</span>
                  </div>
                  <div className="flex gap-1">
                    <Edit3 size={12} />
                  </div>
                </div>
                <div className="text-[10px] leading-relaxed whitespace-pre-wrap font-medium">
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
                <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
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
      />
    </>
  );
};
