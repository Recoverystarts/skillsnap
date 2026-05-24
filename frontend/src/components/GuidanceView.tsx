import React from 'react';

interface Props { result: any; onNewScan: () => void; }

export function GuidanceView({ result, onNewScan }: Props) {
  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="bg-[var(--color-surface)] rounded-xl p-4">
        <h2 className="font-bold text-lg mb-2">What I See</h2>
        <p className="text-white/80">{result.visionSummary}</p>
        <p className="text-xs text-white/40 mt-1">{result.objectsDetected} objects detected</p>
      </div>

      {result.safetyWarnings?.length > 0 && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4">
          <h2 className="font-bold text-[var(--color-accent)] mb-2">Safety</h2>
          {result.safetyWarnings.map((w: string, i: number) => <p key={i} className="text-sm">{w}</p>)}
        </div>
      )}

      <div className="bg-[var(--color-surface)] rounded-xl p-4">
        <h2 className="font-bold text-lg mb-3">Step-by-Step Guide</h2>
        <ol className="space-y-3">
          {result.steps?.map((s: any) => (
            <li key={s.stepNumber} className="flex gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center font-bold text-sm">{s.stepNumber}</span>
              <div>
                <p className="font-medium">{s.instruction}</p>
                {s.detail && <p className="text-sm text-white/60 mt-1">{s.detail}</p>}
                {s.safetyNote && <p className="text-sm text-[var(--color-accent)] mt-1">{s.safetyNote}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>

      <p className="text-xs text-white/30 text-center">
        Processed in {result.processingTimeMs}ms
      </p>

      <button onClick={onNewScan}
        className="w-full py-4 bg-[var(--color-accent)] rounded-xl font-bold text-lg active:scale-[0.98] transition-transform">
        New Scan
      </button>
    </div>
  );
}
