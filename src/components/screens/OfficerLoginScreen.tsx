import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../common/Header';
import { Lock, KeyRound, Fingerprint, ShieldCheck, ArrowRight, User } from 'lucide-react';

export const OfficerLoginScreen: React.FC = () => {
  const { loginOfficer, officerProfile } = useApp();
  const [badgeId, setBadgeId] = useState('LM-DL-2024-8849');
  const [password, setPassword] = useState('SecurePass@2026');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      loginOfficer(badgeId, password);
    }, 400);
  };

  return (
    <div className="w-full h-full bg-[#F5F6F8] flex flex-col justify-between overflow-y-auto hide-scrollbar">
      <Header title="Officer Authentication" showBack showLogo />

      <main className="p-4 space-y-4 my-auto">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-manak-navy text-white mx-auto flex items-center justify-center shadow-md">
            <Lock className="w-6 h-6 text-manak-orange" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Enforcement Portal Login</h2>
          <p className="text-xs text-slate-500">Authorized Legal Metrology Officials Only</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3.5">
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Government / Employee ID
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={badgeId}
                onChange={e => setBadgeId(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 font-mono focus:outline-none focus:border-manak-navy"
                placeholder="e.g. LM-DL-2024-8849"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Portal Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 font-mono focus:outline-none focus:border-manak-navy"
                placeholder="Enter password"
              />
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-manak-navy" />
              <div>
                <span className="font-semibold text-slate-900 block text-[11px]">{officerProfile.name}</span>
                <span className="text-[9.5px] text-slate-500 mono">{officerProfile.zone}</span>
              </div>
            </div>
            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded mono">
              Verified DSC
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-manak-navy hover:bg-slate-900 active:scale-98 text-white font-semibold text-xs tracking-wider uppercase flex items-center justify-center space-x-2 shadow-md transition-all"
          >
            <span>{loading ? 'Authenticating...' : 'Access Enforcement Terminal'}</span>
            <ArrowRight className="w-4 h-4 text-manak-orange" />
          </button>
        </form>

        {/* Biometric Quick Login */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => loginOfficer(badgeId, password)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-xs font-medium transition-colors"
          >
            <Fingerprint className="w-4 h-4 text-manak-navy" />
            <span>Quick Login with Biometric / Smart Token</span>
          </button>
        </div>
      </main>

      <footer className="p-4 pb-[max(16px,env(safe-area-inset-bottom,0px))] text-center">
        <p className="text-[10px] text-slate-400 mono">
          Secured by NIC & National Informatics Centre Infrastructure
        </p>
      </footer>
    </div>
  );
};
