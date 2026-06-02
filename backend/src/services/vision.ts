import { GoogleGenerativeAI } from '@google/generative-ai';
import type { VisionResult, DetectedObject } from '@skillsnap/shared';

let genAI: GoogleGenerativeAI | null = null;
function getGenAI() {
  if (!genAI) genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  return genAI;
}

export async function analyzeImage(imageBuffer: Buffer): Promise<VisionResult> {
  const model = getGenAI().getGenerativeModel({ model: 'gemini-3.5-flash' });

  const imagePart = {
    inlineData: {
      data: imageBuffer.toString('base64'),
      mimeType: 'image/jpeg',
    },
  };

  const prompt = `You are a construction site analyst helping experienced workers plan their next steps.
Analyze this image and respond in JSON format ONLY (no markdown, no backticks):
{
  "objects": [
    {"name": "object name", "confidence": 0.0-1.0, "category": "tool|material|equipment|environment|safety|other"}
  ],
  "sceneDescription": "One paragraph describing the work scene from a job-planning perspective: what task appears to be in progress or about to start, what stage of the work this represents, what materials and equipment are on hand and ready to use, any visible dimensions or site conditions that would affect planning (trench depth, pipe size, slope, soil type, clearances), and what constraints or hazards are present that the job plan must account for. Focus on what a foreman would need to know to direct the next steps.",
  "confidence": 0.0-1.0
}

Categories:
- tool: hand tools, power tools, measuring devices
- material: pipes, fittings, concrete, lumber, wire, bedding material
- equipment: heavy machinery, vehicles, scaffolding, shoring, laser levels
- environment: trenches, buildings, roads, terrain, soil conditions, grades
- safety: PPE, barriers, signage, shoring, existing hazards that affect work sequencing
- other: anything else notable

Be specific. Estimate dimensions where visible. Note what's present AND what appears to be missing but needed. If you cannot identify the scene, set confidence to 0.1.`;

  try {
    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text().trim();
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(jsonStr);
    return {
      objects: (parsed.objects || []).map((obj: any) => ({
        name: obj.name || 'unknown',
        confidence: obj.confidence || 0,
        category: obj.category || 'other',
      })) as DetectedObject[],
      sceneDescription: parsed.sceneDescription || 'Unable to analyze scene',
      confidence: parsed.confidence || 0,
    };
  } catch (error) {
    console.error('[Vision] Analysis failed:', error);
    return {
      objects: [],
      sceneDescription: 'Vision analysis failed - please try again with a clearer image',
      confidence: 0,
    };
  }
}
