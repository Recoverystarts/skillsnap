import { query } from '../db/pool';
import { generateEmbedding } from './embedding';
import type { SOPChunk } from '@skillsnap/shared';

/**
 * Search SOPs using vector similarity (pgvector cosine distance)
 * This is Tier 2 of the three-tier pipeline:
 * Vision → Knowledge Gathering (this) → Synthesis
 *
 * v0.5.0: each returned chunk also carries `relevanceScore` (1 - cosine distance)
 * and `documentTitle` for agent-execution logging. These are extras on top of the
 * `SOPChunk` shape — consumers that need them should cast.
 */
export async function searchSOPs(
  companyId: string,
  queryText: string,
  topK: number = 5
): Promise<SOPChunk[]> {
  console.log(`[RAG] Searching SOPs for company ${companyId}: "${queryText.slice(0, 80)}..." (top ${topK})`);

  // If no database is configured, return empty (graceful degradation)
  if (!process.env.DATABASE_URL && !process.env.CLOUD_SQL_CONNECTION_NAME) {
    console.log('[RAG] No database configured — returning empty results');
    return [];
  }

  try {
    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(queryText);
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    // Vector similarity search using pgvector cosine distance
    // Lower distance = more similar (cosine distance, not similarity)
    const results = await query<{
      id: string;
      document_id: string;
      content: string;
      page_number: number;
      chunk_index: number;
      distance: number;
      doc_title: string;
    }>(
      `SELECT
        c.id, c.document_id, c.content, c.page_number, c.chunk_index,
        c.embedding <=> $1::vector AS distance,
        d.title AS doc_title
       FROM sop_chunks c
       JOIN sop_documents d ON c.document_id = d.id
       WHERE c.company_id = $2
         AND c.embedding IS NOT NULL
       ORDER BY c.embedding <=> $1::vector
       LIMIT $3`,
      [embeddingStr, companyId, topK]
    );

    console.log(`[RAG] Found ${results.length} matches (best distance: ${results[0]?.distance?.toFixed(3) || 'N/A'})`);

    // Filter by relevance threshold — cosine distance > 0.5 is likely noise
    const relevant = results.filter(r => r.distance < 0.5);

    if (relevant.length < results.length) {
      console.log(`[RAG] Filtered to ${relevant.length} relevant matches (threshold: 0.5)`);
    }

    return relevant.map(r => ({
      id: r.id,
      documentId: r.document_id,
      content: r.content,
      pageNumber: r.page_number || 0,
      chunkIndex: r.chunk_index,
      // Extra fields for agent-execution logging (not in SOPChunk type).
      relevanceScore: Math.max(0, 1 - (r.distance ?? 1)),
      documentTitle: r.doc_title || 'Unknown',
    })) as SOPChunk[];
  } catch (error) {
    console.error('[RAG] Search failed:', error);
    // Graceful degradation: return empty rather than crash the pipeline
    return [];
  }
}

/**
 * Hybrid search: combine vector similarity with keyword matching
 * Better for specific SOP terminology that embeddings might miss
 */
export async function hybridSearchSOPs(
  companyId: string,
  queryText: string,
  topK: number = 5
): Promise<SOPChunk[]> {
  if (!process.env.DATABASE_URL && !process.env.CLOUD_SQL_CONNECTION_NAME) {
    return [];
  }

  try {
    const queryEmbedding = await generateEmbedding(queryText);
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    // Extract key terms for keyword boost
    const keywords = queryText
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3)
      .slice(0, 5);

    const keywordPattern = keywords.join('|');

    const results = await query<{
      id: string;
      document_id: string;
      content: string;
      page_number: number;
      chunk_index: number;
      vector_score: number;
      keyword_score: number;
      combined_score: number;
    }>(
      `SELECT
        c.id, c.document_id, c.content, c.page_number, c.chunk_index,
        (1 - (c.embedding <=> $1::vector)) AS vector_score,
        CASE WHEN c.content ~* $4 THEN 0.2 ELSE 0 END AS keyword_score,
        (1 - (c.embedding <=> $1::vector)) + CASE WHEN c.content ~* $4 THEN 0.2 ELSE 0 END AS combined_score
       FROM sop_chunks c
       WHERE c.company_id = $2
         AND c.embedding IS NOT NULL
       ORDER BY combined_score DESC
       LIMIT $3`,
      [embeddingStr, companyId, topK, keywordPattern || '.*']
    );

    return results
      .filter(r => r.combined_score > 0.5)
      .map(r => ({
        id: r.id,
        documentId: r.document_id,
        content: r.content,
        pageNumber: r.page_number || 0,
        chunkIndex: r.chunk_index,
      }));
  } catch (error) {
    console.error('[RAG] Hybrid search failed:', error);
    return [];
  }
}
