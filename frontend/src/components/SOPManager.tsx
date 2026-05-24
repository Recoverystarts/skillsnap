import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';

interface Props { onBack: () => void; }

export function SOPManager({ onBack }: Props) {
  const [sops, setSOPs] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const loadSOPs = async () => {
    try {
      const data = await api.listSOPs();
      setSOPs(data.documents || []);
    } catch {}
  };

  useEffect(() => { loadSOPs(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage('');
    try {
      await api.uploadSOP(file);
      setMessage('SOP uploaded and indexed successfully!');
      loadSOPs();
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto space-y-5">
      <button onClick={onBack} className="text-white/40 text-sm hover:text-white/60 transition">← Back</button>

      <div>
        <h2 className="text-2xl font-bold">Company SOPs</h2>
        <p className="text-white/40 text-sm mt-1">Upload your standard operating procedures for AI-verified guidance</p>
      </div>

      {/* Upload zone */}
      <label className={`block w-full rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
        uploading ? 'border-amber-400/50 bg-amber-400/5' : 'border-white/10 hover:border-amber-400/30 hover:bg-white/[0.02]'
      }`}>
        {uploading ? (
          <div>
            <div className="animate-spin w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-amber-400 font-medium">Processing & embedding...</p>
          </div>
        ) : (
          <>
            <span className="text-4xl block mb-3">📄</span>
            <p className="font-bold text-amber-400">Upload SOP Document</p>
            <p className="text-white/30 text-sm mt-1">.txt files • AI will chunk and index automatically</p>
          </>
        )}
        <input ref={fileRef} type="file" accept=".txt,.pdf,.doc,.docx" onChange={handleUpload} className="hidden" disabled={uploading} />
      </label>

      {message && (
        <p className={`text-sm text-center ${message.includes('success') ? 'text-green-400' : 'text-red-400'}`}>{message}</p>
      )}

      {/* SOP list */}
      {sops.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-white/40 mb-3">Indexed Documents ({sops.length})</h3>
          <div className="space-y-2">
            {sops.map((sop: any) => (
              <div key={sop.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">📄</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{sop.title || sop.file_name}</p>
                  <p className="text-xs text-white/30 mt-0.5">{sop.chunk_count || 0} chunks indexed</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sops.length === 0 && !uploading && (
        <div className="text-center py-10 text-white/20">
          <span className="text-4xl block mb-3">📭</span>
          <p className="font-medium">No SOPs uploaded yet</p>
          <p className="text-sm mt-1">Upload your company procedures to get verified guidance</p>
        </div>
      )}
    </div>
  );
}
