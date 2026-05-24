import React, { useState } from 'react';
import { CameraView } from './components/CameraView';
import { GuidanceView } from './components/GuidanceView';

export function App() {
  const [scanResult, setScanResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = async (imageBlob: Blob) => {
    setIsScanning(true);
    try {
      const formData = new FormData();
      formData.append('image', imageBlob);
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'x-company-id': 'demo' },
        body: formData,
      });
      setScanResult(await res.json());
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 text-center border-b border-white/10">
        <h1 className="text-2xl font-bold">
          <span className="text-[var(--color-accent)]">Skill</span>Snap
        </h1>
        <p className="text-sm text-white/60 mt-1">AI-powered guidance from your company SOPs</p>
      </header>
      <main className="flex-1 p-4">
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
