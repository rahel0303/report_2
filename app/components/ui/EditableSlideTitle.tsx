import React, { useState, useEffect } from 'react';
import { Edit3 } from 'lucide-react';
import { EditableSlideProps } from '@/app/types';

export const EditableSlideTitle: React.FC<EditableSlideProps> = ({ title, onChange, isDark }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);

  useEffect(() => {
    setTempTitle(title);
  }, [title]);

  const handleSave = () => {
    if (tempTitle.trim()) {
      onChange(tempTitle);
    } else {
      setTempTitle(title);
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <input
        autoFocus
        className={`text-2xl font-bold bg-transparent border-b-2 outline-none w-full pb-1 ${
          isDark ? 'text-white border-blue-500' : 'text-slate-800 border-blue-500'
        }`}
        value={tempTitle}
        onChange={(e) => setTempTitle(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
      />
    );
  }

  return (
    <h2
      onClick={() => setIsEditing(true)}
      className={`text-2xl font-bold cursor-text hover:opacity-70 transition-opacity flex items-center gap-2 group truncate ${
        isDark ? 'text-white' : 'text-slate-900/80'
      }`}
      title="Click to edit title"
    >
      {title}
      <Edit3
        size={16}
        className="opacity-0 group-hover:opacity-50 transition-opacity text-slate-400"
      />
    </h2>
  );
};
