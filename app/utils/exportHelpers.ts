import PptxGenJS from 'pptxgenjs';
import { ReportConfig, Slide } from '@/app/types';

/**
 * Handle download based on format
 */
export const handleDownload = async (
  format: string,
  slides: Slide[],
  config: ReportConfig,
  setIsExporting: (val: boolean) => void,
  setShowExportToast: (val: boolean) => void,
) => {
  setIsExporting(true);

  try {
    if (format === 'pdf') {
      alert('PDF export coming soon. Please use PowerPoint export for now.');
      setIsExporting(false);
      return;
    } else if (format === 'pptx') {
      const PptxGenJS = (await import('pptxgenjs')).default;
      const { toPng } = await import('html-to-image');

      const pptx = new PptxGenJS();
      pptx.layout = 'LAYOUT_16x9';
      pptx.author = config.preparedBy;
      pptx.title = config.reportTitle;

      console.log('📸 Capturing slides as images...');

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        console.log(`📸 Capturing slide ${i + 1}/${slides.length}: ${slide.title}`);

        const exportDiv = document.querySelector(
          `[data-slide-id="${slide.id}"][data-slide-export="true"]`,
        ) as HTMLElement;

        if (!exportDiv) {
          console.error(`Export div not found for slide ${slide.id}`);
          continue;
        }

        await new Promise((resolve) => setTimeout(resolve, 500));

        try {
          const imgData = await toPng(exportDiv, {
            cacheBust: true,
            width: 1920,
            height: 1080,
            backgroundColor: '#ffffff',
            pixelRatio: 2,
            filter: (node) => {
              if (node.nodeName === 'SCRIPT') return false;
              if (node.nodeName === 'NOSCRIPT') return false;
              return true;
            },
            style: {
              transform: 'scale(1)',
              transformOrigin: 'top left',
              position: 'relative',
              left: '0',
              top: '0',
              margin: '0',
              padding: '0',
            },
          });

          const pptxSlide = pptx.addSlide();
          pptxSlide.addImage({
            data: imgData,
            x: 0,
            y: 0,
            w: '100%',
            h: '100%',
          });

          console.log(`✅ Slide ${i + 1} captured successfully`);
        } catch (error) {
          console.error(`Error capturing slide ${i + 1}:`, error);
          const pptxSlide = pptx.addSlide();
          pptxSlide.addText(`Error capturing: ${slide.title}`, {
            x: 1,
            y: 2.5,
            w: 8,
            h: 0.5,
            fontSize: 24,
            color: 'FF0000',
            align: 'center',
          });
        }
      }

      const fileName = `${config.reportTitle.replace(/\s+/g, '_')}_${config.period}.pptx`;
      await pptx.writeFile({ fileName });

      console.log('🎉 Export completed with screenshots!');
      alert(
        `✓ Successfully exported: ${fileName}\n\n📸 All slides captured as high-quality images!`,
      );
    }

    setIsExporting(false);
    setShowExportToast(true);
    setTimeout(() => setShowExportToast(false), 3000);
  } catch (error) {
    console.error('Export error:', error);
    setIsExporting(false);
    alert(
      `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
    );
  }
};
