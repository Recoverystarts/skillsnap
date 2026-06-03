import React, { useState, useEffect } from 'react';

interface Step {
  stepNumber: number;
  instruction: string;
  detail?: string;
  safetyNote?: string;
  sopSource?: string;
}

interface Props {
  result: any;
  scanImage?: string | null;
  onNewScan: () => void;
  onBack: () => void;
}

export function GuidanceView({ result, scanImage, onNewScan, onBack }: Props) {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [confidenceAnim, setConfidenceAnim] = useState(0);
  const [showSteps, setShowSteps] = useState(false);

  // Animate confidence meter on mount
  useEffect(() => {
    const target = (result.confidence || 0) * 100;
    let current = 0;
    const timer = setInterval(() => {
      current += 2;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      setConfidenceAnim(current);
    }, 20);

    // Stagger step reveal
    setTimeout(() => setShowSteps(true), 400);

    return () => clearInterval(timer);
  }, [result.confidence]);

  const imageUrl = scanImage || result.imageUrl || null;
  const steps: Step[] = result.steps || [];
  const completionCriteria = result.completionCriteria;
  const sopRefs = result.sopReferences || [];

  const confidenceColor = confidenceAnim >= 80 ? 'from-emerald-400 to-green-500' :
    confidenceAnim >= 50 ? 'from-amber-400 to-yellow-500' : 'from-red-400 to-rose-500';

  const confidenceTextColor = confidenceAnim >= 80 ? 'text-emerald-400' :
    confidenceAnim >= 50 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="max-w-5xl mx-auto p-4">
      <button onClick={onBack} className="text-white/40 text-sm hover:text-white/60 transition mb-4 inline-flex items-center gap-1">
        <span>←</span> Dashboard
      </button>

      {/* ── Hero: Photo + Confidence ── */}
      <div className="md:grid md:grid-cols-5 md:gap-6">
        {/* Left: Photo panel */}
        <div className="md:col-span-2 mb-4 md:mb-0 md:sticky md:top-20 md:self-start">
          <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-black/40">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Scanned work area"
                className="w-full aspect-[4/3] object-cover"
              />
            ) : (
              <div className="w-full aspect-[4/3] bg-gradient-to-br from-white/[0.02] to-white/[0.06] flex items-center justify-center">
                <div className="text-center">
                  <span className="text-4xl block mb-2">📷</span>
                  <p className="text-white/30 text-sm">Photo not available</p>
                </div>
              </div>
            )}

            {/* Confidence overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-10">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Confidence</p>
                  <p className={`text-3xl font-black tabular-nums ${confidenceTextColor}`}>
                    {confidenceAnim.toFixed(0)}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Detected</p>
                  <p className="text-white/90 text-lg font-bold">{result.objectsDetected} <span className="text-white/40 text-sm font-normal">objects</span></p>
                </div>
              </div>
              {/* Confidence bar */}
              <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${confidenceColor} transition-all duration-1000 ease-out`}
                  style={{ width: `${confidenceAnim}%` }}
                />
              </div>
            </div>
          </div>

          {/* Vision summary — below photo */}
          <div className="mt-3 bg-white/[0.03] rounded-xl border border-white/[0.06] p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-blue-500/20 flex items-center justify-center text-xs">🔍</div>
              <h3 className="text-sm font-semibold text-blue-300">Scene Analysis</h3>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">{result.visionSummary}</p>
          </div>

          {/* Processing time */}
          <p className="text-white/20 text-xs text-center mt-2">
            {(result.processingTimeMs / 1000).toFixed(1)}s · {steps.length} steps · {result.objectsDetected} objects
          </p>
        </div>

        {/* Right: Steps + Details */}
        <div className="md:col-span-3 space-y-3">

          {/* Safety warnings — only if present */}
          {result.safetyWarnings?.length > 0 && (
            <div className="bg-red-500/[0.08] rounded-2xl border border-red-500/20 p-4 animate-pulse-slow">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center text-sm">⚠️</div>
                <h3 className="font-bold text-red-400 text-sm">Safety Alerts</h3>
              </div>
              <ul className="space-y-1.5">
                {result.safetyWarnings.map((w: string, i: number) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="text-red-400 mt-0.5 flex-shrink-0 text-xs">●</span>
                    <span className="text-red-200/80">{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Step-by-step guidance */}
          <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-4 md:p-5">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-amber-400/20 flex items-center justify-center text-sm">📋</div>
              <h3 className="font-bold text-amber-400">Job Plan</h3>
              <span className="ml-auto text-white/20 text-xs">{steps.length} steps</span>
            </div>

            <ol className="space-y-4">
              {steps.map((s: Step, idx: number) => (
                <li
                  key={s.stepNumber}
                  className={`relative pl-12 transition-all duration-500 ${
                    showSteps ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                  }`}
                  style={{ transitionDelay: `${idx * 80}ms` }}
                  onClick={() => setActiveStep(activeStep === s.stepNumber ? null : s.stepNumber)}
                >
                  {/* Step number pill */}
                  <div className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-md transition-all cursor-pointer ${
                    activeStep === s.stepNumber
                      ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-black shadow-amber-400/30 scale-110'
                      : 'bg-white/[0.08] text-white/60 border border-white/[0.1] hover:border-amber-400/30'
                  }`}>
                    {s.stepNumber}
                  </div>

                  {/* Connector line */}
                  {idx < steps.length - 1 && (
                    <div className="absolute left-[15px] top-10 bottom-[-8px] w-[2px] bg-gradient-to-b from-white/[0.08] to-transparent" />
                  )}

                  {/* Content */}
                  <div className={`rounded-xl transition-all ${
                    activeStep === s.stepNumber ? 'bg-white/[0.04] p-3 -mx-1' : ''
                  }`}>
                    <p className="font-semibold text-white/90 text-[15px] leading-snug">{s.instruction}</p>

                    {s.detail && (
                      <p className={`text-sm text-white/50 mt-1.5 leading-relaxed transition-all ${
                        activeStep === s.stepNumber ? 'text-white/60' : ''
                      }`}>{s.detail}</p>
                    )}

                    {s.safetyNote && (
                      <div className="mt-2 flex gap-2 bg-amber-400/[0.06] rounded-lg px-3 py-2 border border-amber-400/[0.08]">
                        <span className="text-amber-400 text-xs mt-0.5 flex-shrink-0">⚡</span>
                        <p className="text-xs text-amber-300/70 leading-relaxed">{s.safetyNote}</p>
                      </div>
                    )}

                    {s.sopSource && activeStep === s.stepNumber && (
                      <p className="text-xs text-white/25 mt-2 italic">Source: {s.sopSource}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Completion criteria */}
          {completionCriteria && (
            <div className="bg-emerald-500/[0.05] rounded-2xl border border-emerald-500/[0.12] p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-sm">✅</div>
                <h3 className="font-bold text-emerald-400 text-sm">What Done Looks Like</h3>
              </div>
              <p className="text-emerald-200/70 text-sm leading-relaxed">{completionCriteria}</p>
            </div>
          )}

          {/* SOP References */}
          {sopRefs.length > 0 && (
            <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-sm">📄</div>
                <h3 className="font-bold text-indigo-300 text-sm">SOP References</h3>
              </div>
              <div className="space-y-2">
                {sopRefs.map((ref: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 bg-white/[0.02] rounded-lg p-2.5 border border-white/[0.04]">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      (ref.relevance || 0) >= 0.8 ? 'bg-emerald-500/20 text-emerald-400' :
                      (ref.relevance || 0) >= 0.5 ? 'bg-amber-400/20 text-amber-400' :
                      'bg-white/[0.06] text-white/40'
                    }`}>
                      {((ref.relevance || 0) * 100).toFixed(0)}%
                    </div>
                    <div className="min-w-0">
                      <p className="text-white/80 text-sm font-medium truncate">{ref.title}</p>
                      {ref.excerpt && <p className="text-white/30 text-xs mt-0.5 line-clamp-2">{ref.excerpt}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Scan button */}
          <button
            onClick={onNewScan}
            className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-black rounded-2xl font-bold text-lg active:scale-[0.98] transition-all shadow-lg shadow-amber-400/10 hover:shadow-amber-400/30"
          >
            New Scan →
          </button>
        </div>
      </div>
    </div>
  );
}
