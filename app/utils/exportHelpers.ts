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

        // Cover slides: screenshot background only + native editable text
        if (slide.type === 'cover') {
          const exportDiv = document.querySelector(
            `[data-slide-id="${slide.id}"][data-slide-export="true"]`,
          ) as HTMLElement;

          if (exportDiv) {
            try {
              await new Promise((resolve) => setTimeout(resolve, 500));

              // Capture background only: hide the content layer ([data-cover-content])
              const bgImage = await toPng(exportDiv, {
                cacheBust: true,
                width: 1920,
                height: 1080,
                pixelRatio: 2,
                filter: (node) => {
                  if (node instanceof HTMLElement && node.hasAttribute('data-cover-content')) {
                    return false; // Hide text/logo content
                  }
                  if (node.nodeName === 'SCRIPT' || node.nodeName === 'NOSCRIPT') return false;
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

              // Use hybrid: screenshot bg + native editable text
              const { createCoverSlideHybrid } = await import('./pptxExporter');
              createCoverSlideHybrid(pptx, config, bgImage);
              console.log(`✅ Cover slide captured (hybrid: bg screenshot + editable text)`);
            } catch (error) {
              console.error('Cover hybrid export failed, falling back to native:', error);
              const { createCoverSlide } = await import('./pptxExporter');
              createCoverSlide(pptx, config);
            }
          } else {
            // No DOM element available – use native fallback
            const { createCoverSlide } = await import('./pptxExporter');
            createCoverSlide(pptx, config);
          }
          continue;
        }

        // Section heading slides: screenshot background only + native editable title
        if (slide.type === 'section_heading') {
          const sectionTitle = slide.content?.sectionTitle || slide.title || 'Section Title';
          const exportDiv = document.querySelector(
            `[data-slide-id="${slide.id}"][data-slide-export="true"]`,
          ) as HTMLElement;

          if (exportDiv) {
            try {
              await new Promise((resolve) => setTimeout(resolve, 500));

              const bgImage = await toPng(exportDiv, {
                cacheBust: true,
                width: 1920,
                height: 1080,
                pixelRatio: 2,
                filter: (node) => {
                  if (node instanceof HTMLElement && node.hasAttribute('data-cover-content')) {
                    return false;
                  }
                  if (node.nodeName === 'SCRIPT' || node.nodeName === 'NOSCRIPT') return false;
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

              const { createSectionHeadingSlideHybrid } = await import('./pptxExporter');
              createSectionHeadingSlideHybrid(pptx, config, bgImage, sectionTitle);
              console.log(`✅ Section heading captured (hybrid: bg screenshot + editable text)`);
            } catch (error) {
              console.error('Section heading hybrid export failed, falling back to native:', error);
              const { createSectionHeadingSlide } = await import('./pptxExporter');
              createSectionHeadingSlide(pptx, config, sectionTitle);
            }
          } else {
            const { createSectionHeadingSlide } = await import('./pptxExporter');
            createSectionHeadingSlide(pptx, config, sectionTitle);
          }
          continue;
        }

        // Dashboard slides: screenshot bg + native chart, table, insights
        if (slide.type === 'dashboard') {
          const exportDiv = document.querySelector(
            `[data-slide-id="${slide.id}"][data-slide-export="true"]`,
          ) as HTMLElement;

          if (exportDiv) {
            try {
              await new Promise((resolve) => setTimeout(resolve, 500));

              // Hide text, chart, table, insight — they'll be replaced with native elements
              const hideSelectors = [
                '[data-dashboard-text]',
                '[data-dashboard-chart]',
                '[data-dashboard-table]',
                '[data-dashboard-insight]',
              ];
              const hiddenEls: HTMLElement[] = [];
              hideSelectors.forEach((sel) => {
                exportDiv.querySelectorAll(sel).forEach((el) => {
                  (el as HTMLElement).style.visibility = 'hidden';
                  hiddenEls.push(el as HTMLElement);
                });
              });

              const bgImage = await toPng(exportDiv, {
                cacheBust: true,
                width: 1920,
                height: 1080,
                pixelRatio: 2,
                filter: (node) => {
                  if (node.nodeName === 'SCRIPT' || node.nodeName === 'NOSCRIPT') return false;
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

              // Restore visibility
              hiddenEls.forEach((el) => (el as HTMLElement).style.visibility = '');

              // Extract takeaways text from DOM
              const takeawaysEl = exportDiv.querySelector('[data-dashboard-text="takeaways"]');
              const takeaways: string[] = [];
              if (takeawaysEl) {
                const items = takeawaysEl.querySelectorAll('li');
                if (items.length > 0) {
                  items.forEach((li) => takeaways.push(li.textContent?.replace(/^•\s*/, '') || ''));
                } else {
                  const text = takeawaysEl.textContent?.trim();
                  if (text) takeaways.push(text);
                }
              }

              // Extract table data from DOM
              const tableEl = exportDiv.querySelector('[data-dashboard-table] table');
              const tableData: string[][] = [];
              if (tableEl) {
                const rows = tableEl.querySelectorAll('tbody tr');
                rows.forEach((row) => {
                  const cells: string[] = [];
                  row.querySelectorAll('td').forEach((td) => {
                    cells.push(td.textContent?.trim() || '');
                  });
                  if (cells.length > 0) tableData.push(cells);
                });
              }

              const { createDashboardSlideHybrid } = await import('./pptxExporter');
              createDashboardSlideHybrid(pptx, config, bgImage, { takeaways, tableData });
              console.log(`✅ Dashboard captured (hybrid: bg + native chart/table/insights)`);
            } catch (error) {
              console.error('Dashboard hybrid export failed, falling back to full screenshot:', error);
              // Fall back to full screenshot
              try {
                const imgData = await toPng(exportDiv, {
                  cacheBust: true, width: 1920, height: 1080, pixelRatio: 2,
                  backgroundColor: '#ffffff',
                });
                const pptxSlide = pptx.addSlide();
                pptxSlide.addImage({ data: imgData, x: 0, y: 0, w: '100%', h: '100%' });
              } catch {
                const pptxSlide = pptx.addSlide();
                pptxSlide.addText('Error capturing dashboard', {
                  x: 1, y: 2.5, w: 8, h: 0.5, fontSize: 24, color: 'FF0000', align: 'center',
                });
              }
            }
          }
          continue;
        }

        // Layout Dashboard: screenshot bg + native chart/table/insight
        if (slide.type === 'layout_dashboard') {
          const exportDiv = document.querySelector(
            `[data-slide-id="${slide.id}"][data-slide-export="true"]`,
          ) as HTMLElement;

          if (exportDiv) {
            try {
              await new Promise((resolve) => setTimeout(resolve, 500));

              // Hide elements that will be replaced with native editable elements
              const hideSelectors = [
                '[data-layout-header]',
                '[data-layout-chart]',
                '[data-layout-table]',
                '[data-layout-insight]',
                '[data-layout-footer]',
              ];
              const hiddenEls: HTMLElement[] = [];
              hideSelectors.forEach((sel) => {
                exportDiv.querySelectorAll(sel).forEach((el) => {
                  (el as HTMLElement).style.visibility = 'hidden';
                  hiddenEls.push(el as HTMLElement);
                });
              });

              const bgImage = await toPng(exportDiv, {
                cacheBust: true, width: 1920, height: 1080, pixelRatio: 2,
                filter: (node) => {
                  if (node.nodeName === 'SCRIPT' || node.nodeName === 'NOSCRIPT') return false;
                  return true;
                },
                style: {
                  transform: 'scale(1)', transformOrigin: 'top left',
                  position: 'relative', left: '0', top: '0', margin: '0', padding: '0',
                },
              });

              // Restore visibility
              hiddenEls.forEach((el) => el.style.visibility = '');

              // Use slide title directly from state
              const slideTitle = slide.title || 'Dashboard';

              // Extract insight text
              const insightEl = exportDiv.querySelector('[data-layout-insight]');
              let insightText = '';
              if (insightEl) {
                const contentDiv = insightEl.querySelector('.whitespace-pre-wrap');
                insightText = contentDiv?.textContent?.trim() || '';
              }

              // Extract chart info from DOM
              const chartEl = exportDiv.querySelector('[data-layout-chart]') as HTMLElement;
              let chartData: any = null;
              if (chartEl) {
                const { extractChartInfo } = await import('./pptxExporter');
                chartData = extractChartInfo(chartEl);
              }

              // Extract table data from DOM
              const tableEl = exportDiv.querySelector('[data-layout-table] table');
              const tableHeaders: string[] = [];
              const tableRows: string[][] = [];
              let tableTitle = '';
              if (tableEl) {
                // Try to get table title from caption or nearby header
                const captionEl = exportDiv.querySelector('[data-layout-table] caption, [data-layout-table] h3, [data-layout-table] .font-semibold');
                tableTitle = captionEl?.textContent?.trim() || '';
                tableEl.querySelectorAll('thead th').forEach((th) => {
                  tableHeaders.push(th.textContent?.trim() || '');
                });
                tableEl.querySelectorAll('tbody tr').forEach((row) => {
                  const cells: string[] = [];
                  row.querySelectorAll('td').forEach((td) => {
                    cells.push(td.textContent?.trim() || '');
                  });
                  if (cells.length > 0) tableRows.push(cells);
                });
              }

              // Extract channel from slide data
              const channel = slide.content?.channel || '';

              const { createLayoutDashboardHybrid } = await import('./pptxExporter');
              createLayoutDashboardHybrid(pptx, config, bgImage, {
                title: slideTitle,
                channel,
                chartData,
                insightText,
                tableTitle,
                tableHeaders: tableHeaders.length > 0 ? tableHeaders : undefined,
                tableRows: tableRows.length > 0 ? tableRows : undefined,
                currentPage: i + 1,
                totalPages: slides.length,
              });
              console.log(`✅ Layout dashboard captured (hybrid: bg screenshot + native table/insight/footer)`);
            } catch (error) {
              console.error('Layout dashboard hybrid failed, falling back to screenshot:', error);
              try {
                const imgData = await toPng(exportDiv, {
                  cacheBust: true, width: 1920, height: 1080, pixelRatio: 2,
                  backgroundColor: '#ffffff',
                });
                const pptxSlide = pptx.addSlide();
                pptxSlide.addImage({ data: imgData, x: 0, y: 0, w: '100%', h: '100%' });
              } catch {
                const pptxSlide = pptx.addSlide();
                pptxSlide.addText(`Error capturing: ${slide.title}`, {
                  x: 1, y: 2.5, w: 8, h: 0.5, fontSize: 24, color: 'FF0000', align: 'center',
                });
              }
            }
          }
          continue;
        }

        // Layout Comparison: screenshot bg + native header, charts, insight, footer
        if (slide.type === 'layout_comparison') {
          const exportDiv = document.querySelector(
            `[data-slide-id="${slide.id}"][data-slide-export="true"]`,
          ) as HTMLElement;

          if (exportDiv) {
            try {
              await new Promise((resolve) => setTimeout(resolve, 500));

              // Hide elements that will be replaced with native editable elements
              const hideSelectors = [
                '[data-comparison-header]',
                '[data-comparison-chart-a]',
                '[data-comparison-chart-b]',
                '[data-comparison-insight]',
                '[data-comparison-footer]',
              ];
              const hiddenEls: HTMLElement[] = [];
              hideSelectors.forEach((sel) => {
                exportDiv.querySelectorAll(sel).forEach((el) => {
                  (el as HTMLElement).style.visibility = 'hidden';
                  hiddenEls.push(el as HTMLElement);
                });
              });

              const bgImage = await toPng(exportDiv, {
                cacheBust: true, width: 1920, height: 1080, pixelRatio: 2,
                filter: (node) => {
                  if (node.nodeName === 'SCRIPT' || node.nodeName === 'NOSCRIPT') return false;
                  return true;
                },
                style: {
                  transform: 'scale(1)', transformOrigin: 'top left',
                  position: 'relative', left: '0', top: '0', margin: '0', padding: '0',
                },
              });

              // Restore visibility
              hiddenEls.forEach((el) => el.style.visibility = '');

              // Use slide title directly from state
              const slideTitle = slide.title || 'Comparison';

              // Extract channel
              const channel = slide.content?.channel || '';

              // Extract chart A data
              const chartAEl = exportDiv.querySelector('[data-comparison-chart-a]') as HTMLElement;
              let chartAData: any = null;
              if (chartAEl) {
                const { extractChartInfo } = await import('./pptxExporter');
                chartAData = extractChartInfo(chartAEl);
              }

              // Extract chart B data
              const chartBEl = exportDiv.querySelector('[data-comparison-chart-b]') as HTMLElement;
              let chartBData: any = null;
              if (chartBEl) {
                const { extractChartInfo } = await import('./pptxExporter');
                chartBData = extractChartInfo(chartBEl);
              }

              // Extract insight text
              const insightEl = exportDiv.querySelector('[data-comparison-insight]');
              let insightText = '';
              if (insightEl) {
                const contentDiv = insightEl.querySelector('.whitespace-pre-wrap');
                insightText = contentDiv?.textContent?.trim() || '';
              }

              const { createComparisonHybrid } = await import('./pptxExporter');
              createComparisonHybrid(pptx, config, bgImage, {
                title: slideTitle,
                channel,
                chartAData,
                chartBData,
                insightText,
                currentPage: i + 1,
                totalPages: slides.length,
              });
              console.log(`✅ Layout comparison captured (hybrid: bg + native charts/insight/footer)`);
            } catch (error) {
              console.error('Layout comparison hybrid failed, falling back to screenshot:', error);
              try {
                const imgData = await toPng(exportDiv, {
                  cacheBust: true, width: 1920, height: 1080, pixelRatio: 2,
                  backgroundColor: '#ffffff',
                });
                const pptxSlide = pptx.addSlide();
                pptxSlide.addImage({ data: imgData, x: 0, y: 0, w: '100%', h: '100%' });
              } catch {
                const pptxSlide = pptx.addSlide();
                pptxSlide.addText(`Error capturing: ${slide.title}`, {
                  x: 1, y: 2.5, w: 8, h: 0.5, fontSize: 24, color: 'FF0000', align: 'center',
                });
              }
            }
          }
          continue;
        }

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
