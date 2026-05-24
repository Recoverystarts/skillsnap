import React, { useState } from 'react';
import { CameraView } from './components/CameraView';
import { GuidanceView } from './components/GuidanceView';

const API_URL = import.meta.env.VITE_API_URL || '';
const COMPANY_ID = import.meta.env.VITE_COMPANY_ID || '3f429e7d-165c-44b3-ab77-b91f5406fbf9';

export function App() {
  const [scanResult, setScanResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async (imageBlob: Blob) => {
    setIsScanning(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('image', imageBlob);
      const res = await fetch(`${API_URL}/api/scan`, {
        method: 'POST',
        headers: { 'x-company-id': COMPANY_ID },
        body: formData,
      });
      if (!res.ok) throw new Error(`Scan failed: ${res.status}`);
      setScanResult(await res.json());
    } catch (err: any) {
      console.error('Scan failed:', err);
      setError(err.message || 'Scan failed — please try again');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a1a] text-white">
      <header className="p-4 text-center border-b border-white/10">
        <h1 className="text-2xl font-bold">
          <span className="text-amber-400">Skill</span>Snap
        </h1>
        <p className="text-sm text-white/60 mt-1">AI-powered guidance from your company SOPs</p>
      </header>
      <main className="flex-1 p-4">
        {error && (
          <div className="max-w-md mx-auto mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-sm text-red-300">
            {error}
            <button onClick={() => setError(null)} className="ml-2 text-white/50 hover:text-white">✕</button>
          </div>
        )}
        {!scanResult ? (
          <CameraView onCapture={handleScan} isScanning={isScanning} />
        ) : (
          <GuidanceView result={scanResult} onNewScan={() => setScanResult(null)} />
        )}
      </main>
      <footer className="p-3 text-center text-xs text-white/30">
        SkillSnap v0.1.0 — Using AI to help the human, not replace the human
      </footer>
    </div>
  );
}
