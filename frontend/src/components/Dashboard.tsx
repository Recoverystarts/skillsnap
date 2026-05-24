import React, { useEffect, useState } from 'react';
import { api } from '../api';

interface Props { onNavigate: (screen: string) => void; scanHistory: any[]; }

export function Dashboard({ onNavigate, scanHistory }: Props) {
  const user = api.getUser();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.getSOPStats().then(setStats).catch(() => {});
  }, []);

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto">
      {/* Welcome */}
      <div className="pt-2">
        <p className="text-white/40 text-sm">Welcome back,</p>
        <h2 className="text-2xl font-bold">{user?.name || 'Worker'}</h2>
      </div>

      {/* Quick action */}
      <button onClick={() => onNavigate('scan')}
        className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-500/10 border border-amber-400/20 p-6 text-left group hover:border-amber-400/40 transition-all active:scale-[0.99]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-amber-400/20 transition" />
        <div className="relative">
          <span className="text-4xl mb-3 block">📸</span>
          <h3 className="text-xl font-bold text-amber-400">Snap & Get Guidance</h3>
          <p className="text-white/50 text-sm mt-1">Point your camera at your work area for AI-powered safety guidance</p>
        </div>
      </button>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Scans Today" value={scanHistory.length.toString()} icon="🔍" />
        <StatCard label="SOPs Loaded" value={stats?.totalDocuments?.toString() || '0'} icon="📄" />
        <StatCard label="Safety Score" value="A+" icon="🛡️" />
      </div>

      {/* SOP management */}
      <button onClick={() => onNavigate('sops')}
        className="w-full flex items-center gap-4 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.05] transition text-left">
        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-xl">📋</div>
        <div className="flex-1">
          <p className="font-medium">Company SOPs</p>
          <p className="text-white/40 text-sm">Upload and manage your procedures</p>
        </div>
        <span className="text-white/20">→</span>
      </button>

      {/* Recent scans */}
      {scanHistory.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-white/40 mb-3">Recent Scans</h3>
          <div className="space-y-2">
            {scanHistory.slice(0, 5).map((scan, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-400/10 flex items-center justify-center text-sm">🔍</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{scan.visionSummary?.slice(0, 60)}...</p>
                  <p className="text-xs text-white/30">{scan.objectsDetected} objects • {(scan.processingTimeMs / 1000).toFixed(1)}s • {(scan.confidence * 100).toFixed(0)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
      <span className="text-lg">{icon}</span>
      <p className="text-xl font-bold mt-1">{value}</p>
      <p className="text-[10px] text-white/30 mt-0.5">{label}</p>
    </div>
  );
}
