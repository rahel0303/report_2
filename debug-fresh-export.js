/**
 * Simulate createIcIgBestLeastNative with real URLs to verify hyperlinks work
 */
const PptxGenJS = require('pptxgenjs');
const fs = require('fs');
const JSZip = require('jszip');

const pptx = new PptxGenJS();
const slide = pptx.addSlide();

const font = 'Arial';
const cardW = 1.7;
const cardGap = 0.04;
const cardsY = 1.27;
const cardsH = 2.3;
const imgH = cardsH * 0.52;
const metricsH = cardsH - imgH;
const cardCount = 5;

// Fake posts with URLs
const posts = [
  {
    follows: 0,
    reach: 184700,
    engagement: 4700,
    engagement_rate: 0.03,
    url: 'https://www.instagram.com/p/ABC123/',
  },
  {
    follows: 0,
    reach: 59800,
    engagement: 2900,
    engagement_rate: 0.05,
    url: 'https://www.instagram.com/p/DEF456/',
  },
  { follows: 0, reach: 342600, engagement: 2600, engagement_rate: 0.01, url: null },
  {
    follows: 54,
    reach: 47100,
    engagement: 2600,
    engagement_rate: 0.06,
    url: 'https://www.instagram.com/p/GHI789/',
  },
  {
    follows: 0,
    reach: 55600,
    engagement: 2500,
    engagement_rate: 0.04,
    url: 'https://www.instagram.com/p/JKL012/',
  },
];

const cx = 0.3;
const metrics = [
  { label: 'Follow', fn: (p) => p.follows.toString() },
  { label: 'Reach', fn: (p) => (p.reach / 1000).toFixed(1) + 'K' },
  { label: 'Engage', fn: (p) => (p.engagement / 1000).toFixed(1) + 'K' },
  { label: 'ER', fn: (p) => (p.engagement_rate * 100).toFixed(2) + '%' },
];
const rowH_m = metricsH / (metrics.length + 1);

posts.slice(0, cardCount).forEach((post, pi) => {
  const cardX = cx + pi * (cardW + cardGap);

  // Card bg
  slide.addShape(pptx.ShapeType.roundRect, {
    x: cardX,
    y: cardsY,
    w: cardW,
    h: cardsH,
    fill: { color: 'FFFFFF' },
    line: { color: 'E2E8F0', width: 0.5 },
    rectRadius: 0.06,
  });

  // IMAGE with hyperlink
  const imgOpts = {
    x: cardX,
    y: cardsY,
    w: cardW,
    h: imgH,
    fill: { color: 'E2E8F0' },
    line: { type: 'none' },
  };
  if (post.url) imgOpts.hyperlink = { url: post.url };
  slide.addShape(pptx.ShapeType.rect, imgOpts);

  // Rank badge
  slide.addText(`#${pi + 1}`, {
    x: cardX + 0.04,
    y: cardsY + 0.04,
    w: 0.34,
    h: 0.17,
    fontSize: 6,
    bold: true,
    color: 'FFFFFF',
    fontFace: font,
    align: 'center',
    valign: 'middle',
    wrap: false,
    fill: { color: '16A34A' },
    shape: pptx.ShapeType.roundRect,
  });

  // Metrics
  metrics.forEach(({ label, fn }, mi) => {
    const my = cardsY + imgH + mi * rowH_m + 0.02;
    slide.addText(label, {
      x: cardX + 0.02,
      y: my,
      w: cardW * 0.5,
      h: rowH_m,
      fontSize: 4.5,
      color: '94a3b8',
      fontFace: font,
      valign: 'middle',
      wrap: false,
    });
    slide.addText(fn(post), {
      x: cardX + cardW * 0.5,
      y: my,
      w: cardW * 0.48,
      h: rowH_m,
      fontSize: 5,
      bold: true,
      color: label === 'ER' ? '16A34A' : '1e293b',
      fontFace: font,
      align: 'right',
      valign: 'middle',
      wrap: false,
    });
  });

  // Link row
  const linkY = cardsY + imgH + metrics.length * rowH_m + 0.02;
  slide.addText('Link', {
    x: cardX + 0.02,
    y: linkY,
    w: cardW * 0.4,
    h: rowH_m,
    fontSize: 4.5,
    color: '94a3b8',
    fontFace: font,
    valign: 'middle',
    wrap: false,
  });

  if (post.url) {
    slide.addText(
      [
        {
          text: 'View',
          options: {
            color: '3B82F6',
            bold: true,
            fontSize: 5,
            fontFace: font,
            underline: { type: 'sng', color: '3B82F6' },
            hyperlink: { url: post.url },
          },
        },
      ],
      {
        x: cardX + cardW * 0.4,
        y: linkY,
        w: cardW * 0.58,
        h: rowH_m,
        align: 'right',
        valign: 'middle',
        wrap: false,
      },
    );
  } else {
    slide.addText('—', {
      x: cardX + cardW * 0.4,
      y: linkY,
      w: cardW * 0.58,
      h: rowH_m,
      fontSize: 5,
      color: '94a3b8',
      fontFace: font,
      align: 'right',
      valign: 'middle',
      wrap: false,
    });
  }
});

const outFile = 'debug-fresh-export.pptx';
pptx.writeFile({ fileName: outFile }).then(async () => {
  console.log('Written:', outFile);
  const zip = await JSZip.loadAsync(fs.readFileSync(outFile));
  const rel = await zip.files['ppt/slides/_rels/slide1.xml.rels'].async('string');
  console.log('\n=== RELS ===');
  console.log(rel);

  const slideXml = await zip.files['ppt/slides/slide1.xml'].async('string');
  const hlinkCount = (slideXml.match(/hlinkClick/g) || []).length;
  console.log('\n=== hlinkClick count in slide XML:', hlinkCount, '===');
  // Posts with url: 4 shape hyperlinks + 4 text "View" hyperlinks = 8
  console.log('Expected: 8 (4 shape + 4 text), post #3 has no URL');
});
