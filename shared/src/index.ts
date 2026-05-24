// SkillSnap shared types

export interface User {
  id: string;
  email: string;
  name: string;
  companyId: string;
  role: 'admin' | 'manager' | 'worker';
  tier: 'trial' | 'team' | 'enterprise';
  createdAt: Date;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  tier: 'trial' | 'team' | 'enterprise';
  territoryExclusive: boolean;
  region?: string;
  createdAt: Date;
}

export interface ScanRequest {
  id: string;
  userId: string;
  companyId: string;
  imageUrl: string;
  status: 'processing' | 'complete' | 'failed';
  createdAt: Date;
}

export interface VisionResult {
  objects: DetectedObject[];
  sceneDescription: string;
  confidence: number;
}

export interface DetectedObject {
  name: string;
  confidence: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
  category: 'tool' | 'material' | 'equipment' | 'environment' | 'safety' | 'other';
}

export interface SOPDocument {
  id: string;
  companyId: string;
  title: string;
  fileName: string;
  storageUrl: string;
  embeddingsGenerated: boolean;
  pageCount: number;
  uploadedAt: Date;
}

export interface SOPChunk {
  id: string;
  documentId: string;
  content: string;
  pageNumber: number;
  chunkIndex: number;
  embedding?: number[];
}

export interface GuidanceResponse {
  scanId: string;
  steps: GuidanceStep[];
  safetyWarnings: string[];
  sopReferences: SOPReference[];
  confidence: number;
  processingTimeMs: number;
}

export interface GuidanceStep {
  stepNumber: number;
  instruction: string;
  detail?: string;
  safetyNote?: string;
  sopSource?: string;
}

export interface SOPReference {
  documentTitle: string;
  pageNumber: number;
  relevanceScore: number;
  excerpt: string;
}

export const TIER_LIMITS = {
  trial: { scansPerDay: 5, maxDocuments: 3, maxUsers: 2 },
  team: { scansPerDay: 50, maxDocuments: 25, maxUsers: 20 },
  enterprise: { scansPerDay: -1, maxDocuments: -1, maxUsers: -1 },
} as const;
