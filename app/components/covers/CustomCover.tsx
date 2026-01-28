import React from 'react';
import { ReportConfig } from '@/app/types';
import {
  GeometricTemplate,
  FluidWavesTemplate,
  AbstractTemplate,
  MinimalGradientTemplate,
  ModernGridTemplate,
} from '../covers/CoverTemplates';

interface CustomCoverProps {
  config: ReportConfig;
}

export const CustomCover: React.FC<CustomCoverProps> = ({ config }) => {
  if (!config.coverDesign) {
    return null;
  }

  const { templateId, logoData, colors } = config.coverDesign;

  const props = {
    colors,
    logo: logoData,
    title: config.reportTitle,
    subtitle: config.reportDetails,
    period: config.period,
    fontFamily: config.font.name,
  };

  switch (templateId) {
    case 1:
      return <GeometricTemplate {...props} />;
    case 2:
      return <FluidWavesTemplate {...props} />;
    case 3:
      return <AbstractTemplate {...props} />;
    case 4:
      return <MinimalGradientTemplate {...props} />;
    case 5:
      return <ModernGridTemplate {...props} />;
    default:
      return null;
  }
};
