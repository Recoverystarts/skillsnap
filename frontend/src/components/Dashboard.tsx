import React, { useEffect, useState } from 'react';
import { api } from '../api';

interface Props {
  onNavigate: (screen: string) => void;
  scanHistory: any[];
  onHistoryClick: (scanId: string) => void;
}

export function Dashboard({ onNavigate, scanHistory, onHistoryClick }: Props) {
  const user = api.getUser();
  const [stats, setStats] = useState<any>(null);
  const [dbHistory, setDbHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getSOPStats().catch(() => null),
      api.getScanHistory().catch(() => []),
    ]).then(([s, h]) => {
      setStats(s);
      setDbHistory(h);
      setLoading(false);
    });
  }, []);

  const allHistory = [...scanHistory, ...dbHistory.map((s: any) => ({
    id: s.id,
    visionSummary: s.scene_description,
    objectsDetected: s.objects_detected,
    processingTimeMs: s.processing_time_ms,
    confidence: s.confidence,
    createdAt: s.created_at,
  }))];

  // Deduplicate by vision summary
  const seen = new Set();
  const uniqueHistory = allHistory.filter(s => {
    const key = s.visionSummary?.slice(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const sopCount = stats?.totalDocuments || stats?.total_documents || 0;
  const chunkCount = stats?.totalChunks || stats?.total_chunks || 0;

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto">
      {/* Welcome */}
      <div className="pt-2">
        <p className="text-white/40 text-sm">Welcome back,</p>
        <h2 className="text-2xl font-bold">{user?.name || 'Worker'} 👷</h2>
      </div>

      {/* Quick action — the big scan button */}
      <button onClick={() => onNavigate('scan')}
        className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-500/10 border border-amber-400/20 p-6 text-left group hover:border-amber-400/40 transition-all active:scale-[0.99]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-amber-400/20 transition" />
        <div className="relative">
          <span className="text-4xl mb-3 block">📸</span>
          <h3 className="text-xl font-bold text-amber-400">Snap & Get Guidance</h3>
          <p className="text-white/50 text-sm mt-1">Point your camera at your work area for AI-powered job planning guidance matched to your company procedures</p>
        </div>
      </button>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Scans" value={uniqueHistory.length.toString()} icon="🔍" />
        <StatCard label="SOPs Loaded" value={sopCount.toString()} icon="📄" sub={chunkCount > 0 ? `${chunkCount} chunks` : undefined} />
      </div>

      {/* SOP management */}
      <button onClick={() => onNavigate('sops')}
        className="w-full flex items-center gap-4 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.05] transition text-left group">
        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-xl">📋</div>
        <div className="flex-1">
          <p className="font-medium">Company SOPs</p>
          <p className="text-white/40 text-sm">Upload and manage your company procedures</p>
        </div>
        <span className="text-white/20 group-hover:text-white/40 transition">→</span>
      </button>

      {/* First-time onboarding hint */}
      {sopCount === 0 && uniqueHistory.length === 0 && !loading && (
        <div className="bg-amber-400/[0.06] border border-amber-400/20 rounded-2xl p-5 text-center">
          <span className="text-3xl block mb-2">🚀</span>
          <h3 className="font-bold text-amber-400">Get Started</h3>
          <p className="text-white/50 text-sm mt-2 leading-relaxed">
            Upload your company's work procedures first, then scan your workspace.
            AI will verify guidance against your actual SOPs — not generic advice.
          </p>
          <button onClick={() => onNavigate('sops')}
            className="mt-4 px-6 py-2.5 bg-amber-400/20 text-amber-400 rounded-xl text-sm font-medium hover:bg-amber-400/30 transition">
            Upload First SOP →
          </button>
        </div>
      )}

      {/* Scan history */}
      {uniqueHistory.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-white/40 mb-3">Recent Scans</h3>
          <div className="space-y-2">
            {uniqueHistory.slice(0, 8).map((scan, i) => (
              <button
                key={i}
                onClick={() => scan.id && onHistoryClick(scan.id)}
                disabled={!scan.id}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 flex gap-3 text-left hover:bg-white/[0.06] hover:border-white/[0.10] transition disabled:cursor-default">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
                  (scan.confidence || 0) >= 0.8 ? 'bg-green-500/10' : 'bg-amber-400/10'
                }`}>
                  {(scan.confidence || 0) >= 0.8 ? '✅' : '🔍'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{scan.visionSummary?.slice(0, 80) || 'Scan result'}</p>
                  <p className="text-xs text-white/30 mt-0.5">
                    {scan.objectsDetected || 0} objects • {((scan.processingTimeMs || 0) / 1000).toFixed(1)}s • {((scan.confidence || 0) * 100).toFixed(0)}%
                    {scan.createdAt && <span> • {new Date(scan.createdAt).toLocaleDateString()}</span>}
                  </p>
                </div>
                {scan.id && <span className="text-white/20 self-center flex-shrink-0">→</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-white/10 text-[10px] pt-4">SkillSnap v0.6.0 • Powered by Gemini AI</p>
    </div>
  );
}

function StatCard({ label, value, icon, sub }: { label: string; value: string; icon: string; sub?: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
      <span className="text-lg">{icon}</span>
      <p className="text-xl font-bold mt-1">{value}</p>
      <p className="text-[10px] text-white/30 mt-0.5">{label}</p>
      {sub && <p className="text-[9px] text-white/20">{sub}</p>}
    </div>
  );
}
