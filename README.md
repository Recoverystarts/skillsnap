# SkillSnap

**Using AI to help the human, not replace the human.**

B2B AI platform where workers snap a photo of their work environment and receive AI-generated, step-by-step guidance verified against their company's Standard Operating Procedures.

## The Problem

Knowledge hoarding kills productivity and safety. Senior workers gatekeep procedures, new workers get no training, and companies lose institutional knowledge when experienced workers leave.

## The Solution

Three-tier AI pipeline:
1. **Vision** — Google Cloud Vision + Gemini identify the scene
2. **Knowledge** — RAG searches company SOPs for relevant procedures
3. **Synthesis** — Gemini cross-references, applies safety standards, generates guidance

## Tech Stack

- Frontend: React PWA (mobile camera)
- Backend: Node.js/TypeScript on Cloud Run
- AI: Gemini API + Google Cloud Vision
- Database: Cloud SQL (PostgreSQL + pgvector)
- Storage: Google Cloud Storage
- Auth: Firebase Auth
- Payments: Stripe

## XPRIZE Rapid Reskilling

Category: Education & Human Potential | Deadline: August 17, 2026

## Development

```bash
npm install
npm run dev
```

## License

MIT
