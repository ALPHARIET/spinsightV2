export const MAX_CHARS = 24000;
export const ACCEPT = '.pdf,.docx,.txt,.md';

async function fromPdf(file) {
  const pdfjs = await import('pdfjs-dist');
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const parts = [];
  let total = 0;
  for (let i = 1; i <= doc.numPages && total < MAX_CHARS; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((it) => it.str).join(' ').replace(/\s+/g, ' ').trim();
    if (text) {
      parts.push(`[hlm. ${i}] ${text}`);
      total += text.length;
    }
  }
  return { text: parts.join('\n\n'), pages: doc.numPages };
}

async function fromDocx(file) {
  const mammoth = await import('mammoth/mammoth.browser.js');
  const lib = mammoth.default || mammoth;
  const { value } = await lib.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return { text: value.replace(/\n{3,}/g, '\n\n').trim(), pages: null };
}

export async function extractText(file) {
  const name = file.name.toLowerCase();
  let out;
  if (name.endsWith('.pdf')) out = await fromPdf(file);
  else if (name.endsWith('.docx')) out = await fromDocx(file);
  else if (name.endsWith('.txt') || name.endsWith('.md')) out = { text: (await file.text()).trim(), pages: null };
  else throw new Error('Format belum didukung. Gunakan PDF, DOCX, atau TXT.');

  if (!out.text || out.text.length < 50) {
    throw new Error('Teks tidak terbaca. Jika PDF-nya hasil scan (gambar), salin teksnya secara manual ke kolom di bawah.');
  }
  return { ...out, truncated: out.text.length > MAX_CHARS, text: out.text.slice(0, MAX_CHARS) };
}

export const formatSize = (bytes) =>
  bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
