import React from 'react';

interface Props { onSignIn: () => void; onDemo: () => void; }

export function LandingPage({ onSignIn, onDemo }: Props) {
  return (
    <div className="min-h-screen bg-[#06060f] text-white overflow-y-auto">
      {/* Ambient glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-400/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-orange-500/3 rounded-full blur-[100px]" />
      </div>

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-black font-black text-sm">S</div>
          <span className="font-bold text-lg tracking-tight">
            <span className="text-amber-400">Skill</span><span className="text-white/90">Snap</span>
          </span>
        </div>
        <button onClick={onSignIn} className="text-sm text-white/50 hover:text-amber-400 transition px-4 py-2 rounded-lg border border-white/10 hover:border-amber-400/30">
          Sign In
        </button>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-2xl mx-auto px-6 pt-16 pb-12 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-8 shadow-lg shadow-amber-400/20">
          <span className="text-4xl font-black text-black">S</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
          Snap a photo.<br />
          <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Get expert guidance.</span>
        </h1>
        <p className="text-lg text-white/50 max-w-md mx-auto leading-relaxed mb-8">
          AI that transfers years of on-the-job experience to every worker, instantly. 
          Point your phone at any work situation and get step-by-step guidance from the knowledge your best people already have.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={onDemo}
            className="px-8 py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-black font-bold rounded-xl text-lg hover:shadow-lg hover:shadow-amber-400/20 active:scale-[0.98] transition-all">
            Try the Demo →
          </button>
          <button onClick={onSignIn}
            className="px-8 py-4 bg-white/[0.04] border border-white/10 text-white/80 font-medium rounded-xl text-lg hover:bg-white/[0.08] hover:border-white/20 transition-all">
            Sign In
          </button>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-center mb-10 text-white/80">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StepCard
            step="1"
            icon="📸"
            title="Snap"
            desc="Take a photo of your work area — materials, tools, the job site. Whatever you're looking at."
          />
          <StepCard
            step="2"
            icon="🧠"
            title="AI Analyzes"
            desc="Gemini AI identifies every object, material, and piece of equipment. Matches against your company's procedures."
          />
          <StepCard
            step="3"
            icon="📋"
            title="Get Your Plan"
            desc="Receive a step-by-step job plan written like an experienced coworker is standing next to you."
          />
        </div>
      </section>

      {/* Value props */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 py-12">
        <div className="space-y-4">
          <ValueCard
            icon="🔄"
            title="Knowledge Transfer"
            desc="Stop losing decades of expertise when experienced workers retire or move on. SkillSnap captures what your best people know and makes it available to everyone."
          />
          <ValueCard
            icon="🌍"
            title="Any Skill Domain"
            desc="Construction today. Manufacturing, maintenance, agriculture, field services — any domain where experienced people have knowledge that newcomers need."
          />
          <ValueCard
            icon="📄"
            title="Your Procedures, Not Generic Advice"
            desc="Upload your company's SOPs and work procedures. AI guidance is verified against YOUR standards, not internet search results."
          />
          <ValueCard
            icon="⚡"
            title="29-Second Analysis"
            desc="From photo to actionable job plan in under 30 seconds. Multi-stage AI pipeline: vision analysis, procedure matching, expert synthesis."
          />
        </div>
      </section>

      {/* Social proof / competition badge */}
      <section className="relative z-10 max-w-xl mx-auto px-6 py-12 text-center">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8">
          <p className="text-xs text-amber-400 font-semibold uppercase tracking-widest mb-2">XPRIZE Rapid Reskilling</p>
          <p className="text-white/60 text-sm leading-relaxed">
            Built for the XPRIZE Rapid Reskilling competition — proving that AI can accelerate
            how people learn real-world skills, not replace the humans who teach them.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 border-t border-white/5">
        <p className="text-white/20 text-sm">Powered by Gemini AI</p>
        <p className="text-white/10 text-xs mt-2">Using AI to help the human, not replace the human</p>
      </footer>
    </div>
  );
}

function StepCard({ step, icon, title, desc }: { step: string; icon: string; title: string; desc: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 text-center hover:border-amber-400/20 transition">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-black flex items-center justify-center font-black text-lg mx-auto mb-4 shadow-md shadow-amber-400/20">
        {step}
      </div>
      <span className="text-3xl block mb-3">{icon}</span>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function ValueCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 flex gap-4 hover:border-amber-400/20 transition">
      <div className="w-12 h-12 rounded-xl bg-amber-400/10 flex items-center justify-center text-2xl flex-shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-white/90 mb-1">{title}</h3>
        <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
