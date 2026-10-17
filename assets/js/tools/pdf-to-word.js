
let wordBlob = null;
let wordJob = 0;
let outputFileName = 'converted-file.docx';

document.getElementById('pdfInput').addEventListener('change', function () {
  wordJob++;
  wordBlob = null;
  document.getElementById('output').value = '';
  const file = this.files[0];
  document.getElementById('fileName').textContent = file ? file.name : 'No file selected';
  document.getElementById('downloadSuccess').style.display = 'none';
  outputFileName = file
    ? (file.name.replace(/\.pdf$/i, '') || 'converted-file') + '.docx'
    : 'converted-file.docx';
});

async function convertPDF() {
  const file = document.getElementById('pdfInput').files[0];
  const output = document.getElementById('output');
  const job = ++wordJob;
  wordBlob = null;
  document.getElementById('downloadSuccess').style.display = 'none';
  if (!file) {
    output.value = 'Please select a PDF file.';
    return;
  }
  if (file.size > 50 * 1024 * 1024) {
    output.value = 'Maximum PDF size is 50 MB.';
    return;
  }
  let parsedPDF;
  try {
    if (typeof pdfjsLib === 'undefined' || typeof docx === 'undefined') {
      throw new Error('Required PDF/Word library did not load. Reload and try again.');
    }
    output.value = 'Extracting embedded text...';
    const pdf = parsedPDF = await pdfjsLib.getDocument(FTOSafety.pdfOptions({
      isEvalSupported: false,
      data: await file.arrayBuffer()
    })).promise;
    const paragraphs = [];
    const pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      let line = '';
      const lines = [];
      for (const item of content.items) {
        if (typeof item.str !== 'string') continue;
        line += item.str + ' ';
        if (item.hasEOL) {
          lines.push(line.trim());
          line = '';
        }
      }
      if (line.trim()) lines.push(line.trim());
      pages.push(lines.join('\n'));
      lines.forEach((text, index) => paragraphs.push(new docx.Paragraph({
        text,
        pageBreakBefore: i > 1 && index === 0
      })));
    }
    if (job !== wordJob) return;
    if (!pages.some(text => text.trim())) {
      output.value = 'No embedded text found. Scanned PDFs need OCR first.';
      return;
    }
    const documentFile = new docx.Document({sections: [{children: paragraphs}]});
    const blob = await docx.Packer.toBlob(documentFile);
    if (job !== wordJob) return;
    wordBlob = blob;
    output.value = pages.join('\n\n');
  } catch (error) {
    if (job === wordJob) {
      wordBlob = null;
      output.value = 'Could not create Word document: ' + error.message;
    }
  }finally{if(parsedPDF)await parsedPDF.destroy();}
}

function downloadWord() {
  if (!wordBlob) {
    document.getElementById('output').value = 'Convert the current PDF successfully first.';
    return;
  }
  const url = URL.createObjectURL(wordBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = outputFileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  document.getElementById('downloadSuccess').style.display = 'block';
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
