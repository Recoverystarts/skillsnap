import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;
function getGenAI() {
  if (!genAI) genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  return genAI;
}

const EMBEDDING_MODEL = 'text-embedding-004';
const EMBEDDING_DIMS = 768;
const MAX_BATCH_SIZE = 100;

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const model = getGenAI().getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

/**
 * Generate embeddings for multiple texts in batches
 */
export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const model = getGenAI().getGenerativeModel({ model: EMBEDDING_MODEL });
  const embeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
    const batch = texts.slice(i, i + MAX_BATCH_SIZE);
    console.log(`[Embedding] Processing batch ${Math.floor(i / MAX_BATCH_SIZE) + 1}/${Math.ceil(texts.length / MAX_BATCH_SIZE)} (${batch.length} chunks)`);

    const results = await Promise.all(
      batch.map(async (text) => {
        try {
          const result = await model.embedContent(text);
          return result.embedding.values;
        } catch (err) {
          console.error(`[Embedding] Failed for chunk: ${text.slice(0, 50)}...`, err);
          return new Array(EMBEDDING_DIMS).fill(0);
        }
      })
    );
    embeddings.push(...results);
  }

  return embeddings;
}

/**
 * Chunk text into segments for embedding
 * Strategy: split by paragraphs, merge small ones, split large ones
 */
export function chunkText(
  text: string,
  maxChunkSize: number = 1000,
  overlap: number = 100
): string[] {
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    const trimmed = para.trim();
    
    // If single paragraph exceeds max, split by sentences
    if (trimmed.length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      const sentences = trimmed.match(/[^.!?]+[.!?]+/g) || [trimmed];
      let sentenceChunk = '';
      for (const sentence of sentences) {
        if ((sentenceChunk + sentence).length > maxChunkSize && sentenceChunk) {
          chunks.push(sentenceChunk.trim());
          // Overlap: keep last bit
          const words = sentenceChunk.split(' ');
          sentenceChunk = words.slice(-Math.floor(overlap / 5)).join(' ') + ' ' + sentence;
        } else {
          sentenceChunk += (sentenceChunk ? ' ' : '') + sentence;
        }
      }
      if (sentenceChunk.trim()) {
        currentChunk = sentenceChunk;
      }
      continue;
    }

    if ((currentChunk + '\n\n' + trimmed).length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      // Overlap: keep end of previous chunk
      const words = currentChunk.split(' ');
      currentChunk = words.slice(-Math.floor(overlap / 5)).join(' ') + '\n\n' + trimmed;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + trimmed;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter(c => c.length > 20); // Skip tiny fragments
}

export { EMBEDDING_DIMS };
