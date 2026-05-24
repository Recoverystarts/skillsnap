import { GoogleGenerativeAI } from '@google/generative-ai';
import type { VisionResult, DetectedObject } from '@skillsnap/shared';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Tier 1: Vision Analysis
 * Uses Gemini's multimodal capabilities for both object detection
 * and scene understanding in a single call.
 * 
 * For production: add Google Cloud Vision API as a dedicated
 * object detector, use Gemini for scene understanding only.
 */
export async function analyzeImage(imageBuffer: Buffer): Promise<VisionResult> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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
- material: pipes, fittings, concrete, lumber, wire, etc.
- equipment: heavy machinery, vehicles, scaffolding
- environment: trenches, buildings, roads, terrain features
- safety: PPE, barriers, signage, hazards
- other: anything else notable

Be specific about object names (e.g., "pipe wrench" not just "tool").
If you cannot identify the scene, set confidence to 0.1 and describe what you can see.`;

  try {
    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text().trim();
    
    // Parse JSON response, handle potential markdown wrapping
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
