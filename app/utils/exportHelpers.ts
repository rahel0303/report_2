import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import PptxGenJS from 'pptxgenjs';
import { ReportConfig, Slide } from '@/app/types';
import React, { JSX } from 'react';

/**
 * Capture slide as image using html2canvas
 */
async function captureSlideAsImage(element: HTMLElement): Promise<string> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
  });
  return canvas.toDataURL('image/png');
}

/**
 * Export report as PDF with custom cover
 */
export async function exportToPDF(
  slides: Slide[],
  config: ReportConfig,
  slideElements: HTMLElement[],
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [1920, 1080],
  });

  for (let i = 0; i < slideElements.length; i++) {
    const element = slideElements[i];

    if (!element) continue;

    // Capture slide as image
    const imgData = await captureSlideAsImage(element);

    // Add page (except for first slide)
    if (i > 0) {
      pdf.addPage();
    }

    // Add image to PDF
    pdf.addImage(imgData, 'PNG', 0, 0, 1920, 1080);
  }

  // Download PDF
  const filename = `${config.reportTitle.replace(/\s+/g, '_')}_${config.period}.pdf`;
  pdf.save(filename);
}

/**
 * Export report as PPTX with custom cover
 */
export async function exportToPPTX(
  slides: Slide[],
  config: ReportConfig,
  slideElements: HTMLElement[],
): Promise<void> {
  const pptx = new PptxGenJS();

  // Set presentation properties
  pptx.author = config.preparedBy || 'Sekata';
  pptx.company = 'Sekata';
  pptx.title = config.reportTitle;
  pptx.subject = config.reportDetails;

  // Standard 16:9 layout
  pptx.layout = 'LAYOUT_16x9';

  for (let i = 0; i < slideElements.length; i++) {
    const element = slideElements[i];
    const slideData = slides[i];

    if (!element || !slideData) continue;

    // Capture slide as image
    const imgData = await captureSlideAsImage(element);

    // Create new slide
    const slide = pptx.addSlide();

    // Add captured image as background
    slide.addImage({
      data: imgData,
      x: 0,
      y: 0,
      w: '100%',
      h: '100%',
    });

    // Add slide title as metadata (hidden text for accessibility)
    slide.addText(slideData.title, {
      x: 0,
      y: 0,
      w: 0.1,
      h: 0.1,
      fontSize: 1,
      color: 'FFFFFF',
      transparency: 100,
    });
  }

  // Download PPTX
  const filename = `${config.reportTitle.replace(/\s+/g, '_')}_${config.period}.pptx`;
  await pptx.writeFile({ fileName: filename });
}

/**
 * Helper to prepare slides for export
 * This creates temporary DOM elements with full slides rendered
 */
export function prepareSlideElements(
  slides: Slide[],
  config: ReportConfig,
  renderSlideFunction: (slide: Slide) => JSX.Element,
): Promise<HTMLElement[]> {
  return new Promise((resolve) => {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '1920px';
    container.style.height = '1080px';
    document.body.appendChild(container);

    // This is a simplified version - in real implementation,
    // you would need to render React components to these elements
    const elements: HTMLElement[] = [];

    // For now, we'll use the existing DOM elements
    // In production, you'd want to render fresh copies

    setTimeout(() => {
      document.body.removeChild(container);
      resolve(elements);
    }, 100);
  });
}
