interface ImagePage {
  jpeg: Uint8Array;
  width: number;
  height: number;
}

export function encodeImagePdf(pages: ImagePage[]): Blob {
  if (pages.length === 0) throw new Error("A PDF needs at least one page.");
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [0];
  let length = 0;
  const append = (chunk: string | Uint8Array) => {
    const bytes = typeof chunk === "string" ? encoder.encode(chunk) : chunk;
    chunks.push(bytes);
    length += bytes.length;
  };
  const object = (id: number, body: string | Uint8Array) => {
    offsets[id] = length;
    append(`${id} 0 obj\n`);
    append(body);
    append("\nendobj\n");
  };

  append("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  const pageIds = pages.map((_, index) => 3 + index * 3);
  object(1, "<< /Type /Catalog /Pages 2 0 R >>");
  object(2, `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`);
  pages.forEach((page, index) => {
    const pageId = pageIds[index];
    const imageId = pageId + 1;
    const streamId = pageId + 2;
    object(pageId, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${streamId} 0 R >>`);
    offsets[imageId] = length;
    append(`${imageId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpeg.length} >>\nstream\n`);
    append(page.jpeg);
    append("\nendstream\nendobj\n");
    const instructions = `q\n842 0 0 595 0 0 cm\n/Im0 Do\nQ\n`;
    object(streamId, `<< /Length ${encoder.encode(instructions).length} >>\nstream\n${instructions}endstream`);
  });
  const xref = length;
  append(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);
  for (let id = 1; id < offsets.length; id++) append(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  append(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  const output = new Uint8Array(length);
  let position = 0;
  chunks.forEach((chunk) => { output.set(chunk, position); position += chunk.length; });
  return new Blob([output.buffer], { type: "application/pdf" });
}
