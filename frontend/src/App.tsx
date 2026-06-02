import React, { useState, useEffect } from 'react';
import { api } from './api';
import { AuthScreen } from './components/AuthScreen';
import { Dashboard } from './components/Dashboard';
import { ScanScreen } from './components/ScanScreen';
import { GuidanceView } from './components/GuidanceView';
import { SOPManager } from './components/SOPManager';
import { LandingPage } from './components/LandingPage';

type Screen = 'dashboard' | 'scan' | 'results' | 'sops';

export function App() {
  const [isAuth, setIsAuth] = useState(api.isAuthenticated());
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [showAuth, setShowAuth] = useState(false);

  const handleDemoLogin = async () => {
    try {
      await api.demoLogin();
      setIsAuth(true);
    } catch (err) {
      console.error('Demo login failed:', err);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === 'true' && !api.isAuthenticated()) {
      handleDemoLogin();
    }
  }, []);

  const handleScanComplete = (result: any) => {
    setScanResult(result);
    setScanHistory(prev => [result, ...prev].slice(0, 20));
    setScreen('results');
  };

  const handleHistoryClick = async (scanId: string) => {
    try {
      const scan = await api.getScanDetail(scanId);
      const result = {
        visionSummary: scan.scene_description,
        objectsDetected: scan.objects_detected,
        processingTimeMs: scan.processing_time_ms,
        confidence: scan.confidence,
        steps: scan.guidance_steps,
        safetyWarnings: scan.safety_warnings,
        imageUrl: scan.image_url,
        createdAt: scan.created_at,
      };
      setScanResult(result);
      setScreen('results');
    } catch (err) {
      console.error('Failed to load scan:', err);
    }
  };

  if (!isAuth && !showAuth) {
    return <LandingPage onSignIn={() => setShowAuth(true)} onDemo={handleDemoLogin} />;
  }
  if (!isAuth && showAuth) {
    return <AuthScreen onAuth={() => setIsAuth(true)} onBack={() => setShowAuth(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#06060f] text-white flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#06060f]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-black font-black text-sm">S</div>
          <span className="font-bold text-lg tracking-tight">
            <span className="text-amber-400">Skill</span><span className="text-white/90">Snap</span>
          </span>
        </div>
        <button onClick={() => api.logout()} className="text-xs text-white/30 hover:text-white/60 transition">Sign Out</button>
      </header>

      {/* Content */}
      <main className="flex-1 pb-20">
        {screen === 'dashboard' && <Dashboard onNavigate={setScreen} scanHistory={scanHistory} onHistoryClick={handleHistoryClick} />}
        {screen === 'scan' && <ScanScreen onComplete={handleScanComplete} onBack={() => setScreen('dashboard')} />}
        {screen === 'results' && scanResult && <GuidanceView result={scanResult} onNewScan={() => setScreen('scan')} onBack={() => setScreen('dashboard')} />}
        {screen === 'sops' && <SOPManager onBack={() => setScreen('dashboard')} />}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0a18]/95 backdrop-blur-xl border-t border-white/5 flex justify-around py-2 px-4 z-50">
        <NavBtn icon="🏠" label="Home" active={screen === 'dashboard'} onClick={() => setScreen('dashboard')} />
        <NavBtn icon="📷" label="Scan" active={screen === 'scan'} onClick={() => setScreen('scan')} primary />
        <NavBtn icon="📋" label="SOPs" active={screen === 'sops'} onClick={() => setScreen('sops')} />
      </nav>
    </div>
  );
}

function NavBtn({ icon, label, active, onClick, primary }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-all ${
      primary ? 'bg-amber-400/20 -mt-4 px-6 py-3 rounded-2xl border border-amber-400/30' :
      active ? 'text-amber-400' : 'text-white/40 hover:text-white/60'
    }`}>
      <span className={`text-xl ${primary ? 'text-2xl' : ''}`}>{icon}</span>
      <span className={`text-[10px] font-medium ${primary ? 'text-amber-400' : ''}`}>{label}</span>
    </button>
  );
}
