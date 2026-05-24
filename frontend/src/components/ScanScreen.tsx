import React, { useRef, useState, useCallback, useEffect } from 'react';
import { api } from '../api';

interface Props { onComplete: (result: any) => void; onBack: () => void; }

export function ScanScreen({ onComplete, onBack }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanPhase, setScanPhase] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setHasCamera(true);
    } catch {
      setHasCamera(false);
    }
  }, []);

  useEffect(() => { startCamera(); return () => {
    if (videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
  }; }, [startCamera]);

  const doScan = async (blob: Blob) => {
    setScanning(true);
    setError('');
    const phases = ['Analyzing scene...', 'Identifying hazards...', 'Searching SOPs...', 'Generating guidance...'];
    let i = 0;
    const interval = setInterval(() => { setScanPhase(phases[Math.min(i++, phases.length - 1)]); }, 3500);
    setScanPhase(phases[0]);
    try {
      const result = await api.scan(blob);
      onComplete(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      clearInterval(interval);
      setScanning(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current, c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d')?.drawImage(v, 0, 0);
    c.toBlob(b => { if (b) { setPreview(c.toDataURL()); doScan(b); } }, 'image/jpeg', 0.85);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    doScan(file);
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <button onClick={onBack} className="text-white/40 text-sm mb-4 hover:text-white/60 transition">← Back</button>

      <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-black/50 border border-white/[0.06]">
        {scanning && preview ? (
          <div className="absolute inset-0">
            <img src={preview} alt="" className="w-full h-full object-cover opacity-40" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {/* Scanning animation */}
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 border-2 border-amber-400/40 rounded-full animate-ping" />
                <div className="absolute inset-2 border-2 border-amber-400/60 rounded-full animate-pulse" />
                <div className="absolute inset-4 border-2 border-amber-400 rounded-full animate-spin" style={{animationDuration:'3s',borderTopColor:'transparent'}} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl">🔍</span>
                </div>
              </div>
              <p className="text-amber-400 font-semibold text-lg animate-pulse">{scanPhase}</p>
              <p className="text-white/30 text-sm mt-2">AI is analyzing your workspace</p>
              {/* Scan line animation */}
              <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-bounce" style={{top:'30%',animationDuration:'2s'}} />
            </div>
          </div>
        ) : hasCamera ? (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-6">
            <label className="cursor-pointer text-center group">
              <div className="w-20 h-20 rounded-2xl bg-amber-400/10 border-2 border-dashed border-amber-400/30 flex items-center justify-center mb-4 group-hover:bg-amber-400/20 transition mx-auto">
                <span className="text-3xl">📸</span>
              </div>
              <p className="font-bold text-amber-400">Upload a Photo</p>
              <p className="text-white/40 text-sm mt-1">Take a photo of your work area</p>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
            </label>
          </div>
        )}

        {/* Corner brackets */}
        {!scanning && hasCamera && (
          <>
            <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-amber-400/60 rounded-tl-lg" />
            <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-amber-400/60 rounded-tr-lg" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-amber-400/60 rounded-bl-lg" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-amber-400/60 rounded-br-lg" />
          </>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}

      {hasCamera && !scanning && (
        <div className="flex flex-col items-center mt-6 gap-3">
          <button onClick={capturePhoto}
            className="w-20 h-20 rounded-full bg-gradient-to-b from-amber-400 to-orange-500 border-4 border-white/20 active:scale-95 transition-transform shadow-lg shadow-amber-400/20 hover:shadow-amber-400/40">
            <div className="w-full h-full rounded-full border-2 border-black/20" />
          </button>
          <p className="text-white/30 text-xs">Tap to scan your workspace</p>
        </div>
      )}

      {!hasCamera && !scanning && (
        <div className="mt-4">
          <label className="block w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl text-center text-black font-bold cursor-pointer active:scale-[0.98] transition">
            Upload Photo
            <input type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
          </label>
        </div>
      )}
    </div>
  );
}
