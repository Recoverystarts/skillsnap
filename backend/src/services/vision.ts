import { GoogleGenerativeAI } from '@google/generative-ai';
import type { VisionResult, DetectedObject } from '@skillsnap/shared';

let genAI: GoogleGenerativeAI | null = null;
function getGenAI() {
  if (!genAI) genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  return genAI;
}

export async function analyzeImage(imageBuffer: Buffer): Promise<VisionResult> {
  const model = getGenAI().getGenerativeModel({ model: 'gemini-2.0-flash' });

  const imagePart = {
    inlineData: {
      data: imageBuffer.toString('base64'),
      mimeType: 'image/jpeg',
    },
  };

  const prompt = `You are a workplace scene analyzer for a construction/industrial safety system.
Analyze this image and respond in JSON format ONLY (no markdown, no backticks):
{
  "objects": [
    {"name": "object name", "confidence": 0.0-1.0, "category": "tool|material|equipment|environment|safety|other"}
  ],
  "sceneDescription": "One paragraph describing the work scene, what tools/materials are visible, what task appears to be happening, and any safety considerations",
  "confidence": 0.0-1.0
}

Categories:
- tool: hand tools, power tools, measuring devices
- material: pipes, fittings, concrete, lumber, wire
- equipment: heavy machinery, vehicles, scaffolding
- environment: trenches, buildings, roads, terrain
- safety: PPE, barriers, signage, hazards
- other: anything else notable

Be specific about object names. If you cannot identify the scene, set confidence to 0.1.`;

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
