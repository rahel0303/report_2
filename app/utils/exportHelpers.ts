import PptxGenJS from 'pptxgenjs';
import { ReportConfig, Slide } from '@/app/types';

/** Fetch a remote image URL and return a base64 data URI for embedding in PPTX */
async function imageUrlToBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** For a list of posts, resolve missing image_urls via thumbnail API, then convert all to base64 */
async function resolvePostImages(
  posts: any[],
  channel = 'instagram',
): Promise<any[]> {
  return Promise.all(
    posts.map(async (post) => {
      let image_url: string | null = post.image_url || null;

      // If not cached yet, fetch via API (triggers Apify/oEmbed + Cloudinary if needed)
      if (!image_url && post.url) {
        try {
          const endpoint =
            channel === 'tiktok'
              ? `/api/innercircle/tt-thumbnail?url=${encodeURIComponent(post.url)}`
              : channel === 'twitter'
              ? `/api/innercircle/tw-thumbnail?url=${encodeURIComponent(post.url)}`
              : `/api/innercircle/ig-thumbnail?url=${encodeURIComponent(post.url)}&channel=${channel}`;
          const res = await fetch(endpoint);
          const d = await res.json();
          image_url = d.image_url || null;
        } catch {
          image_url = null;
        }
      }

      // Convert to base64 for reliable PPTX embedding
      const image_b64 = image_url ? await imageUrlToBase64(image_url) : null;

      return { ...post, image_url: image_b64 };
    }),
  );
}

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
      const hex = () =>
        Math.floor(Math.random() * 0xffff)
          .toString(16)
          .padStart(4, '0');
      const hex8 = () =>
        Math.floor(Math.random() * 0xffffffff)
          .toString(16)
          .padStart(8, '0');
      return `{${hex8()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}}`;
    }

    // Find max existing rId
    const rIdNums = [...relsXml.matchAll(/Id="rId(\d+)"/g)].map((m) => parseInt(m[1]));
    const maxRId = rIdNums.length > 0 ? Math.max(...rIdNums) : 10;

    const fontDefs = [
      {
        type: 'regular',
        file: 'Sora-Regular.ttf',
        rId: `rId${maxRId + 1}`,
        fntFile: 'font_sora_r.odttf',
        guid: makeGuid(),
      },
      {
        type: 'bold',
        file: 'Sora-Bold.ttf',
        rId: `rId${maxRId + 2}`,
        fntFile: 'font_sora_b.odttf',
        guid: makeGuid(),
      },
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
        console.log(
          `[Font Embed] ${fd.file} → obfuscated ${obfuscated.length} bytes (guid=${fd.guid})`,
        );
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
      presXml = presXml.replace(
        '</p:presentation>',
        `<p:embFontLst>${embFontBlock}</p:embFontLst></p:presentation>`,
      );
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

              // Screenshot background only (hide content layer) + native editable text
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

              const { createCoverSlideHybrid } = await import('./pptxExporter');
              await createCoverSlideHybrid(pptx, config, bgImage);
              console.log(`✅ Cover slide captured (hybrid: bg screenshot + editable text)`);
            } catch (error) {
              console.error('Cover export failed, falling back to native:', error);
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

        // Thank You slide: same hybrid approach as cover
        if (slide.type === 'thank_you') {
          const exportDiv = document.querySelector(
            `[data-slide-id="${slide.id}"][data-slide-export="true"]`,
          ) as HTMLElement;

          if (exportDiv && config.coverDesign) {
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

              const { createThankYouSlideHybrid } = await import('./pptxExporter');
              await createThankYouSlideHybrid(pptx, config, bgImage);
              console.log(`✅ Thank You slide captured (hybrid)`);
            } catch (error) {
              console.error('Thank You slide export failed, falling back to screenshot:', error);
              // Screenshot fallback — just capture as image
              try {
                const imgData = await toPng(exportDiv, {
                  cacheBust: true,
                  width: 1920,
                  height: 1080,
                  pixelRatio: 2,
                });
                const pptxSlide = pptx.addSlide();
                pptxSlide.addImage({ data: imgData, x: 0, y: 0, w: '100%', h: '100%' });
              } catch {}
            }
          } else {
            // No DOM element — minimal native fallback
            const pptxSlide = pptx.addSlide();
            const primaryColor = config.coverDesign?.colors?.primary?.replace('#', '') || '3B82F6';
            pptxSlide.background = { color: primaryColor };
            pptxSlide.addText('Thank You', {
              x: 0,
              y: 1.8,
              w: 10,
              h: 2,
              fontSize: 60,
              bold: true,
              color: 'FFFFFF',
              align: 'center',
              valign: 'middle',
              fontFace: config.font?.name || 'Inter',
            });
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

              // Clone into isolated container, hide title/decorations, screenshot bg only,
              // then overlay native editable title (hybrid approach for all templates).
              const isolatedWrapper = document.createElement('div');
              isolatedWrapper.style.cssText =
                'position:fixed;top:0;left:0;width:1920px;height:1080px;overflow:hidden;z-index:99999;pointer-events:none;';
              const clone = exportDiv.cloneNode(true) as HTMLElement;
              clone.style.position = 'relative';
              clone.style.left = '0';
              clone.style.top = '0';
              clone.style.transform = 'scale(1)';
              clone.style.transformOrigin = 'top left';
              clone.style.margin = '0';
              clone.style.padding = '0';
              // Hide title + all decorative elements (re-added as native PPT text/shapes)
              clone
                .querySelectorAll('[data-section-title], [data-section-decoration]')
                .forEach((el) => {
                  (el as HTMLElement).style.visibility = 'hidden';
                });
              isolatedWrapper.appendChild(clone);
              document.body.appendChild(isolatedWrapper);

              let bgImage: string;
              try {
                bgImage = await toPng(clone, {
                  cacheBust: true,
                  width: 1920,
                  height: 1080,
                  pixelRatio: 2,
                  filter: (node) => {
                    if (node.nodeName === 'SCRIPT' || node.nodeName === 'NOSCRIPT') return false;
                    return true;
                  },
                });
              } finally {
                document.body.removeChild(isolatedWrapper);
              }

              const { createSectionHeadingSlideHybrid } = await import('./pptxExporter');
              await createSectionHeadingSlideHybrid(pptx, config, bgImage, sectionTitle);
              console.log(`✅ Section heading captured (hybrid: bg screenshot + editable text)`);
            } catch (error) {
              console.error('Section heading export failed, falling back to native:', error);
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

        // ── InnerCircle slides: hybrid (native PPTX + screenshots for wordclouds) ─
        if (slide.type.startsWith('ic_')) {
          const exportDiv = document.querySelector(
            `[data-slide-id="${slide.id}"][data-slide-export="true"]`,
          ) as HTMLElement;

          if (exportDiv) {
            try {
              // Wait for API data + recharts render + react-d3-cloud layout
              await new Promise((resolve) => setTimeout(resolve, 3000));

              // ── ic_all_overview: native table + insight ──────────────────
              if (slide.type === 'ic_all_overview') {
                const tableEl = exportDiv.querySelector('[data-ic-table]');
                const tableHeaders: string[] = [];
                type MetricCell = { base: string; pct: string; positive: boolean | null };
                const tableRows: (string | MetricCell)[][] = [];
                if (tableEl) {
                  tableEl.querySelectorAll('thead th').forEach((th) => {
                    tableHeaders.push(th.textContent?.trim() || '');
                  });
                  tableEl.querySelectorAll('tbody tr').forEach((row) => {
                    const cells: (string | MetricCell)[] = [];
                    row.querySelectorAll('td').forEach((td) => {
                      // MetricCell has a percentage span badge (text contains %)
                      const spanEl = td.querySelector('span');
                      const divs = td.querySelectorAll('div');
                      const spanText = spanEl?.textContent?.trim() || '';
                      if (spanEl && divs.length >= 1 && spanText.includes('%')) {
                        const base = divs[0].textContent?.trim() || '';
                        const pct = spanText;
                        const positive = pct.startsWith('+')
                          ? true
                          : pct.startsWith('-')
                            ? false
                            : null;
                        cells.push({ base, pct, positive });
                      } else {
                        cells.push(td.textContent?.trim() || '');
                      }
                    });
                    if (cells.length > 0) tableRows.push(cells);
                  });
                }

                const insightEl = exportDiv.querySelector('[data-ic-insight]');
                const insightText = insightEl?.textContent?.trim() || '';

                const { createIcAllOverviewNative } = await import('./pptxExporter');
                createIcAllOverviewNative(pptx, config, {
                  tableHeaders,
                  tableRows,
                  insightText,
                  currentPage: i + 1,
                  totalPages: slides.length,
                });
                console.log(`✅ ic_all_overview created (native)`);
              }

              // ── ic_all_sentiment: native chart + sentiment boxes + wc screenshot ─
              else if (slide.type === 'ic_all_sentiment') {
                const chartEl = exportDiv.querySelector('[data-ic-chart]') as HTMLElement;
                let chartData: any = null;
                if (chartEl) {
                  const { extractChartInfo } = await import('./pptxExporter');
                  chartData = extractChartInfo(chartEl);
                }

                const wcEl = exportDiv.querySelector('[data-ic-wc]') as HTMLElement | null;
                let wcImage = '';
                if (wcEl) {
                  wcImage = await toPng(wcEl, {
                    cacheBust: true,
                    pixelRatio: 2,
                    backgroundColor: '#ffffff',
                  });
                }

                const totalsEl = exportDiv.querySelector('[data-ic-totals]');
                let totals: {
                  positive_pct: number;
                  neutral_pct: number;
                  negative_pct: number;
                } | null = null;
                if (totalsEl) {
                  try {
                    totals = JSON.parse(totalsEl.getAttribute('data-ic-totals') || '{}');
                  } catch {
                    /* ignore parse error */
                  }
                }

                const { createIcAllSentimentHybrid } = await import('./pptxExporter');
                createIcAllSentimentHybrid(pptx, config, {
                  chartData,
                  wcImage,
                  totals,
                  currentPage: i + 1,
                  totalPages: slides.length,
                });
                console.log(`✅ ic_all_sentiment created (hybrid)`);
              }

              // ── ic_ig/tt/fb_sentiment: native chart + 3 wc screenshots ───
              else if (
                slide.type === 'ic_ig_sentiment' ||
                slide.type === 'ic_tt_sentiment' ||
                slide.type === 'ic_fb_sentiment'
              ) {
                const PLATFORM_MAP: Record<string, { label: string; color: string }> = {
                  ic_ig_sentiment: { label: 'Instagram', color: 'E1306C' },
                  ic_tt_sentiment: { label: 'TikTok', color: '010101' },
                  ic_fb_sentiment: { label: 'Facebook', color: '1877F2' },
                };
                const platformInfo = PLATFORM_MAP[slide.type];

                const chartEl = exportDiv.querySelector('[data-ic-chart]') as HTMLElement;
                let chartData: any = null;
                if (chartEl) {
                  const { extractChartInfo } = await import('./pptxExporter');
                  chartData = extractChartInfo(chartEl);
                }

                const screenshotWC = async (selector: string): Promise<string> => {
                  const el = exportDiv.querySelector(selector) as HTMLElement | null;
                  if (!el) return '';
                  try {
                    return await toPng(el, {
                      cacheBust: true,
                      pixelRatio: 2,
                      backgroundColor: '#ffffff',
                    });
                  } catch {
                    return '';
                  }
                };

                const [wcNeutral, wcPositive, wcNegative] = await Promise.all([
                  screenshotWC('[data-ic-wc-neutral]'),
                  screenshotWC('[data-ic-wc-positive]'),
                  screenshotWC('[data-ic-wc-negative]'),
                ]);

                const { createIcChannelSentimentHybrid } = await import('./pptxExporter');
                createIcChannelSentimentHybrid(pptx, config, {
                  platform: platformInfo.label,
                  platformColor: platformInfo.color,
                  chartData,
                  wcNeutral,
                  wcPositive,
                  wcNegative,
                  currentPage: i + 1,
                  totalPages: slides.length,
                });
                console.log(`✅ ${slide.type} created (hybrid)`);
              }

              // ── ic_ig_growth: native dual-axis chart + analysis + table ───
              else if (slide.type === 'ic_ig_growth') {
                const chartEl = exportDiv.querySelector('[data-ic-chart]') as HTMLElement;
                let chartData: any = null;
                if (chartEl) {
                  const { extractChartInfo } = await import('./pptxExporter');
                  chartData = extractChartInfo(chartEl);
                }

                const tableEl = exportDiv.querySelector('[data-ic-ig-table]');
                const tableHeaders: string[] = [];
                const tableRows: string[][] = [];
                if (tableEl) {
                  tableEl.querySelectorAll('thead th').forEach((th) => {
                    tableHeaders.push(th.textContent?.trim() || '');
                  });
                  tableEl.querySelectorAll('tbody tr').forEach((row) => {
                    const cells: string[] = [];
                    row
                      .querySelectorAll('td')
                      .forEach((td) => cells.push(td.textContent?.trim() || ''));
                    if (cells.length > 0) tableRows.push(cells);
                  });
                }

                const insightEl = exportDiv.querySelector('[data-ic-insight]');
                const insightText = insightEl?.textContent?.trim() || '';

                const { createIcIgGrowthNative } = await import('./pptxExporter');
                createIcIgGrowthNative(pptx, config, {
                  chartData,
                  tableHeaders,
                  tableRows,
                  insightText,
                  currentPage: i + 1,
                  totalPages: slides.length,
                });
                console.log(`✅ ic_ig_growth created (native)`);
              }

              // ── ic_ig_content_pillar: native post cards + insight boxes ──
              else if (slide.type === 'ic_ig_content_pillar') {
                const dataEl = exportDiv.querySelector(
                  '[data-ic-content-pillar]',
                ) as HTMLElement | null;
                let pillars: any[] = [];
                if (dataEl) {
                  try {
                    pillars = JSON.parse(dataEl.getAttribute('data-ic-content-pillar') || '[]');
                  } catch {}
                }

                // Fallback: fetch from API if slide was never opened
                if (pillars.length === 0 && config.clientName && config.period) {
                  try {
                    const apiRes = await fetch(
                      `/api/innercircle/ig-content-pillar?brand=${encodeURIComponent(config.clientName)}&period=${encodeURIComponent(config.period)}`,
                    );
                    const apiData = await apiRes.json();
                    pillars = (apiData.pillars || []).map((p: any) => ({
                      pillar: p.pillar,
                      lowest: p.lowest,
                      highest: p.highest,
                      insight: '',
                    }));
                  } catch {}
                }

                // Resolve images for all posts in all pillars
                pillars = await Promise.all(
                  pillars.map(async (p: any) => ({
                    ...p,
                    lowest: await resolvePostImages(p.lowest || []),
                    highest: await resolvePostImages(p.highest || []),
                  })),
                );

                const { createIcIgContentPillarNative } = await import('./pptxExporter');
                createIcIgContentPillarNative(pptx, config, {
                  pillars,
                  currentPage: i + 1,
                  totalPages: slides.length,
                });
                console.log(`✅ ic_ig_content_pillar created (native)`);
              }

              // ── ic_ig_tagged_post: native post cards + KPIs + sentiment ─
              else if (slide.type === 'ic_ig_tagged_post') {
                const dataEl = exportDiv.querySelector(
                  '[data-ic-tagged-posts]',
                ) as HTMLElement | null;
                let posts: any[] = [];
                let summary: any = null;
                let sentiments: any = { Negative: [], Positive: [], Neutral: [] };
                if (dataEl) {
                  try {
                    posts = JSON.parse(dataEl.getAttribute('data-ic-tagged-posts') || '[]');
                  } catch {}
                  try {
                    summary = JSON.parse(dataEl.getAttribute('data-ic-tagged-summary') || 'null');
                  } catch {}
                  try {
                    sentiments = JSON.parse(
                      dataEl.getAttribute('data-ic-tagged-sentiments') || '{}',
                    );
                  } catch {}
                }
                // Fallback: fetch from API if slide was never opened
                if (posts.length === 0 && config.clientName && config.period) {
                  try {
                    const apiRes = await fetch(
                      `/api/innercircle/ig-tagged-post?brand=${encodeURIComponent(config.clientName)}&period=${encodeURIComponent(config.period)}`,
                    );
                    const apiData = await apiRes.json();
                    posts = apiData.posts || [];
                    summary = summary || apiData.summary || null;
                    sentiments = sentiments || apiData.sentiments || { Negative: [], Positive: [], Neutral: [] };
                  } catch {}
                }

                // Resolve images + convert to base64
                posts = await resolvePostImages(posts);

                const { createIcIgTaggedPostNative } = await import('./pptxExporter');
                createIcIgTaggedPostNative(pptx, config, {
                  posts,
                  summary,
                  sentiments,
                  currentPage: i + 1,
                  totalPages: slides.length,
                });
                console.log(`✅ ic_ig_tagged_post created (native)`);
              }

              // ── ic_ig_cp_eng (AON & Non-AON Engagement/Post per Pillar) ─
              else if (slide.type === 'ic_ig_cp_eng_aon' || slide.type === 'ic_ig_cp_eng_nonaon') {
                const dataEl = exportDiv.querySelector('[data-ig-cp-eng]') as HTMLElement | null;
                let cpEngData: any = null;
                if (dataEl) {
                  try {
                    cpEngData = JSON.parse(dataEl.getAttribute('data-ig-cp-eng') || 'null');
                  } catch {}
                }
                if (cpEngData) {
                  const { createIcIgCpEngNative } = await import('./pptxExporter');
                  createIcIgCpEngNative(pptx, config, {
                    ...cpEngData,
                    currentPage: i + 1,
                    totalPages: slides.length,
                  });
                  console.log(`✅ ${slide.type} created (native)`);
                } else {
                  console.warn(`⚠️ ${slide.type}: no data found, skipping`);
                }
              }

              // ── ic_ig_cp_reach (AON & Non-AON Reach/ER per Pillar) ──────
              else if (
                slide.type === 'ic_ig_cp_reach_aon' ||
                slide.type === 'ic_ig_cp_reach_nonaon'
              ) {
                const dataEl = exportDiv.querySelector('[data-ig-cp-reach]') as HTMLElement | null;
                let cpReachData: any = null;
                if (dataEl) {
                  try {
                    cpReachData = JSON.parse(dataEl.getAttribute('data-ig-cp-reach') || 'null');
                  } catch {}
                }
                if (cpReachData) {
                  const { createIcIgCpReachNative } = await import('./pptxExporter');
                  createIcIgCpReachNative(pptx, config, {
                    ...cpReachData,
                    currentPage: i + 1,
                    totalPages: slides.length,
                  });
                  console.log(`✅ ${slide.type} created (native)`);
                } else {
                  console.warn(`⚠️ ${slide.type}: no data found, skipping`);
                }
              }

              // ── ic_ig_best_least: native post cards + analysis boxes ───
              else if (slide.type === 'ic_ig_best_least') {
                const dataEl = exportDiv.querySelector('[data-ic-best-data]') as HTMLElement | null;
                let best: any[] = [];
                let least: any[] = [];
                let bestAnalysis = '';
                let leastAnalysis = '';
                if (dataEl) {
                  try {
                    best = JSON.parse(dataEl.getAttribute('data-ic-best-data') || '[]');
                  } catch {}
                  try {
                    least = JSON.parse(dataEl.getAttribute('data-ic-least-data') || '[]');
                  } catch {}
                  bestAnalysis = dataEl.getAttribute('data-ic-best-analysis') || '';
                  leastAnalysis = dataEl.getAttribute('data-ic-least-analysis') || '';
                }

                // If no DOM data (slide never opened), fetch from API directly
                if (best.length === 0 && least.length === 0 && config.clientName && config.period) {
                  try {
                    const apiRes = await fetch(
                      `/api/innercircle/ig-best-least?brand=${encodeURIComponent(config.clientName)}&period=${encodeURIComponent(config.period)}`,
                    );
                    const apiData = await apiRes.json();
                    best = apiData.best || [];
                    least = apiData.least || [];
                  } catch {}
                }

                // Resolve missing images + convert all to base64 for PPTX embedding
                [best, least] = await Promise.all([
                  resolvePostImages(best),
                  resolvePostImages(least),
                ]);

                const { createIcIgBestLeastNative } = await import('./pptxExporter');
                createIcIgBestLeastNative(pptx, config, {
                  best,
                  least,
                  bestAnalysis,
                  leastAnalysis,
                  currentPage: i + 1,
                  totalPages: slides.length,
                });
                console.log(`✅ ic_ig_best_least created (native)`);
              }

              // ── ic_tt_growth: native chart + table + insight ───────────
              else if (slide.type === 'ic_tt_growth') {
                const dataEl = exportDiv.querySelector('[data-ic-tt-chart]') as HTMLElement | null;
                let chartData: any[] = [];
                let tableRows: any[] = [];
                let insight = '';
                if (dataEl) {
                  try {
                    chartData = JSON.parse(dataEl.getAttribute('data-ic-tt-chart') || '[]');
                  } catch {}
                  try {
                    tableRows = JSON.parse(dataEl.getAttribute('data-ic-tt-table') || '[]');
                  } catch {}
                  insight = dataEl.getAttribute('data-ic-tt-insight') || '';
                }
                const { createIcTtGrowthNative } = await import('./pptxExporter');
                createIcTtGrowthNative(pptx, config, {
                  chartData,
                  tableRows,
                  insight,
                  currentPage: i + 1,
                  totalPages: slides.length,
                });
                console.log(`✅ ic_tt_growth created (native)`);
              }

              // ── ic_tt_organic_best_least / ic_tt_paid_best_least ───────
              else if (
                slide.type === 'ic_tt_organic_best_least' ||
                slide.type === 'ic_tt_paid_best_least'
              ) {
                const dataEl = exportDiv.querySelector(
                  '[data-ic-tt-highest]',
                ) as HTMLElement | null;
                let highest: any[] = [];
                let lowest: any[] = [];
                let bestAllTime: any = null;
                let insight = '';
                let mode = slide.type === 'ic_tt_paid_best_least' ? 'paid' : 'organic';
                if (dataEl) {
                  try {
                    highest = JSON.parse(dataEl.getAttribute('data-ic-tt-highest') || '[]');
                  } catch {}
                  try {
                    lowest = JSON.parse(dataEl.getAttribute('data-ic-tt-lowest') || '[]');
                  } catch {}
                  try {
                    bestAllTime = JSON.parse(dataEl.getAttribute('data-ic-tt-best') || 'null');
                  } catch {}
                  insight = dataEl.getAttribute('data-ic-tt-insight') || '';
                  mode = (dataEl.getAttribute('data-ic-tt-mode') as 'organic' | 'paid') || mode;
                }

                // Fallback: fetch from API if slide was never opened
                if (highest.length === 0 && lowest.length === 0 && config.clientName && config.period) {
                  try {
                    const apiRes = await fetch(
                      `/api/innercircle/tt-best-least?brand=${encodeURIComponent(config.clientName)}&period=${encodeURIComponent(config.period)}&mode=${mode}`,
                    );
                    const apiData = await apiRes.json();
                    highest = apiData.highest || [];
                    lowest = apiData.lowest || [];
                    bestAllTime = apiData.best_all_time || null;
                  } catch {}
                }

                // Resolve TikTok thumbnails + convert to base64
                [highest, lowest] = await Promise.all([
                  resolvePostImages(highest, 'tiktok'),
                  resolvePostImages(lowest, 'tiktok'),
                ]);
                if (bestAllTime?.url && !bestAllTime.image_url) {
                  const [resolved] = await resolvePostImages([bestAllTime], 'tiktok');
                  bestAllTime = resolved;
                } else if (bestAllTime?.image_url) {
                  const b64 = await imageUrlToBase64(bestAllTime.image_url);
                  bestAllTime = { ...bestAllTime, image_url: b64 };
                }

                const { createIcTtBestLeastNative } = await import('./pptxExporter');
                createIcTtBestLeastNative(pptx, config, {
                  highest,
                  lowest,
                  bestAllTime,
                  insight,
                  mode: mode as 'organic' | 'paid',
                  currentPage: i + 1,
                  totalPages: slides.length,
                });
                console.log(`✅ ${slide.type} created (native)`);
              }

              // ── ic_tt_content_pillar: native pillar rows + insight ─────
              else if (slide.type === 'ic_tt_content_pillar') {
                const dataEl = exportDiv.querySelector(
                  '[data-ic-tt-cp-pillars]',
                ) as HTMLElement | null;
                let pillars: any[] = [];
                if (dataEl) {
                  try {
                    pillars = JSON.parse(dataEl.getAttribute('data-ic-tt-cp-pillars') || '[]');
                  } catch {}
                }

                // Fallback: fetch from API if slide was never opened
                if (pillars.length === 0 && config.clientName && config.period) {
                  try {
                    const apiRes = await fetch(
                      `/api/innercircle/tt-content-pillar?brand=${encodeURIComponent(config.clientName)}&period=${encodeURIComponent(config.period)}`,
                    );
                    const apiData = await apiRes.json();
                    pillars = (apiData.pillars || []).map((p: any) => ({
                      pillar: p.pillar,
                      posts: p.posts,
                      insight: '',
                    }));
                  } catch {}
                }

                // Resolve TikTok thumbnails + convert to base64
                pillars = await Promise.all(
                  pillars.map(async (p: any) => ({
                    ...p,
                    posts: await resolvePostImages(p.posts || [], 'tiktok'),
                  })),
                );

                const { createIcTtContentPillarNative } = await import('./pptxExporter');
                createIcTtContentPillarNative(pptx, config, {
                  pillars,
                  currentPage: i + 1,
                  totalPages: slides.length,
                });
                console.log(`✅ ic_tt_content_pillar created (native)`);
              }

              // ── ic_tw_growth: native charts + table + insight ──────────
              else if (slide.type === 'ic_tw_growth') {
                const dataEl = exportDiv.querySelector('[data-ic-tw-chart]') as HTMLElement | null;
                let chartData: any[] = [];
                let tableRows: any[] = [];
                let insight = '';
                if (dataEl) {
                  try {
                    chartData = JSON.parse(dataEl.getAttribute('data-ic-tw-chart') || '[]');
                  } catch {}
                  try {
                    tableRows = JSON.parse(dataEl.getAttribute('data-ic-tw-table') || '[]');
                  } catch {}
                  insight = dataEl.getAttribute('data-ic-tw-insight') || '';
                }
                const { createIcTwGrowthNative } = await import('./pptxExporter');
                createIcTwGrowthNative(pptx, config, {
                  chartData,
                  tableRows,
                  insight,
                  currentPage: i + 1,
                  totalPages: slides.length,
                });
                console.log(`✅ ic_tw_growth created (native)`);
              }

              // ── ic_tw_best_least: native post cards + analysis ─────────
              else if (slide.type === 'ic_tw_best_least') {
                const dataEl = exportDiv.querySelector(
                  '[data-ic-tw-bl-highest]',
                ) as HTMLElement | null;
                let highest: any[] = [];
                let lowest: any[] = [];
                let insight = '';
                if (dataEl) {
                  try {
                    highest = JSON.parse(dataEl.getAttribute('data-ic-tw-bl-highest') || '[]');
                  } catch {}
                  try {
                    lowest = JSON.parse(dataEl.getAttribute('data-ic-tw-bl-lowest') || '[]');
                  } catch {}
                  insight = dataEl.getAttribute('data-ic-tw-bl-insight') || '';
                }

                // Fallback: fetch from API if slide was never opened
                if (highest.length === 0 && lowest.length === 0 && config.clientName && config.period) {
                  try {
                    const apiRes = await fetch(
                      `/api/innercircle/tw-best-least?brand=${encodeURIComponent(config.clientName)}&period=${encodeURIComponent(config.period)}`,
                    );
                    const apiData = await apiRes.json();
                    highest = apiData.highest || [];
                    lowest = apiData.lowest || [];
                  } catch {}
                }

                // Resolve Twitter thumbnails + convert to base64
                [highest, lowest] = await Promise.all([
                  resolvePostImages(highest, 'twitter'),
                  resolvePostImages(lowest, 'twitter'),
                ]);

                const { createIcTwBestLeastNative } = await import('./pptxExporter');
                createIcTwBestLeastNative(pptx, config, {
                  highest,
                  lowest,
                  insight,
                  currentPage: i + 1,
                  totalPages: slides.length,
                });
                console.log(`✅ ic_tw_best_least created (native)`);
              }

              // ── ic_tw_content: native post cards + analysis ────────────
              else if (slide.type === 'ic_tw_content') {
                const dataEl = exportDiv.querySelector(
                  '[data-ic-tw-ct-brand]',
                ) as HTMLElement | null;
                let brandOwned: any[] = [];
                let nonBrandOwned: any[] = [];
                let insight = '';
                if (dataEl) {
                  try {
                    brandOwned = JSON.parse(dataEl.getAttribute('data-ic-tw-ct-brand') || '[]');
                  } catch {}
                  try {
                    nonBrandOwned = JSON.parse(
                      dataEl.getAttribute('data-ic-tw-ct-nonbrand') || '[]',
                    );
                  } catch {}
                  insight = dataEl.getAttribute('data-ic-tw-ct-insight') || '';
                }

                // Fallback: fetch from API if slide was never opened
                if (brandOwned.length === 0 && nonBrandOwned.length === 0 && config.clientName && config.period) {
                  try {
                    const apiRes = await fetch(
                      `/api/innercircle/tw-content?brand=${encodeURIComponent(config.clientName)}&period=${encodeURIComponent(config.period)}`,
                    );
                    const apiData = await apiRes.json();
                    brandOwned = apiData.brandOwned || [];
                    nonBrandOwned = apiData.nonBrandOwned || [];
                  } catch {}
                }

                // Resolve Twitter thumbnails + convert to base64
                [brandOwned, nonBrandOwned] = await Promise.all([
                  resolvePostImages(brandOwned, 'twitter'),
                  resolvePostImages(nonBrandOwned, 'twitter'),
                ]);

                const { createIcTwContentNative } = await import('./pptxExporter');
                createIcTwContentNative(pptx, config, {
                  brandOwned,
                  nonBrandOwned,
                  insight,
                  currentPage: i + 1,
                  totalPages: slides.length,
                });
                console.log(`✅ ic_tw_content created (native)`);
              }

              // ── ic_fb_growth: native charts + table + insight ──────────
              else if (slide.type === 'ic_fb_growth') {
                const dataEl = exportDiv.querySelector('[data-ic-fb-chart]') as HTMLElement | null;
                let chartData: any[] = [];
                let tableRows: any[] = [];
                let insight = '';
                if (dataEl) {
                  try {
                    chartData = JSON.parse(dataEl.getAttribute('data-ic-fb-chart') || '[]');
                  } catch {}
                  try {
                    tableRows = JSON.parse(dataEl.getAttribute('data-ic-fb-table') || '[]');
                  } catch {}
                  insight = dataEl.getAttribute('data-ic-fb-insight') || '';
                }
                const { createIcFbGrowthNative } = await import('./pptxExporter');
                createIcFbGrowthNative(pptx, config, {
                  chartData,
                  tableRows,
                  insight,
                  currentPage: i + 1,
                  totalPages: slides.length,
                });
                console.log(`✅ ic_fb_growth created (native)`);
              }

              // ── ic_comp_overview: native 3-table layout ───────────────
              else if (slide.type === 'ic_comp_overview') {
                const dataEl = exportDiv.querySelector(
                  '[data-comp-overview]',
                ) as HTMLElement | null;
                let igTable: any[] = [];
                let ttTable: any[] = [];
                let twTable: any[] = [];
                let insight = '';
                if (dataEl) {
                  try {
                    const parsed = JSON.parse(dataEl.getAttribute('data-comp-overview') || '{}');
                    igTable = parsed.igTable || [];
                    ttTable = parsed.ttTable || [];
                    twTable = parsed.twTable || [];
                    insight = parsed.insight || '';
                  } catch {}
                }
                const { createIcCompOverviewNative } = await import('./pptxExporter');
                createIcCompOverviewNative(pptx, config, {
                  igTable,
                  ttTable,
                  twTable,
                  insight,
                  currentPage: i + 1,
                  totalPages: slides.length,
                });
                console.log(`✅ ic_comp_overview created (native)`);
              }

              // ── ic_comp_detail: native post-card + narrative layout ───
              else if (slide.type === 'ic_comp_detail') {
                const dataEl = exportDiv.querySelector('[data-comp-detail]') as HTMLElement | null;
                let competitor = slide.content?.competitor ?? '';
                let igPosts: any[] = [];
                let ttPosts: any[] = [];
                let twPosts: any[] = [];
                let narrative = '';
                if (dataEl) {
                  try {
                    const parsed = JSON.parse(dataEl.getAttribute('data-comp-detail') || '{}');
                    competitor = parsed.competitor || competitor;
                    igPosts = parsed.igPosts || [];
                    ttPosts = parsed.ttPosts || [];
                    twPosts = parsed.twPosts || [];
                    narrative = parsed.narrative || '';
                  } catch {}
                }
                // Fallback: fetch from API if slide was never opened
                if (!dataEl || (igPosts.length === 0 && ttPosts.length === 0 && twPosts.length === 0)) {
                  try {
                    const apiRes = await fetch(
                      `/api/innercircle/competitor-detail?brand=${encodeURIComponent(config.clientName || '')}&period=${encodeURIComponent(config.period || '')}&competitor=${encodeURIComponent(competitor)}`,
                    );
                    const apiData = await apiRes.json();
                    igPosts = apiData.igPosts || igPosts;
                    ttPosts = apiData.ttPosts || ttPosts;
                    twPosts = apiData.twPosts || twPosts;
                  } catch {}
                }
                // Normalize IG posts: permalink → url for resolvePostImages
                const igForResolve = igPosts.map((p: any) => ({ ...p, url: p.permalink || p.url }));
                const [igResolved, ttResolved, twResolved] = await Promise.all([
                  resolvePostImages(igForResolve, 'instagram'),
                  resolvePostImages(ttPosts, 'tiktok'),
                  resolvePostImages(twPosts, 'twitter'),
                ]);
                igPosts = igResolved.map((p: any) => ({ ...p, permalink: p.permalink || p.url }));
                ttPosts = ttResolved;
                twPosts = twResolved;
                const { createIcCompDetailNative } = await import('./pptxExporter');
                createIcCompDetailNative(pptx, config, {
                  competitor,
                  igPosts,
                  ttPosts,
                  twPosts,
                  narrative,
                  currentPage: i + 1,
                  totalPages: slides.length,
                });
                console.log(`✅ ic_comp_detail created (native)`);
              }

              // ── ic_comp_ig_focus: native IG-focus layout ──────────────
              else if (slide.type === 'ic_comp_ig_focus') {
                const dataEl = exportDiv.querySelector(
                  '[data-comp-ig-focus]',
                ) as HTMLElement | null;
                let competitor = slide.content?.competitor ?? '';
                let top3: any[] = [];
                let growthSeries: any[] = [];
                let mainBrandRow: any = null;
                let compRow: any = null;
                let narrative = '';
                if (dataEl) {
                  try {
                    const parsed = JSON.parse(dataEl.getAttribute('data-comp-ig-focus') || '{}');
                    competitor = parsed.competitor || competitor;
                    top3 = parsed.top3 || [];
                    growthSeries = parsed.growthSeries || [];
                    mainBrandRow = parsed.mainBrandRow || null;
                    compRow = parsed.compRow || null;
                    narrative = parsed.narrative || '';
                  } catch {}
                }
                // Fallback: fetch from API if slide was never opened
                if (!dataEl || top3.length === 0) {
                  try {
                    const apiRes = await fetch(
                      `/api/innercircle/competitor-ig-focus?brand=${encodeURIComponent(config.clientName || '')}&period=${encodeURIComponent(config.period || '')}&competitor=${encodeURIComponent(competitor)}`,
                    );
                    const apiData = await apiRes.json();
                    top3 = apiData.top3 || top3;
                    growthSeries = apiData.growthSeries || growthSeries;
                    mainBrandRow = apiData.mainBrandRow ?? mainBrandRow;
                    compRow = apiData.compRow ?? compRow;
                  } catch {}
                }
                // Resolve IG thumbnails (top3 uses permalink field)
                const top3ForResolve = top3.map((p: any) => ({ ...p, url: p.permalink || p.url }));
                const top3Resolved = await resolvePostImages(top3ForResolve, 'instagram');
                top3 = top3Resolved.map((p: any) => ({ ...p, permalink: p.permalink || p.url }));
                const { createIcCompIgFocusNative } = await import('./pptxExporter');
                createIcCompIgFocusNative(pptx, config, {
                  competitor,
                  top3,
                  growthSeries,
                  mainBrandRow,
                  compRow,
                  narrative,
                  currentPage: i + 1,
                  totalPages: slides.length,
                });
                console.log(`✅ ic_comp_ig_focus created (native)`);
              } else {
                // Fallback for any other ic_* type
                const imgData = await toPng(exportDiv, {
                  cacheBust: true,
                  width: 1920,
                  height: 1080,
                  pixelRatio: 2,
                });
                const pptxSlide = pptx.addSlide();
                pptxSlide.addImage({ data: imgData, x: 0, y: 0, w: '100%', h: '100%' });
                console.log(`✅ InnerCircle slide (screenshot fallback): ${slide.title}`);
              }
            } catch (error) {
              console.error(`InnerCircle slide export failed for "${slide.title}":`, error);
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
          } else {
            console.error(`Export div not found for InnerCircle slide: ${slide.title}`);
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
      const finalBlob = fontName.toLowerCase().includes('sora')
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
