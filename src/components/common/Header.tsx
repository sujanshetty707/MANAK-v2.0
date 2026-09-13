import React from 'react';
import { useApp } from '../../context/AppContext';
import { ChevronLeft, Shield, Bell, WifiOff } from 'lucide-react';

export const Header: React.FC<{
  title?: string;
  showBack?: boolean;
  showOfficerBadge?: boolean;
  showConsumerBadge?: boolean;
  showLogo?: boolean;
}> = ({ title, showBack = false, showOfficerBadge = false, showConsumerBadge = false, showLogo = true }) => {
  const { goBack, officerProfile, consumerProfile, isOffline, userRole, navigateTo } = useApp();

  return (
    <header className="bg-[#1B3A6B] text-white pt-[calc(max(14px,env(safe-area-inset-top,0px))+6px)] pb-3 px-3.5 sm:px-4 shadow-md flex-shrink-0 relative z-20 transition-all">
      <div className="flex items-center justify-between">
        {/* Left Side: Back Button or Profile Avatar */}
        <div className="flex items-center space-x-2.5">
          {showBack && (
            <button
              onClick={goBack}
              className="p-1.5 -ml-1 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-colors"
              title="Go back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {showOfficerBadge && (
            <div className="flex items-center space-x-2.5">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-700 border-2 border-white/80 flex items-center justify-center font-bold text-white shadow-sm text-sm">
                  {officerProfile.avatar}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#2A9D5C] border-2 border-[#1B3A6B] rounded-full"></span>
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[11px] uppercase tracking-wider text-blue-200 font-semibold mono">
                    {officerProfile.name}
                  </span>
                  <span className="bg-[#2A9D5C]/25 border border-[#2A9D5C]/60 text-[#2A9D5C] text-[8.5px] px-1 py-0.2 rounded font-bold uppercase tracking-tight">
                    Active
                  </span>
                </div>
                <h1 className="text-xs font-bold text-white tracking-tight">
                  Legal Metrology Officer
                </h1>
                <p className="text-[9.5px] text-blue-200/80 mono">{officerProfile.zone}</p>
              </div>
            </div>
          )}

          {showConsumerBadge && (
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-full bg-emerald-600/90 border border-white/50 flex items-center justify-center font-bold text-white text-xs shadow-sm">
              {(consumerProfile.name?.charAt(0) || 'C').toUpperCase()}{(consumerProfile.name?.split(' ')[1]?.charAt(0) || 'U').toUpperCase()}
              </div>
              <div>
                <span className="text-[10px] uppercase text-emerald-200 font-semibold tracking-wider block">
                  Citizen Portal
                </span>
                <span className="text-xs font-bold text-white">{consumerProfile.name || 'Citizen User'}</span>
              </div>
            </div>
          )}

          {!showOfficerBadge && !showConsumerBadge && title && (
            <h1 className="text-sm font-bold text-white tracking-wide truncate max-w-[210px]">{title}</h1>
          )}
        </div>

        {/* Right Side: Network Badge, Logo Emblem, Notification Icon */}
        <div className="flex items-center space-x-2">
          {isOffline && (
            <span className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[10px] mono font-medium">
              <WifiOff className="w-3 h-3" />
              <span>Offline</span>
            </span>
          )}

          {showLogo && (
            <div
              onClick={() => navigateTo('splash')}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer p-1 flex items-center justify-center border border-white/15 transition-colors"
              title="MANAK Emblem"
            >
              <Shield className="w-5 h-5 text-manak-orange" />
            </div>
          )}

          <button
            onClick={() => {
              if (userRole === 'officer') navigateTo('inspection_history');
              else navigateTo('consumer_my_reports');
            }}
            className="relative p-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/25 border border-white/15 text-white transition-colors"
            title="Notifications & History"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#E8622C] border-2 border-[#1B3A6B] rounded-full"></span>
          </button>
        </div>
      </div>
    </header>
  );
};
