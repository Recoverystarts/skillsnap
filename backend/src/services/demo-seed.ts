import { getPool } from '../db/pool';
import { generateEmbedding } from '../services/embedding';

const DEMO_SOPS = [
  {
    title: 'Trench Excavation Safety Procedures',
    fileName: 'trench-excavation-safety.txt',
    chunks: [
      'All trenches deeper than 1.2 meters require shoring, sloping, or a trench box per Alberta OHS Part 32. Workers must not enter an unprotected trench. Soil must be classified before excavation begins.',
      'Spoil piles must be kept at least 1 meter from trench edges. Access/egress ladders required every 8 meters of trench length. Daily trench inspections required before work begins and after any weather event.',
      'Underground utility locates must be completed and valid before any excavation. Hand-expose within 1 meter of known utilities. Maintain minimum clearances per utility owner requirements.',
    ],
  },
  {
    title: 'Gravity Sewer Pipe Installation Procedures',
    fileName: 'gravity-sewer-installation.txt',
    chunks: [
      'Pipe bedding must be Class B or better granular material, minimum 100mm depth below pipe barrel. Grade stakes reference bottom-of-footing (BOF) elevation. Laser must be verified against benchmarks before each setup.',
      'PVC sewer pipe joints must be lubricated and fully seated with bell facing upstream. Minimum slope for 200mm pipe is 1.0%. Check grade at every joint using laser and target. Document all grade readings.',
      'Backfill in 300mm lifts with mechanical compaction to 95% Standard Proctor. No rocks larger than 75mm within 300mm of pipe. Mandrel test required before acceptance.',
    ],
  },
  {
    title: 'Daily Site Inspection Checklist',
    fileName: 'daily-site-inspection.txt',
    chunks: [
      'Pre-start inspection: Verify all workers have required PPE (hard hat, safety glasses, high-vis vest, steel-toe boots). Check that safety data sheets are available for all chemicals on site.',
      'Equipment inspection: Walk-around inspection of all heavy equipment before operation. Check fluid levels, lights, backup alarms, fire extinguisher. Report deficiencies to supervisor immediately.',
      'Site communication: Verify emergency muster point is identified and posted. Confirm all workers know the emergency contact numbers. Toolbox talk must be completed and documented before work begins.',
    ],
  },
];

export async function seedDemoSOPs(companyId: string): Promise<void> {
  const db = getPool();

  const countResult = await db.query(
    'SELECT COUNT(*) FROM sop_documents WHERE company_id = $1',
    [companyId]
  );
  if (parseInt(countResult.rows[0].count, 10) > 0) return;

  for (const sop of DEMO_SOPS) {
    const docResult = await db.query(
      `INSERT INTO sop_documents (company_id, title, file_name, storage_url, mime_type, chunk_count, embeddings_generated)
       VALUES ($1, $2, $3, $4, 'text/plain', $5, true) RETURNING id`,
      [companyId, sop.title, sop.fileName, `demo://${sop.fileName}`, sop.chunks.length]
    );
    const documentId = docResult.rows[0].id;

    for (let i = 0; i < sop.chunks.length; i++) {
      const content = sop.chunks[i];
      const embedding = await generateEmbedding(content);
      await db.query(
        `INSERT INTO sop_chunks (document_id, company_id, chunk_index, content, embedding)
         VALUES ($1, $2, $3, $4, $5)`,
        [documentId, companyId, i, content, JSON.stringify(embedding)]
      );
    }
  }
}
