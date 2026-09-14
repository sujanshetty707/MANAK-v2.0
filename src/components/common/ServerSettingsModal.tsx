import React, { useState, useEffect } from 'react';
import { X, Server, Key, CheckCircle2, AlertTriangle, RefreshCw, Smartphone, Globe } from 'lucide-react';
import { getApiBaseUrl } from '../../services/api';
import { getGeminiApiKey } from '../../services/clientGeminiVision';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ServerSettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [serverUrl, setServerUrl] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setServerUrl(localStorage.getItem('MANAK_SERVER_URL') || getApiBaseUrl());
      setApiKey(localStorage.getItem('MANAK_GEMINI_KEY') || getGeminiApiKey());
      setStatus('idle');
      setStatusMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setStatus('testing');
    setStatusMsg('Pinging backend server /api/health...');
    try {
      const urlToTest = serverUrl.trim().replace(/\/+$/, '');
      const res = await fetch(`${urlToTest}/api/health`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        setStatus('success');
        setStatusMsg(`Connected! Backend: ${data.service || 'MANAK Backend'}`);
      } else {
        setStatus('error');
        setStatusMsg(`HTTP ${res.status}: Backend returned an error.`);
      }
    } catch (e) {
      setStatus('error');
      setStatusMsg('Cannot connect to backend server. Mobile direct client-side AI will be used.');
    }
  };

  const handleSave = () => {
    if (serverUrl.trim()) {
      localStorage.setItem('MANAK_SERVER_URL', serverUrl.trim().replace(/\/+$/, ''));
    } else {
      localStorage.removeItem('MANAK_SERVER_URL');
    }

    if (apiKey.trim()) {
      localStorage.setItem('MANAK_GEMINI_KEY', apiKey.trim());
    } else {
      localStorage.removeItem('MANAK_GEMINI_KEY');
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 text-white shadow-2xl space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">App Connection &amp; AI Settings</h2>
            <p className="text-xs text-slate-400">Configure Mobile APK server connection &amp; Gemini AI key</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Server URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                Backend Server URL
              </span>
              <span className="text-[10px] text-slate-500">e.g. http://192.168.1.109:5000</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={serverUrl}
                onChange={e => setServerUrl(e.target.value)}
                placeholder="http://localhost:5000 or http://YOUR_IP:5000"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={status === 'testing'}
                className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-xl border border-slate-700 flex items-center gap-1 active:scale-95 transition-all"
              >
                {status === 'testing' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Test'}
              </button>
            </div>
          </div>

          {/* Test connection status badge */}
          {statusMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                status === 'success'
                  ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                  : status === 'error'
                  ? 'bg-amber-950/70 border-amber-500/40 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              {status === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              )}
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Gemini API Key */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                Gemini Vision API Key (Direct Mobile AI)
              </span>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Paste Gemini API Key"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Used automatically on mobile when backend is offline or unreachable.
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-xs font-bold rounded-xl text-slate-950 shadow-lg"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
