'use client';

import React from 'react';
import { ReportConfig } from '@/app/types';
import {
  ModernNeonTemplate,
  ModernSplitTemplate,
  ModernGlassTemplate,
  GeometricPrismTemplate,
  GeometricBauhausTemplate,
  GeometricHexTemplate,
  MinimalistCleanTemplate,
  MinimalistAsymmetricTemplate,
  MinimalistFrameTemplate,
} from './CoverTemplates';

interface ThankYouSlideProps {
  config: ReportConfig;
}

/**
 * Thank You slide — renders the same template as the selected cover design
 * but replaces the title/subtitle/period with closing-slide text.
 */
export const ThankYouSlide: React.FC<ThankYouSlideProps> = ({ config }) => {
  if (!config.coverDesign) return null;

  const { templateId, logoData, colors, fontColor } = config.coverDesign;

  const props = {
    colors,
    logo: logoData,
    title: 'Thank You',
    subtitle: config.clientName || config.preparedBy || '',
    period: config.period,
    fontFamily: config.font?.name,
    fontColor,
  };

  switch (templateId) {
    case 1:
      return <ModernNeonTemplate {...props} />;
    case 2:
      return <ModernSplitTemplate {...props} />;
    case 3:
      return <ModernGlassTemplate {...props} />;
    case 4:
      return <GeometricPrismTemplate {...props} />;
    case 5:
      return <GeometricBauhausTemplate {...props} />;
    case 6:
      return <GeometricHexTemplate {...props} />;
    case 7:
      return <MinimalistCleanTemplate {...props} />;
    case 8:
      return <MinimalistAsymmetricTemplate {...props} />;
    case 9:
      return <MinimalistFrameTemplate {...props} />;
    default:
      return null;
  }
};
