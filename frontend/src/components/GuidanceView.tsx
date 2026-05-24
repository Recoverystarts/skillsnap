import React from 'react';

interface Props { result: any; onNewScan: () => void; }

export function GuidanceView({ result, onNewScan }: Props) {
  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Vision Summary */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <h2 className="font-bold text-lg mb-2 text-amber-400">🔍 What I See</h2>
        <p className="text-white/80 text-sm leading-relaxed">{result.visionSummary}</p>
        <div className="flex gap-3 mt-2 text-xs text-white/40">
          <span>{result.objectsDetected} objects detected</span>
          <span>•</span>
          <span>{(result.confidence * 100).toFixed(0)}% confidence</span>
        </div>
      </div>

      {/* Safety Warnings */}
      {result.safetyWarnings?.length > 0 && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4">
          <h2 className="font-bold text-red-400 mb-2">⚠️ Safety Alerts</h2>
          <ul className="space-y-2">
            {result.safetyWarnings.map((w: string, i: number) => (
              <li key={i} className="text-sm text-red-200 flex gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Step-by-Step Guide */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <h2 className="font-bold text-lg mb-3 text-amber-400">📋 Step-by-Step Guide</h2>
        <ol className="space-y-4">
          {result.steps?.map((s: any) => (
            <li key={s.stepNumber} className="flex gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-sm">
                {s.stepNumber}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{s.instruction}</p>
                {s.detail && <p className="text-sm text-white/60 mt-1">{s.detail}</p>}
                {s.safetyNote && (
                  <p className="text-sm text-amber-300/80 mt-1 flex gap-1">
                    <span>⚡</span>
                    <span>{s.safetyNote}</span>
                  </p>
                )}
                {s.sopSource && s.sopSource !== 'General Industry Guidance' && (
                  <p className="text-xs text-white/30 mt-1">📄 {s.sopSource}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* SOP References */}
      {result.sopReferences?.length > 0 && result.sopReferences.some((r: any) => r.documentTitle !== 'General Electrical Safety Guidelines') && (
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <h2 className="font-bold text-sm text-white/50 mb-2">📚 Referenced SOPs</h2>
          {result.sopReferences.map((ref: any, i: number) => (
            <div key={i} className="text-sm text-white/60">
              <span className="font-medium">{ref.documentTitle}</span>
              {ref.pageNumber && <span className="text-white/30"> • Page {ref.pageNumber}</span>}
              <span className="text-white/30"> • {(ref.relevanceScore * 100).toFixed(0)}% match</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-white/30 text-center">
        Processed in {(result.processingTimeMs / 1000).toFixed(1)}s
      </p>

      <button onClick={onNewScan}
        className="w-full py-4 bg-amber-400 text-black rounded-xl font-bold text-lg active:scale-[0.98] transition-transform">
        New Scan
      </button>
    </div>
  );
}
