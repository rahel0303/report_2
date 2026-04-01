import React from 'react';

interface SlideFooterProps {
  clientName: string;
  period: string;
  currentPage: number;
  totalPages: number;
  logo?: string;
  brandColor?: string;
  preparedBy?: string;
}

// Helper to convert hex to RGB
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 59, g: 130, b: 246 };
};

export const SlideFooter: React.FC<SlideFooterProps> = ({
  clientName,
  period,
  currentPage,
  totalPages,
  logo,
  brandColor = '#3B82F6',
  preparedBy = '',
}) => {
  const rgb = hexToRgb(brandColor);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-14">
      {/* Gradient accent line at top */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, ${brandColor} 0%, ${brandColor}60 50%, ${brandColor} 100%)`,
        }}
      />

      {/* Footer content */}
      <div
        className="h-full flex items-center justify-between px-8"
        style={{
          background: `linear-gradient(to right, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.03), rgba(255,255,255,0.98), rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.03))`,
        }}
      >
        {/* Left side - Logo + Client Info */}
        <div className="flex items-center gap-3 flex-1">
          {logo && (
            <div
              className="p-1.5 rounded-lg"
              style={{
                background: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08)`,
              }}
            >
              <img src={logo} alt="Client Logo" className="h-7 w-auto object-contain" />
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-gray-800">{clientName}</span>
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: brandColor }}
            />
            <span className="text-gray-600">{period}</span>
          </div>
        </div>

        {/* Center - Prepared By */}
        <div className="flex-1 flex justify-center">
          {preparedBy && (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[8px] text-gray-400">Prepared by</span>
              <span className="text-[9px] font-semibold text-gray-600">{preparedBy}</span>
            </div>
          )}
        </div>

        {/* Right side - Page Number */}
        <div className="flex-1 flex justify-end">
          <div
            className="flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full"
            style={{
              background: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08)`,
            }}
          >
            <span style={{ color: brandColor }}>{currentPage}</span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-500">{totalPages}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
