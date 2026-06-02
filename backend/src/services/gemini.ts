import { GoogleGenerativeAI } from '@google/generative-ai';
import type { VisionResult, SOPChunk, GuidanceResponse, GuidanceStep, SOPReference } from '@skillsnap/shared';

let genAI: GoogleGenerativeAI | null = null;
function getGenAI() {
  if (!genAI) genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  return genAI;
}

export async function generateGuidance(
  vision: VisionResult,
  sopMatches: SOPChunk[]
): Promise<GuidanceResponse> {
  const model = getGenAI().getGenerativeModel({ model: 'gemini-3.5-flash' });

  const sopContext = sopMatches.length > 0
    ? sopMatches.map((chunk, i) =>
        `[SOP Source ${i + 1} - Page ${chunk.pageNumber}]\n${chunk.content}`
      ).join('\n\n')
    : 'NO SOP DOCUMENTS AVAILABLE - provide general industry guidance only and advise consulting supervisor.';

  const prompt = `You are an experienced construction foreman helping a worker plan and execute the job in front of them. Your job is to give them a clear, step-by-step plan that gets the work done right — with safety built into each step, not bolted on at the end.

SCENE ANALYSIS:
${vision.sceneDescription}

DETECTED OBJECTS:
${vision.objects.map(o => `- ${o.name} (${o.category}, confidence: ${Math.round(o.confidence * 100)}%)`).join('\n')}

COMPANY SOP REFERENCES:
${sopContext}

GROUND RULES:
- NEVER invent safety procedures, dimensions, torque specs, or regulatory requirements. If you don't have it from the SOP or scene, say "Confirm with your supervisor."
- If SOP documents are available, pull specs and procedures from them directly and cite the source. If not, say guidance is general and recommend consulting the supervisor for specifics.
- Tone: knowledgeable coworker, not a compliance officer. Direct, practical, respectful of the worker's experience.
- Safety belongs inside each step — woven into the "how to do it," not in a separate warning section.

Generate a job plan in JSON format ONLY (no markdown, no backticks):
{
  "steps": [
    {
      "stepNumber": 1,
      "instruction": "What to do — the actual work task for this step",
      "detail": "How to do it — technique, measurements, specs, and safety considerations integrated naturally (e.g., 'Set trench box before stepping in; verify shoring extends 300mm above grade')",
      "safetyNote": "Only include if there is a step-specific critical safety point that must be called out separately — keep it brief and action-oriented, not generic",
      "sopSource": "SOP title and page if this step draws from company documents"
    }
  ],
  "completionCriteria": "What the finished work should look like — describe the end state in concrete terms so the worker has a mental picture of success before they start",
  "sopReferences": [
    {"documentTitle": "title", "pageNumber": 1, "relevanceScore": 0.9, "excerpt": "relevant excerpt"}
  ],
  "safetyWarnings": [],
  "confidence": 0.0-1.0
}

Rules for the plan:
- Steps follow the natural work sequence — setup, then execution, then verification
- Each step should be something the worker can act on immediately
- Include measurements and specs where visible or available from SOPs
- Max 8 steps — combine minor sub-tasks, keep major phases separate
- completionCriteria must be specific and visual: what does a passing inspection look like?
- safetyWarnings array: leave empty unless there is an immediate life-safety hazard visible in the scene that must be addressed BEFORE work begins`;

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
      completionCriteria: parsed.completionCriteria || undefined,
      safetyWarnings: parsed.safetyWarnings || [],
      sopReferences: (parsed.sopReferences || []).map((r: any) => ({
        documentTitle: r.documentTitle || '',
        pageNumber: r.pageNumber || 0,
        relevanceScore: r.relevanceScore || 0,
        excerpt: r.excerpt || '',
      })) as SOPReference[],
      confidence: parsed.confidence || 0,
      processingTimeMs: 0,
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
