/**
 * @fileOverview Server-only helper to extract plain text from an uploaded PDF buffer.
 */
import 'server-only';

export async function extractPdfText(buffer: Buffer): Promise<string> {
  // Lazy import: pdf-parse touches the filesystem at module load in some environments,
  // so we only load it when actually needed (inside a server route handler).
  const pdfParse = (await import('pdf-parse')).default;
  const data = await pdfParse(buffer);
  return (data.text || '').trim();
}
