const fs = require('fs');
const JSZip = require('jszip');

const fname = process.argv[2] || 'test-best-least-output.pptx';
console.log('Checking:', fname);

JSZip.loadAsync(fs.readFileSync(fname))
  .then((zip) => {
    const allFiles = Object.keys(zip.files);
    console.log('Files in PPTX:', allFiles.join('\n'));

    const slideRels = allFiles.filter((f) => f.includes('slides/_rels'));
    console.log('\nSlide rels files:', slideRels);

    const promises = slideRels.map(async (relFile) => {
      const content = await zip.files[relFile].async('string');
      const hasHyperlink = content.includes('hyperlink');
      const instagramUrls = content.match(/Target="[^"]*instagram[^"]*"/g) || [];
      console.log(
        `\n${relFile}: hyperlink=${hasHyperlink}, IG URLs:`,
        instagramUrls.length,
        instagramUrls,
      );
    });

    return Promise.all(promises);
  })
  .catch((e) => console.error('Error:', e.message));
