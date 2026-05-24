import React, { useRef, useState, useCallback, useEffect } from 'react';

interface Props { onCapture: (blob: Blob) => void; isScanning: boolean; }

export function CameraView({ onCapture, isScanning }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch { setCameraError('Camera access denied.'); }
  }, []);

  useEffect(() => { startCamera(); }, [startCamera]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current, c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d')?.drawImage(v, 0, 0);
    c.toBlob(b => { if (b) onCapture(b); }, 'image/jpeg', 0.85);
  };

  if (cameraError) return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <p className="text-[var(--color-accent)] mb-4">{cameraError}</p>
      <button onClick={startCamera} className="px-6 py-3 bg-[var(--color-accent)] rounded-lg font-bold">Retry</button>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-md aspect-[3/4] rounded-xl overflow-hidden bg-black">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        {isScanning && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="animate-spin w-12 h-12 border-4 border-[var(--color-accent)] border-t-transparent rounded-full" />
          </div>
        )}
      </div>
      <button onClick={capturePhoto} disabled={isScanning}
        className="w-20 h-20 rounded-full bg-[var(--color-accent)] border-4 border-white/30 disabled:opacity-50 active:scale-95 transition-transform shadow-lg" />
      <canvas ref={canvasRef} className="hidden" />
      <p className="text-sm text-white/50 text-center max-w-xs">
        Point camera at work area and tap to get guidance.
      </p>
    </div>
  );
}
