import React, { useRef, useState, useCallback, useEffect } from 'react';

interface Props { onCapture: (blob: Blob) => void; isScanning: boolean; }

export function CameraView({ onCapture, isScanning }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setHasCamera(true);
      setCameraError(null);
    } catch {
      setHasCamera(false);
      setCameraError('Camera not available — use file upload instead');
    }
  }, []);

  useEffect(() => { startCamera(); }, [startCamera]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current, c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d')?.drawImage(v, 0, 0);
    c.toBlob(b => { if (b) onCapture(b); }, 'image/jpeg', 0.85);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onCapture(file);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {hasCamera && !cameraError ? (
        <>
          <div className="relative w-full max-w-md aspect-[3/4] rounded-xl overflow-hidden bg-black">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            {isScanning && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center flex-col gap-3">
                <div className="animate-spin w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full" />
                <p className="text-amber-400 font-medium animate-pulse">Analyzing workplace...</p>
              </div>
            )}
          </div>
          <button onClick={capturePhoto} disabled={isScanning}
            className="w-20 h-20 rounded-full bg-amber-400 border-4 border-white/30 disabled:opacity-50 active:scale-95 transition-transform shadow-lg" />
          <canvas ref={canvasRef} className="hidden" />
        </>
      ) : (
        <div className="w-full max-w-md">
          {preview && (
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-black mb-4">
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              {isScanning && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center flex-col gap-3">
                  <div className="animate-spin w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full" />
                  <p className="text-amber-400 font-medium animate-pulse">Analyzing workplace...</p>
                </div>
              )}
            </div>
          )}
          <label className="block w-full py-6 bg-amber-400/20 border-2 border-dashed border-amber-400/50 rounded-xl text-center cursor-pointer hover:bg-amber-400/30 transition-colors">
            <span className="text-4xl block mb-2">📸</span>
            <span className="font-bold text-amber-400">Upload a photo</span>
            <span className="block text-sm text-white/50 mt-1">Take a photo of your work area</span>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
              onChange={handleFileUpload} className="hidden" disabled={isScanning} />
          </label>
        </div>
      )}
      <p className="text-sm text-white/50 text-center max-w-xs">
        {hasCamera ? 'Point camera at work area and tap to get guidance.' : 'Upload a photo of your work area to get AI-powered job planning guidance.'}
      </p>
    </div>
  );
}
