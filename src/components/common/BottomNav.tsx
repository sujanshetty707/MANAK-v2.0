import React from 'react';
import { useApp } from '../../context/AppContext';
import { LayoutDashboard, Camera, Link2, Clock, Bot, Home, FileCheck, Inbox, UserCircle } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { userRole, activeScreen, navigateTo, consumerReports } = useApp();
  const pendingGrievances = consumerReports.length;

  if (!userRole) return null;

  if (userRole === 'officer') {
    const navItems = [
      { id: 'officer_dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'scan_camera', label: 'Scan Label', icon: Camera, primary: true },
      { id: 'check_url', label: 'Check URL', icon: Link2 },
      { id: 'inspection_history', label: 'History', icon: Clock },
      { id: 'officer_profile', label: 'More', icon: UserCircle, badge: pendingGrievances },
    ];

    return (
      <nav className="bg-white border-t border-slate-200/90 pt-2 pb-[calc(max(10px,env(safe-area-inset-bottom,0px))+4px)] px-2 sm:px-4 flex items-center justify-around shadow-nav relative z-20 flex-shrink-0 transition-all">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;

          if (item.primary) {
            return (
              <button
                key={item.id}
                onClick={() => navigateTo('scan_camera')}
                className="relative -top-3.5 flex flex-col items-center group"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-manak-navy to-blue-800 text-white flex items-center justify-center shadow-lg border-2 border-white transition-transform active:scale-95 group-hover:shadow-xl">
                  <Icon className="w-5 h-5 text-manak-orange" />
                </div>
                <span className="text-[9.5px] font-bold text-manak-navy mt-0.5">Scan Label</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id as any)}
              className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors ${
                isActive ? 'text-manak-navy font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4px] text-manak-navy' : 'stroke-[1.7px]'}`} />
                {(item as any).badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-manak-orange rounded-full text-white text-[8px] font-extrabold flex items-center justify-center">
                    {(item as any).badge > 9 ? '9+' : (item as any).badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
              {isActive && <span className="w-1 h-1 rounded-full bg-manak-orange mt-0.5" />}
            </button>
          );
        })}
      </nav>
    );
  }

  // Consumer Nav
  const consumerNavItems = [
    { id: 'consumer_dashboard', label: 'Home', icon: Home },
    { id: 'consumer_check', label: 'Check Product', icon: Camera, primary: true },
    { id: 'consumer_my_reports', label: 'My Reports', icon: FileCheck },
  ];

  return (
    <nav className="bg-white border-t border-slate-200/90 pt-2 pb-[calc(max(10px,env(safe-area-inset-bottom,0px))+4px)] px-6 flex items-center justify-around shadow-nav relative z-20 flex-shrink-0 transition-all">
      {consumerNavItems.map(item => {
        const Icon = item.icon;
        const isActive = activeScreen === item.id;

        if (item.primary) {
          return (
            <button
              key={item.id}
              onClick={() => navigateTo('consumer_check')}
              className="relative -top-4 flex flex-col items-center group"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-700 to-manak-green text-white flex items-center justify-center shadow-lg border-2 border-white transition-transform active:scale-95 group-hover:scale-105">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-bold text-emerald-800 mt-0.5">Check Label</span>
            </button>
          );
        }

        return (
          <button
            key={item.id}
            onClick={() => navigateTo(item.id as any)}
            className={`flex flex-col items-center py-1 px-3 rounded-lg transition-colors ${
              isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4px] text-emerald-700' : 'stroke-[1.7px]'}`} />
            <span className={`text-[10px] mt-0.5 ${isActive ? 'font-bold' : 'font-medium'}`}>
              {item.label}
            </span>
            {isActive && <span className="w-1 h-1 rounded-full bg-emerald-600 mt-0.5"></span>}
          </button>
        );
      })}
    </nav>
  );
};
