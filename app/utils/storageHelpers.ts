import { ReportConfig, Slide, ThemePreset } from '@/app/types';
import themesDataRaw from '@/app/data/themes.json';
import fontsData from '@/app/data/fonts.json';

const themesData = themesDataRaw as ThemePreset[];

export const clearAllStorage = () => {
  localStorage.removeItem('report_slides');
  localStorage.removeItem('report_config');
  localStorage.removeItem('report_templates');
  localStorage.removeItem('saved_reports');
};

export const clearCurrentWorkOnly = () => {
  localStorage.removeItem('report_slides');
  localStorage.removeItem('report_config');
};

export const getDefaultSlides = (): Slide[] => [
  { id: 1, type: 'cover', title: 'Report Cover', content: {} },
];

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getLastMonth(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export const getDefaultConfig = (): ReportConfig => ({
  reportTitle: 'Social Media Report',
  reportDetails: 'Monthly Performance & Strategy',
  preparedBy: 'Sekata Data Team',
  reportType: 'Monthly',
  period: getLastMonth(),
  theme: themesData[0],
  font: fontsData[0],
  clientName: '',
  selectedCompetitors: [],
  coverDesign: undefined,
});

export const loadSlidesFromStorage = (): Slide[] => {
  const savedSlides = localStorage.getItem('report_slides');
  if (savedSlides) {
    try {
      return JSON.parse(savedSlides);
    } catch (error) {
      console.error('Failed to load saved slides:', error);
      return getDefaultSlides();
    }
  }
  return getDefaultSlides();
};

export const saveSlidesToStorage = (slides: Slide[]) => {
  if (slides.length > 0) {
    localStorage.setItem('report_slides', JSON.stringify(slides));
  }
};

export const initializeDefaultTemplate = () => {
  const existingTemplates = localStorage.getItem('report_templates');
  if (!existingTemplates) {
    const defaultTemplate = {
      id: 'default-template-1',
      name: 'Default Template',
      savedAt: new Date().toISOString(),
      templateData: {
        theme: themesData[0],
        font: fontsData[0],
        coverDesign: undefined,
      },
      slides: getDefaultSlides(),
    };
    localStorage.setItem('report_templates', JSON.stringify([defaultTemplate]));
    console.log('Default template created in localStorage');
  }
};
