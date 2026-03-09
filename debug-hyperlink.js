const fs = require('fs');
const JSZip = require('jszip');

JSZip.loadAsync(fs.readFileSync('test-best-least-output.pptx')).then((zip) => {
  const slideFiles = Object.keys(zip.files).filter((f) => f.match(/ppt\/slides\/slide\d+\.xml$/));
  console.log('Total slides:', slideFiles.length);

  const lastSlide = slideFiles[slideFiles.length - 1];
  const lastSlideRel = lastSlide
    .replace('slides/slide', 'slides/_rels/slide')
    .replace('.xml', '.xml.rels');

  zip.files[lastSlide].async('string').then((c) => {
    const hlinkCount = (c.match(/hlinkClick/g) || []).length;
    console.log('\nhlinkClick occurrences in last slide:', hlinkCount);
  });

  if (zip.files[lastSlideRel]) {
    zip.files[lastSlideRel].async('string').then((r) => {
      console.log('\nFull RELS of last slide:');
      console.log(r);
    });
  } else {
    console.log('No rels file for last slide:', lastSlideRel);
  }
});
