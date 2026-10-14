let tesseractWorker = null;

async function initTesseractWorker() {
  try {
    if (!tesseractWorker) {
      tesseractWorker = await Tesseract.createWorker('tha+eng');
      await tesseractWorker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK
      });
    }
  } catch (err) {
    console.warn("Tesseract worker init error:", err);
  }
}

function cleanOCRText(str) {
  return str
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[_|\\~`□■]+/g, '')
    .replace(/กล่อง/g, '')
    .trim();
}

function extractTextWithPrefixPattern(rawText, prefix) {
  if (!rawText || !prefix) return "";
  const cleaned = cleanOCRText(rawText);

  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`${escapedPrefix}.*`, 'i');
  const match = cleaned.match(regex);

  if (match && match.length > 0) {
    return match[0].trim();
  }

  return "";
}