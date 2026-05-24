import type { VisionResult, SOPChunk, GuidanceResponse } from '@skillsnap/shared';

export async function generateGuidance(
  vision: VisionResult,
  sopMatches: SOPChunk[]
): Promise<GuidanceResponse> {
  console.log(`[Gemini] Generating guidance from ${sopMatches.length} SOP matches`);
  // TODO: Gemini API synthesis
  return {
    scanId: 'scaffold',
    steps: [{ stepNumber: 1, instruction: 'Gemini synthesis not yet implemented' }],
    safetyWarnings: [],
    sopReferences: [],
    confidence: 0,
    processingTimeMs: 0,
  };
}
