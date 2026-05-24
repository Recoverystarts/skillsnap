import { GoogleGenerativeAI } from '@google/generative-ai';
import type { VisionResult, SOPChunk, GuidanceResponse, GuidanceStep, SOPReference } from '@skillsnap/shared';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Tier 3: Gemini Synthesis Leader
 * Cross-references vision results with SOP knowledge
 * Generates verified step-by-step guidance with safety overlay
 * 
 * CRITICAL SAFETY RULE: Never hallucinate safety information.
 * If no SOP match found, say "consult your supervisor."
 */
export async function generateGuidance(
  vision: VisionResult,
  sopMatches: SOPChunk[]
): Promise<GuidanceResponse> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const sopContext = sopMatches.length > 0
    ? sopMatches.map((chunk, i) => 
        `[SOP Source ${i + 1} - Page ${chunk.pageNumber}]\n${chunk.content}`
      ).join('\n\n')
    : 'NO SOP DOCUMENTS AVAILABLE - provide general industry guidance only and advise consulting supervisor.';

  const prompt = `You are a workplace guidance assistant. A worker has taken a photo of their work area.

SCENE ANALYSIS:
${vision.sceneDescription}

DETECTED OBJECTS:
${vision.objects.map(o => `- ${o.name} (${o.category}, confidence: ${Math.round(o.confidence * 100)}%)`).join('\n')}

COMPANY SOP REFERENCES:
${sopContext}

SAFETY RULES:
- NEVER make up safety procedures. If unsure, say "Consult your supervisor for specific safety requirements."
- Always list relevant PPE requirements if identifiable from context
- Flag any visible hazards from the scene analysis
- If SOP documents are available, cite them. If not, clearly state guidance is general.

Generate a step-by-step guide in JSON format ONLY (no markdown, no backticks):
{
  "steps": [
    {"stepNumber": 1, "instruction": "Clear main instruction", "detail": "Optional detail", "safetyNote": "Optional safety note", "sopSource": "Optional SOP reference"}
  ],
  "safetyWarnings": ["Any critical safety warnings"],
  "sopReferences": [
    {"documentTitle": "title", "pageNumber": 1, "relevanceScore": 0.9, "excerpt": "relevant excerpt"}
  ],
  "confidence": 0.0-1.0
}

Keep steps practical and specific to what the worker is looking at. Max 8 steps.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    return {
      scanId: `scan_${Date.now()}`,
      steps: (parsed.steps || []).map((s: any) => ({
        stepNumber: s.stepNumber,
        instruction: s.instruction,
        detail: s.detail || undefined,
        safetyNote: s.safetyNote || undefined,
        sopSource: s.sopSource || undefined,
      })) as GuidanceStep[],
      safetyWarnings: parsed.safetyWarnings || [],
      sopReferences: (parsed.sopReferences || []).map((r: any) => ({
        documentTitle: r.documentTitle || '',
        pageNumber: r.pageNumber || 0,
        relevanceScore: r.relevanceScore || 0,
        excerpt: r.excerpt || '',
      })) as SOPReference[],
      confidence: parsed.confidence || 0,
      processingTimeMs: 0, // Set by caller
    };
  } catch (error) {
    console.error('[Gemini] Synthesis failed:', error);
    return {
      scanId: `scan_${Date.now()}`,
      steps: [{
        stepNumber: 1,
        instruction: 'Unable to generate guidance. Please consult your supervisor.',
        safetyNote: 'AI analysis encountered an error. Follow standard company procedures.',
      }],
      safetyWarnings: ['AI guidance unavailable - follow standard procedures and consult your supervisor'],
      sopReferences: [],
      confidence: 0,
      processingTimeMs: 0,
    };
  }
}
