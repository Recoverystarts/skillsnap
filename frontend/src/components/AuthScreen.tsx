import React, { useState } from 'react';
import { api } from '../api';

interface Props { onAuth: () => void; onBack?: () => void; }

export function AuthScreen({ onAuth, onBack }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        await api.register(email, password, name);
      } else {
        await api.login(email, password);
      }
      onAuth();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06060f] flex flex-col items-center justify-center p-6">
      {/* Ambient glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-400/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-500/3 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Back button */}
        {onBack && (
          <button onClick={onBack} className="text-white/40 text-sm hover:text-white/60 transition mb-6 flex items-center gap-1">
            ← Back
          </button>
        )}

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-400/20">
            <span className="text-3xl font-black text-black">S</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-amber-400">Skill</span><span className="text-white">Snap</span>
          </h1>
          <p className="text-white/40 text-sm mt-2">AI-powered workplace guidance</p>
        </div>

        {/* Form card */}
        <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-6 shadow-2xl">
          <div className="flex gap-2 mb-6 bg-white/[0.03] rounded-xl p-1">
            <button onClick={() => setMode('login')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'login' ? 'bg-amber-400/20 text-amber-400' : 'text-white/40'}`}>Sign In</button>
            <button onClick={() => setMode('register')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'register' ? 'bg-amber-400/20 text-amber-400' : 'text-white/40'}`}>Create Account</button>
          </div>

          {mode === 'register' && (
            <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none focus:border-amber-400/40 transition mb-3" />
          )}
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none focus:border-amber-400/40 transition mb-3" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none focus:border-amber-400/40 transition mb-4" />

          {error && <p className="text-red-400 text-sm mb-3 text-center">{error}</p>}

          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-orange-500 text-black font-bold rounded-xl disabled:opacity-50 hover:shadow-lg hover:shadow-amber-400/20 active:scale-[0.98] transition-all">
            {loading ? '...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </div>

        <p className="text-center text-white/20 text-xs mt-8">
          Using AI to help the human, not replace the human
        </p>
      </div>
    </div>
  );
}
