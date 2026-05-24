import type { SOPChunk } from '@skillsnap/shared';

export async function searchSOPs(companyId: string, query: string, topK: number = 5): Promise<SOPChunk[]> {
  console.log(`[RAG] Searching SOPs for ${companyId}: "${query}" (top ${topK})`);
  // TODO: pgvector search
  return [];
}
