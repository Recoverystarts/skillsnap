import { query, queryOne } from '../db/pool';
import { chunkText, generateEmbeddings } from './embedding';

interface SOPUploadResult {
  documentId: string;
  title: string;
  chunkCount: number;
  embeddingsGenerated: boolean;
}

/**
 * Process an uploaded SOP document:
 * 1. Store document metadata
 * 2. Extract text content
 * 3. Chunk the text
 * 4. Generate embeddings via Gemini
 * 5. Store chunks + embeddings in pgvector
 */
export async function processSOPUpload(
  companyId: string,
  fileName: string,
  fileBuffer: Buffer,
  mimeType: string,
  uploadedBy?: string,
  storageUrl?: string
): Promise<SOPUploadResult> {
  console.log(`[SOP] Processing: ${fileName} (${mimeType}, ${fileBuffer.length} bytes)`);

  // 1. Extract text based on file type
  const text = await extractText(fileBuffer, mimeType);
  if (!text || text.trim().length < 10) {
    throw new Error('Could not extract meaningful text from document');
  }
  console.log(`[SOP] Extracted ${text.length} chars of text`);

  // 2. Create document record
  const [doc] = await query<{ id: string }>(
    `INSERT INTO sop_documents (company_id, title, file_name, storage_url, mime_type, file_size_bytes, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [companyId, fileName.replace(/\.[^/.]+$/, ''), fileName, storageUrl || '', mimeType, fileBuffer.length, uploadedBy || null]
  );

  // 3. Chunk the text
  const chunks = chunkText(text, 800, 100);
  console.log(`[SOP] Created ${chunks.length} chunks`);

  // 4. Generate embeddings
  const embeddings = await generateEmbeddings(chunks);
  console.log(`[SOP] Generated ${embeddings.length} embeddings`);

  // 5. Store chunks with embeddings
  for (let i = 0; i < chunks.length; i++) {
    const embeddingStr = `[${embeddings[i].join(',')}]`;
    await query(
      `INSERT INTO sop_chunks (document_id, company_id, content, chunk_index, token_count, embedding)
       VALUES ($1, $2, $3, $4, $5, $6::vector)`,
      [doc.id, companyId, chunks[i], i, Math.ceil(chunks[i].length / 4), embeddingStr]
    );
  }

  // 6. Update document metadata
  await query(
    `UPDATE sop_documents SET embeddings_generated = true, chunk_count = $1, page_count = $2, updated_at = NOW()
     WHERE id = $3`,
    [chunks.length, estimatePageCount(text), doc.id]
  );

  console.log(`[SOP] Complete: ${doc.id} — ${chunks.length} chunks embedded`);

  return {
    documentId: doc.id,
    title: fileName.replace(/\.[^/.]+$/, ''),
    chunkCount: chunks.length,
    embeddingsGenerated: true,
  };
}

/**
 * Extract text from various document formats
 */
async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  // For now: handle plain text and basic formats
  // TODO: Add pdf-parse for PDFs, mammoth for DOCX
  switch (mimeType) {
    case 'text/plain':
    case 'text/markdown':
    case 'text/csv':
      return buffer.toString('utf-8');

    case 'application/pdf': {
      // Dynamic import for pdf-parse (optional dependency)
      try {
        const pdfParse = require('pdf-parse');
        const data = await pdfParse(buffer);
        return data.text;
      } catch {
        console.warn('[SOP] pdf-parse not available, falling back to Gemini extraction');
        return await extractWithGemini(buffer, mimeType);
      }
    }

    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
      try {
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
      } catch {
        console.warn('[SOP] mammoth not available, falling back to Gemini extraction');
        return await extractWithGemini(buffer, mimeType);
      }
    }

    default:
      // Use Gemini multimodal as universal fallback
      return await extractWithGemini(buffer, mimeType);
  }
}

/**
 * Use Gemini to extract text from any document format
 */
async function extractWithGemini(buffer: Buffer, mimeType: string): Promise<string> {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

  const result = await model.generateContent([
    'Extract ALL text content from this document. Return only the text, no formatting or commentary. Preserve section headers and structure.',
    { inlineData: { data: buffer.toString('base64'), mimeType } },
  ]);

  return result.response.text();
}

/**
 * List SOP documents for a company
 */
export async function listSOPDocuments(companyId: string) {
  return query(
    `SELECT id, title, file_name, mime_type, file_size_bytes, page_count, 
            chunk_count, embeddings_generated, created_at, updated_at
     FROM sop_documents 
     WHERE company_id = $1 
     ORDER BY created_at DESC`,
    [companyId]
  );
}

/**
 * Delete an SOP document and its chunks
 */
export async function deleteSOPDocument(documentId: string, companyId: string): Promise<boolean> {
  const result = await query(
    'DELETE FROM sop_documents WHERE id = $1 AND company_id = $2 RETURNING id',
    [documentId, companyId]
  );
  return result.length > 0;
}

/**
 * Get SOP document stats for a company
 */
export async function getSOPStats(companyId: string) {
  return queryOne<{ doc_count: number; chunk_count: number; total_size: number }>(
    `SELECT COUNT(*) as doc_count, 
            COALESCE(SUM(chunk_count), 0) as chunk_count,
            COALESCE(SUM(file_size_bytes), 0) as total_size
     FROM sop_documents WHERE company_id = $1`,
    [companyId]
  );
}

function estimatePageCount(text: string): number {
  // ~3000 chars per page is a rough estimate
  return Math.max(1, Math.ceil(text.length / 3000));
}
