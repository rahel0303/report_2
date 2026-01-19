import React from 'react';
import { ReportCoverVisualProps } from '@/app/types';

export const ReportCoverVisual: React.FC<ReportCoverVisualProps> = ({ config, mode = 'full' }) => {
  const bgStyle = { backgroundColor: config.theme.colors[0] };
  const textStyle = config.theme.textColor;
  const borderStyle = config.theme.type === 'dark' ? 'border-white/30' : 'border-slate-900/20';

  const typo = {
    full: {
      title: 'text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]',
      subtitle: 'text-xl md:text-2xl font-light tracking-wide',
      period: 'text-sm font-bold tracking-[0.25em]',
      logo: 'text-lg',
      dolphin: 'text-2xl',
      footer: 'text-[10px]',
    },
    preview: {
      title: 'text-3xl font-bold leading-tight',
      subtitle: 'text-sm font-light',
      period: 'text-[8px] font-bold tracking-widest',
      logo: 'text-xs',
      dolphin: 'text-base',
      footer: 'text-[8px]',
    },
    thumbnail: {
      title: 'text-lg font-bold leading-tight',
      subtitle: 'text-[8px]',
      period: 'text-[6px]',
      logo: 'text-[6px]',
      dolphin: 'text-[10px]',
      footer: 'text-[6px]',
    },
  }[mode];

  const spacing = { full: 'p-16', preview: 'p-8', thumbnail: 'p-4' }[mode];

  return (
    <div
      className={`w-full h-full relative flex flex-col overflow-hidden font-sans ${spacing}`}
      style={{ ...bgStyle, fontFamily: config.font.name }}
    >
      <div
        className={`absolute top-8 left-8 z-20 ${textStyle} ${
          mode === 'thumbnail' ? 'top-3 left-3' : ''
        }`}
      >
        <a
          href="#"
          className="flex items-center gap-2 hover:opacity-75 transition-opacity cursor-pointer no-underline"
          onClick={(e) => e.preventDefault()}
        >
          <span className={`${typo.dolphin} filter drop-shadow-sm`}>🐬</span>
          <span
            className={`${typo.logo} font-bold opacity-90 underline decoration-dotted underline-offset-4`}
          >
            Sekata 2025
          </span>
        </a>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center z-10 w-full px-4">
        <div className={`${textStyle} w-full max-w-4xl mx-auto`}>
          <h1
            className={`${typo.title} mb-6 drop-shadow-md break-words`}
            style={{ textWrap: 'balance' } as any}
          >
            {config.reportTitle}
          </h1>

          <div
            className={`border-t pt-6 w-full max-w-lg mx-auto ${borderStyle} flex flex-col gap-3`}
          >
            <p className={`${typo.subtitle} opacity-90 leading-relaxed`}>{config.reportDetails}</p>

            <div className="mt-2 inline-flex justify-center">
              <span
                className={`${typo.period} uppercase opacity-80 border py-1.5 px-5 rounded-full ${borderStyle} inline-block`}
              >
                {config.period}
              </span>
            </div>
          </div>
        </div>

        {config.preparedBy && (
          <div className={`mt-16 ${textStyle} opacity-80`}>
            <p className={`${typo.period} font-medium`}>Prepared by: {config.preparedBy}</p>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 w-full h-4 flex">
        {config.theme.colors.slice(1).map((c, i) => (
          <div key={i} className="h-full flex-1" style={{ backgroundColor: c }} />
        ))}
      </div>

      <div
        className={`absolute bottom-8 right-8 font-mono uppercase opacity-40 ${textStyle} ${
          typo.footer
        } ${mode === 'thumbnail' ? 'bottom-3 right-3' : ''}`}
      >
        Confidential Document
      </div>
    </div>
  );
};
