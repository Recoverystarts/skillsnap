import React from 'react';

interface Props { result: any; onNewScan: () => void; onBack: () => void; }

export function GuidanceView({ result, onNewScan, onBack }: Props) {
  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <button onClick={onBack} className="text-white/40 text-sm hover:text-white/60 transition">← Dashboard</button>

      {/* Confidence badge */}
      <div className="flex items-center gap-3">
        <div className={`px-3 py-1.5 rounded-full text-sm font-bold ${
          result.confidence >= 0.8 ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
          result.confidence >= 0.5 ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30' :
          'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {(result.confidence * 100).toFixed(0)}% Confidence
        </div>
        <span className="text-white/20 text-sm">{result.objectsDetected} objects found</span>
      </div>

      {/* Vision summary */}
      <div className="bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/[0.06] p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-sm">🔍</div>
          <h2 className="font-bold text-blue-300">Scene Analysis</h2>
        </div>
        <p className="text-white/70 text-sm leading-relaxed">{result.visionSummary}</p>
      </div>

      {/* Safety warnings */}
      {result.safetyWarnings?.length > 0 && (
        <div className="bg-red-500/[0.06] backdrop-blur-sm rounded-2xl border border-red-500/20 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-sm">⚠️</div>
            <h2 className="font-bold text-red-400">Safety Alerts</h2>
          </div>
          <ul className="space-y-2">
            {result.safetyWarnings.map((w: string, i: number) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-red-400 mt-0.5 flex-shrink-0">●</span>
                <span className="text-red-200/80">{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Step-by-step guide */}
      <div className="bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/[0.06] p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-400/20 flex items-center justify-center text-sm">📋</div>
          <h2 className="font-bold text-amber-400">Step-by-Step Guidance</h2>
        </div>
        <ol className="space-y-5">
          {result.steps?.map((s: any, idx: number) => (
            <li key={s.stepNumber} className="relative pl-12">
              {/* Step number */}
              <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-black flex items-center justify-center font-black text-sm shadow-md shadow-amber-400/20">
                {s.stepNumber}
              </div>
              {/* Connector line */}
              {idx < (result.steps?.length || 0) - 1 && (
                <div className="absolute left-[15px] top-10 bottom-[-12px] w-[2px] bg-gradient-to-b from-amber-400/30 to-transparent" />
              )}
              <div>
                <p className="font-semibold text-white/90">{s.instruction}</p>
                {s.detail && <p className="text-sm text-white/50 mt-1.5 leading-relaxed">{s.detail}</p>}
                {s.safetyNote && (
                  <div className="mt-2 flex gap-2 bg-amber-400/[0.06] rounded-lg px-3 py-2">
                    <span className="text-amber-400 text-xs mt-0.5">⚡</span>
                    <p className="text-xs text-amber-300/70">{s.safetyNote}</p>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>

      <p className="text-white/20 text-xs text-center">{(result.processingTimeMs / 1000).toFixed(1)}s processing time</p>

      <button onClick={onNewScan}
        className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-black rounded-2xl font-bold text-lg active:scale-[0.98] transition-all shadow-lg shadow-amber-400/10 hover:shadow-amber-400/30">
        New Scan →
      </button>
    </div>
  );
}
