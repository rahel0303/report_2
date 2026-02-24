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
} from '../covers/CoverTemplates';

interface CustomCoverProps {
  config: ReportConfig;
}

export const CustomCover: React.FC<CustomCoverProps> = ({ config }) => {
  if (!config.coverDesign) {
    return null;
  }

  const { templateId, logoData, colors, fontColor } = config.coverDesign;

  const props = {
    colors,
    logo: logoData,
    title: config.reportTitle,
    subtitle: config.reportDetails,
    period: config.period,
    fontFamily: config.font.name,
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
