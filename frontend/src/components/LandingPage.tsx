import React from 'react';

interface Props {
  onSignIn: () => void;
  onDemo: () => void;
}

export function LandingPage({ onSignIn, onDemo }: Props) {
  return (
    <div className="min-h-screen bg-[#06060f] text-white flex flex-col overflow-x-hidden">
      {/* Ambient glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-400/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-black font-black text-sm">S</div>
          <span className="font-bold text-lg tracking-tight">
            <span className="text-amber-400">Skill</span><span className="text-white/90">Snap</span>
          </span>
        </div>
        <button onClick={onSignIn} className="text-sm text-white/60 hover:text-white transition px-4 py-2 rounded-lg border border-white/10 hover:border-white/20">
          Sign In
        </button>
      </header>

      <main className="relative z-10 flex-1 px-6 py-12 max-w-lg mx-auto w-full space-y-16">
        {/* Hero */}
        <section className="text-center space-y-6 pt-4">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto shadow-2xl shadow-amber-400/20">
            <span className="text-4xl font-black text-black">S</span>
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight leading-tight">
              Snap a photo.<br />
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Get expert guidance.
              </span>
            </h1>
            <p className="text-white/50 text-lg mt-4 leading-relaxed">
              AI that transfers years of experience to every worker, instantly.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button onClick={onDemo}
              className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-black font-bold rounded-2xl text-lg hover:shadow-lg hover:shadow-amber-400/20 active:scale-[0.98] transition-all">
              Try Demo
            </button>
            <button onClick={onSignIn}
              className="w-full py-4 bg-white/[0.04] border border-white/[0.08] text-white font-semibold rounded-2xl hover:bg-white/[0.07] active:scale-[0.98] transition-all">
              Sign In
            </button>
          </div>
        </section>

        {/* How it works */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-white/30 uppercase tracking-widest text-center">How it works</h2>
          <div className="space-y-3">
            {[
              { icon: '📸', step: '1', title: 'Snap', desc: 'Take a photo of your work area' },
              { icon: '🧠', step: '2', title: 'AI Analyzes', desc: 'Identifies materials, tools, and context from the image' },
              { icon: '📋', step: '3', title: 'Get Your Plan', desc: "Step-by-step guidance from experienced workers' knowledge" },
            ].map(({ icon, step, title, desc }) => (
              <div key={step} className="flex gap-4 items-start bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/10 border border-amber-400/20 flex items-center justify-center text-2xl flex-shrink-0">
                  {icon}
                </div>
                <div>
                  <p className="text-xs text-amber-400/60 font-medium uppercase tracking-wider">Step {step}</p>
                  <p className="font-bold text-white mt-0.5">{title}</p>
                  <p className="text-sm text-white/50 mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Value proposition */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-white/30 uppercase tracking-widest text-center">Why SkillSnap</h2>
          <div className="space-y-3">
            {[
              { icon: '🧠', title: 'Knowledge Transfer', desc: 'Stop losing expertise when experienced workers leave' },
              { icon: '🌎', title: 'Any Skill Domain', desc: 'Construction today. Bird watching, boat building, and beyond tomorrow.' },
              { icon: '📋', title: 'Company SOPs Built In', desc: 'AI guidance verified against YOUR procedures, not generic advice' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 flex gap-4">
                <span className="text-2xl flex-shrink-0">{icon}</span>
                <div>
                  <p className="font-bold text-white">{title}</p>
                  <p className="text-sm text-white/50 mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 px-6 border-t border-white/5 space-y-2">
        <p className="text-white/20 text-xs">Built for the XPRIZE Rapid Reskilling Competition • Powered by Gemini AI</p>
        <p className="text-white/20 text-xs">Using AI to help the human, not replace the human</p>
      </footer>
    </div>
  );
}
