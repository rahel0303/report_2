import PptxGenJS from 'pptxgenjs';
import { ReportConfig, Slide } from '@/app/types';

/**
 * Post-process a PPTX ArrayBuffer to embed Sora TTF fonts inside the ZIP.
 * Uses JSZip to inject font data + OOXML relationships + embFontLst element.
 *
 * OOXML §14.2.7: Embedded fonts MUST be obfuscated (XOR first 32 bytes with GUID bytes).
 */
async function embedSoraFontInPptx(pptxBuffer: ArrayBuffer): Promise<Blob> {
  try {
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(pptxBuffer);

    const relsFile = zip.file('ppt/_rels/presentation.xml.rels');
    const presFile = zip.file('ppt/presentation.xml');
    if (!relsFile || !presFile) return new Blob([pptxBuffer]);

    let relsXml = await relsFile.async('string');
    let presXml = await presFile.async('string');

    // OOXML font obfuscation: XOR first 32 bytes of font with GUID bytes (ECMA-376 §14.2.7)
    function obfuscateFont(fontData: ArrayBuffer, guidStr: string): Uint8Array {
      // Parse GUID: {xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx} → 16 bytes
      const hex = guidStr.replace(/[{}\-]/g, '');
      const guidBytes = new Uint8Array(16);
      for (let i = 0; i < 16; i++) {
        guidBytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
      }
      // Reverse the byte order as per spec
      guidBytes.reverse();

      const buf = new Uint8Array(fontData.slice(0));
      // XOR first 32 bytes with guidBytes (16 bytes × 2)
      for (let i = 0; i < 32 && i < buf.length; i++) {
        buf[i] ^= guidBytes[i % 16];
      }
      return buf;
    }

    // Generate a random GUID string
    function makeGuid(): string {
      const hex = () => Math.floor(Math.random() * 0xFFFF).toString(16).padStart(4, '0');
      const hex8 = () => Math.floor(Math.random() * 0xFFFFFFFF).toString(16).padStart(8, '0');
      return `{${hex8()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}}`;
    }

    // Find max existing rId
    const rIdNums = [...relsXml.matchAll(/Id="rId(\d+)"/g)].map((m) => parseInt(m[1]));
    const maxRId = rIdNums.length > 0 ? Math.max(...rIdNums) : 10;

    const fontDefs = [
      { type: 'regular', file: 'Sora-Regular.ttf', rId: `rId${maxRId + 1}`, fntFile: 'font_sora_r.odttf', guid: makeGuid() },
      { type: 'bold',    file: 'Sora-Bold.ttf',    rId: `rId${maxRId + 2}`, fntFile: 'font_sora_b.odttf', guid: makeGuid() },
    ];

    const fontRelXml: string[] = [];
    const fontRefXml: string[] = [];
    let anyEmbedded = false;

    for (const fd of fontDefs) {
      try {
        const resp = await fetch(`/fonts/${fd.file}`);
        console.log(`[Font Embed] fetch /fonts/${fd.file} → status ${resp.status}`);
        if (!resp.ok) continue;
        const raw = await resp.arrayBuffer();
        // Obfuscate per OOXML spec
        const obfuscated = obfuscateFont(raw, fd.guid);
        console.log(`[Font Embed] ${fd.file} → obfuscated ${obfuscated.length} bytes (guid=${fd.guid})`);
        zip.file(`ppt/fonts/${fd.fntFile}`, obfuscated);
        fontRelXml.push(
          `<Relationship Id="${fd.rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/font" Target="fonts/${fd.fntFile}"/>`,
        );
        fontRefXml.push(`<p:${fd.type} r:id="${fd.rId}"/>`);
        anyEmbedded = true;
      } catch (err) {
        console.warn(`[Font Embed] failed for ${fd.file}:`, err);
      }
    }

    if (!anyEmbedded) {
      console.warn('[Font Embed] no fonts embedded, skipping post-process');
      return new Blob([pptxBuffer]);
    }

    // Update rels file
    relsXml = relsXml.replace('</Relationships>', `${fontRelXml.join('\n')}\n</Relationships>`);
    zip.file('ppt/_rels/presentation.xml.rels', relsXml);

    // Inject <p:embFontLst> into presentation.xml
    const embFontBlock = `<p:embFont><p:font typeface="Sora"/>${fontRefXml.join('')}</p:embFont>`;
    if (presXml.includes('<p:embFontLst>')) {
      presXml = presXml.replace('</p:embFontLst>', `${embFontBlock}</p:embFontLst>`);
    } else {
      presXml = presXml.replace('</p:presentation>', `<p:embFontLst>${embFontBlock}</p:embFontLst></p:presentation>`);
    }
    zip.file('ppt/presentation.xml', presXml);
    console.log('[Font Embed] Sora embedded + obfuscated successfully ✓');

    return zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });
  } catch (e) {
    console.warn('Font embedding failed, falling back to original PPTX:', e);
    return new Blob([pptxBuffer]);
  }
}

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
              hiddenEls.forEach((el) => ((el as HTMLElement).style.visibility = ''));

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
              console.error(
                'Dashboard hybrid export failed, falling back to full screenshot:',
                error,
              );
              // Fall back to full screenshot
              try {
                const imgData = await toPng(exportDiv, {
                  cacheBust: true,
                  width: 1920,
                  height: 1080,
                  pixelRatio: 2,
                  backgroundColor: '#ffffff',
                });
                const pptxSlide = pptx.addSlide();
                pptxSlide.addImage({ data: imgData, x: 0, y: 0, w: '100%', h: '100%' });
              } catch {
                const pptxSlide = pptx.addSlide();
                pptxSlide.addText('Error capturing dashboard', {
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
          }
          continue;
        }

        // Layout Dashboard: fully native – same approach as KPI/Overview (no screenshot)
        if (slide.type === 'layout_dashboard') {
          const exportDiv = document.querySelector(
            `[data-slide-id="${slide.id}"][data-slide-export="true"]`,
          ) as HTMLElement;

          if (exportDiv) {
            try {
              await new Promise((resolve) => setTimeout(resolve, 300));

              const slideTitle = slide.title || 'Dashboard';
              const channel = slide.content?.channel || '';

              // Extract chart info from DOM
              const chartEl = exportDiv.querySelector('[data-layout-chart]') as HTMLElement;
              let chartData: any = null;
              if (chartEl) {
                const { extractChartInfo } = await import('./pptxExporter');
                chartData = extractChartInfo(chartEl);
              }

              // Extract insight text
              const insightEl = exportDiv.querySelector('[data-layout-insight]');
              let insightText = '';
              if (insightEl) {
                const contentDiv = insightEl.querySelector('.whitespace-pre-wrap');
                insightText = contentDiv?.textContent?.trim() || '';
              }

              // Extract table data from DOM
              const tableEl = exportDiv.querySelector('[data-layout-table] table');
              const tableHeaders: string[] = [];
              const tableRows: string[][] = [];
              let tableTitle = '';
              if (tableEl) {
                const captionEl = exportDiv.querySelector(
                  '[data-layout-table] caption, [data-layout-table] h3, [data-layout-table] .font-semibold',
                );
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

              const { createLayoutDashboardNative } = await import('./pptxExporter');
              createLayoutDashboardNative(pptx, config, {
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
              console.log(`✅ Layout dashboard created (native – same as KPI/Overview)`);
            } catch (error) {
              console.error('Layout dashboard native failed:', error);
              const pptxSlide = pptx.addSlide();
              pptxSlide.addText(`Error creating: ${slide.title}`, {
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
              hiddenEls.forEach((el) => (el.style.visibility = ''));

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
              console.log(
                `✅ Layout comparison captured (hybrid: bg + native charts/insight/footer)`,
              );
            } catch (error) {
              console.error('Layout comparison hybrid failed, falling back to screenshot:', error);
              try {
                const imgData = await toPng(exportDiv, {
                  cacheBust: true,
                  width: 1920,
                  height: 1080,
                  pixelRatio: 2,
                  backgroundColor: '#ffffff',
                });
                const pptxSlide = pptx.addSlide();
                pptxSlide.addImage({ data: imgData, x: 0, y: 0, w: '100%', h: '100%' });
              } catch {
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
          }
          continue;
        }

        // Layout KPI: native elements only (no screenshot background)
        if (slide.type === 'layout_kpi') {
          const exportDiv = document.querySelector(
            `[data-slide-id="${slide.id}"][data-slide-export="true"]`,
          ) as HTMLElement;

          if (exportDiv) {
            try {
              await new Promise((resolve) => setTimeout(resolve, 500));

              const slideTitle = slide.title || 'KPI Overview';
              const channel = slide.content?.channel || '';

              // Extract metrics data
              const metricsEl = exportDiv.querySelector('[data-kpi-metrics]') as HTMLElement;
              const metrics: Array<{
                label: string;
                value: string;
                trend: 'up' | 'down';
                trendValue: string;
                iconId?: string;
              }> = [];
              if (metricsEl) {
                metricsEl.querySelectorAll('.rounded-xl.border').forEach((card) => {
                  const labelEl = card.querySelector('.uppercase.tracking-wider');
                  const valueEl = card.querySelector('.font-bold.tracking-tight');
                  const trendEl = card.querySelector('.rounded-full');

                  if (labelEl && valueEl) {
                    const label = labelEl.textContent?.trim() || '';
                    const value = valueEl.textContent?.trim() || '';
                    const trendText = trendEl?.textContent?.trim() || '';
                    const trend =
                      trendEl?.classList.contains('text-emerald-600') ||
                      trendEl?.classList.contains('dark:text-emerald-400')
                        ? 'up'
                        : 'down';

                    metrics.push({
                      label,
                      value,
                      trend: trend as 'up' | 'down',
                      trendValue: trendText,
                    });
                  }
                });
              }

              // Extract chart data
              const chartEl = exportDiv.querySelector('[data-kpi-chart]') as HTMLElement;
              let chartData: any = null;
              if (chartEl) {
                const { extractChartInfo } = await import('./pptxExporter');
                chartData = extractChartInfo(chartEl);
              }

              // Extract insight text
              const insightEl = exportDiv.querySelector('[data-kpi-insight]');
              let insightText = '';
              if (insightEl) {
                const contentDiv = insightEl.querySelector('.whitespace-pre-wrap');
                insightText = contentDiv?.textContent?.trim() || '';
              }

              const { createKPINative } = await import('./pptxExporter');
              createKPINative(pptx, config, {
                title: slideTitle,
                channel,
                metrics,
                chartData,
                insightText,
                currentPage: i + 1,
                totalPages: slides.length,
              });
              console.log(`✅ Layout KPI created (native)`);
            } catch (error) {
              console.error('Layout KPI native failed:', error);
              const pptxSlide = pptx.addSlide();
              pptxSlide.addText(`Error creating: ${slide.title}`, {
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
          continue;
        }

        // Layout Overview: screenshot bg + native header, visual (chart/table screenshot), insight, footer
        // Layout Overview: native elements only (no screenshot background)
        if (slide.type === 'layout_overview') {
          const exportDiv = document.querySelector(
            `[data-slide-id="${slide.id}"][data-slide-export="true"]`,
          ) as HTMLElement;

          if (exportDiv) {
            try {
              await new Promise((resolve) => setTimeout(resolve, 500));

              const slideTitle = slide.title || 'Overview Slide';
              const channel = slide.content?.channel || '';
              const visualMode = slide.content?.visualMode || null;

              // Extract chart data if visual is chart
              let chartData: any = null;
              if (visualMode === 'chart') {
                const chartEl = exportDiv.querySelector('[data-overview-visual]') as HTMLElement;
                if (chartEl) {
                  const { extractChartInfo } = await import('./pptxExporter');
                  chartData = extractChartInfo(chartEl);
                }
              }

              // Extract table data if visual is table
              let tableHeaders: string[] = [];
              let tableRows: string[][] = [];
              if (visualMode === 'table') {
                const tableEl = exportDiv.querySelector('[data-overview-visual] table');
                if (tableEl) {
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
              }

              // Extract insight text
              const insightEl = exportDiv.querySelector('[data-overview-insight]');
              let insightText = '';
              if (insightEl) {
                const contentDiv = insightEl.querySelector('.whitespace-pre-wrap');
                insightText = contentDiv?.textContent?.trim() || '';
              }

              const { createOverviewNative } = await import('./pptxExporter');
              createOverviewNative(pptx, config, {
                title: slideTitle,
                channel,
                visualMode,
                chartData,
                tableHeaders: tableHeaders.length > 0 ? tableHeaders : undefined,
                tableRows: tableRows.length > 0 ? tableRows : undefined,
                insightText,
                currentPage: i + 1,
                totalPages: slides.length,
              });
              console.log(`✅ Layout Overview created (native)`);
            } catch (error) {
              console.error('Layout Overview native failed:', error);
              const pptxSlide = pptx.addSlide();
              pptxSlide.addText(`Error creating: ${slide.title}`, {
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
          continue;
        }

        // Layout Content (Visual): screenshot bg with content grid + native header, insight, footer
        if (slide.type === 'layout_content') {
          const exportDiv = document.querySelector(
            `[data-slide-id="${slide.id}"][data-slide-export="true"]`,
          ) as HTMLElement;

          if (exportDiv) {
            try {
              await new Promise((resolve) => setTimeout(resolve, 300));

              const slideTitle = slide.title || 'Creative Analysis';
              const channel = slide.content?.channel || '';
              const postCount: number = slide.content?.postCount || 4;
              const filterType: string = slide.content?.filterType || 'top';

              // ── Extract post data from DOM ──────────────────────────────
              const gridEl = exportDiv.querySelector('[data-content-grid]') as HTMLElement | null;
              const postElements = gridEl
                ? Array.from(gridEl.querySelectorAll('[data-content-post]'))
                : [];

              // Helper: draw img element onto canvas and return base64
              const imgElToBase64 = (imgEl: HTMLImageElement): Promise<string> =>
                new Promise((resolve) => {
                  try {
                    const canvas = document.createElement('canvas');
                    canvas.width = imgEl.naturalWidth || imgEl.width || 400;
                    canvas.height = imgEl.naturalHeight || imgEl.height || 400;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                      ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);
                      resolve(canvas.toDataURL('image/jpeg', 0.88));
                    } else {
                      resolve('');
                    }
                  } catch {
                    resolve('');
                  }
                });

              type PostData = {
                imageBase64: string;
                postId: string;
                reach: string;
                engagement: string;
                er: string;
                filterBadge?: string;
              };

              const posts: PostData[] = await Promise.all(
                postElements.map(async (cardEl): Promise<PostData> => {
                  const imgEl = cardEl.querySelector('img') as HTMLImageElement | null;
                  let imageBase64 = '';
                  if (imgEl) {
                    if (imgEl.complete && imgEl.naturalWidth > 0) {
                      imageBase64 = await imgElToBase64(imgEl);
                    } else if (imgEl.src) {
                      await new Promise<void>((res) => {
                        const tmp = new Image();
                        tmp.crossOrigin = 'anonymous';
                        tmp.onload = () => {
                          imgEl.crossOrigin = 'anonymous';
                          res();
                        };
                        tmp.onerror = () => res();
                        tmp.src = imgEl.src;
                      });
                      imageBase64 = await imgElToBase64(imgEl);
                    }
                  }

                  const postIdEl = cardEl.querySelector('[data-post-id]');
                  const reachEl = cardEl.querySelector('[data-post-reach]');
                  const engEl = cardEl.querySelector('[data-post-engagement]');
                  const erEl = cardEl.querySelector('[data-post-er]');

                  let filterBadge = '';
                  if (filterType === 'mixed') {
                    const badgeEl = cardEl.querySelector(
                      '[class*="font-bold"][class*="rounded-full"]',
                    );
                    filterBadge = badgeEl?.textContent?.trim()?.toLowerCase() || '';
                  }

                  return {
                    imageBase64,
                    postId: postIdEl?.textContent?.trim() || '',
                    reach: reachEl?.textContent?.trim() || '',
                    engagement: engEl?.textContent?.trim() || '',
                    er: erEl?.textContent?.trim() || '',
                    filterBadge,
                  };
                }),
              );

              // ── Extract insight text ────────────────────────────────────
              const insightEl = exportDiv.querySelector('[data-content-insight]');
              let insightText = '';
              if (insightEl) {
                const contentDiv = insightEl.querySelector('.whitespace-pre-wrap');
                insightText = contentDiv?.textContent?.trim() || '';
              }

              const { createContentNative } = await import('./pptxExporter');
              createContentNative(pptx, config, {
                title: slideTitle,
                channel,
                insightText,
                currentPage: i + 1,
                totalPages: slides.length,
                posts,
                postCount,
                filterType,
              });
              console.log(`✅ Layout Content native (${posts.length} posts)`);
            } catch (error) {
              console.error('Layout Content native failed:', error);
              const pptxSlide = pptx.addSlide();
              pptxSlide.addText(`Error exporting: ${slide.title}`, {
                x: 1,
                y: 2.5,
                w: 8,
                h: 0.5,
                fontSize: 20,
                color: 'FF0000',
                align: 'center',
              });
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

      // Get PPTX as ArrayBuffer so we can post-process (embed fonts)
      const pptxBuffer = (await (pptx as any).write('arraybuffer')) as ArrayBuffer;

      // Embed Sora font if the report uses it
      const fontName = config.font?.name || 'Inter';
      console.log(`[Export] font name: "${fontName}"`);
      const finalBlob =
        fontName.toLowerCase().includes('sora')
          ? await embedSoraFontInPptx(pptxBuffer)
          : new Blob([pptxBuffer], {
              type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            });

      // Trigger browser download
      const dlUrl = URL.createObjectURL(finalBlob);
      const anchor = document.createElement('a');
      anchor.href = dlUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(dlUrl);

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
