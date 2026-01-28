import React from 'react';

interface SlideFooterProps {
  clientName: string;
  period: string;
  currentPage: number;
  totalPages: number;
  logo?: string;
  brandColor?: string;
}

export const SlideFooter: React.FC<SlideFooterProps> = ({
  clientName,
  period,
  currentPage,
  totalPages,
  logo,
  brandColor = '#3B82F6',
}) => {
  // Debug: Log what SlideFooter receives
  console.log('🎯 SlideFooter rendered:', {
    clientName,
    period,
    timestamp: new Date().toISOString(),
  });

  return (
    <div
      className="absolute bottom-0 left-0 right-0 h-14 flex items-center justify-between px-8 bg-white/95 backdrop-blur-sm"
      style={{
        borderTop: `2px solid ${brandColor}`,
      }}
    >
      {/* Left side - Logo + Client Info */}
      <div className="flex items-center gap-3 flex-1">
        {logo && (
          <img src={logo} alt="Client Logo" className="h-8 w-auto object-contain opacity-80" />
        )}
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-gray-800">{clientName}</span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-600">{period}</span>
        </div>
      </div>

      {/* Center - Powered by Sekata */}
      <div className="flex-1 flex justify-center">
        <div className="text-xs text-gray-500">
          Powered by <span className="font-semibold text-gray-700">Sekata</span>
        </div>
      </div>

      {/* Right side - Page Number */}
      <div className="flex-1 flex justify-end">
        <div className="text-sm text-gray-600 font-medium">
          <span className="text-gray-800">{currentPage}</span>
          <span className="text-gray-400 mx-1">/</span>
          <span className="text-gray-500">{totalPages}</span>
        </div>
      </div>
    </div>
  );
};
