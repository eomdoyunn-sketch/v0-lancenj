import React from 'react';
import { User, View } from '../types';
import { BarChartIcon, DumbbellIcon, UsersIcon, FileTextIcon, SettingsIcon, LogOutIcon } from './Icons';

interface HeaderProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  currentUser: User | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView, currentUser, onLogout }) => {
  const baseButtonClass = "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors";
  const activeButtonClass = "bg-blue-600 text-white";
  const inactiveButtonClass = "bg-white text-slate-700 hover:bg-slate-100";

  return (
    <header className="bg-white shadow-md p-4 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-800">
          LANCE & J<sup className="text-xs">®</sup>
        </h1>
      </div>
      <div className="flex items-center gap-2 p-1 bg-slate-200 rounded-lg">
        <button 
          onClick={() => setCurrentView('programs')}
          className={`${baseButtonClass} ${currentView === 'programs' ? activeButtonClass : inactiveButtonClass}`}
        >
          <DumbbellIcon className="h-5 w-5" />
          프로그램 관리
        </button>
        <button 
          onClick={() => setCurrentView('members')}
          className={`${baseButtonClass} ${currentView === 'members' ? activeButtonClass : inactiveButtonClass}`}
        >
          <UsersIcon className="h-5 w-5" />
          회원 관리
        </button>
        <button 
          onClick={() => setCurrentView('dashboard')}
          className={`${baseButtonClass} ${currentView === 'dashboard' ? activeButtonClass : inactiveButtonClass}`}
        >
          <BarChartIcon className="h-5 w-5" />
          대시보드
        </button>
        {currentUser && !['trainer'].includes(currentUser.role) && (
         <button 
          onClick={() => setCurrentView('logs')}
          className={`${baseButtonClass} ${currentView === 'logs' ? activeButtonClass : inactiveButtonClass}`}
        >
          <FileTextIcon className="h-5 w-5" />
          로그 관리
        </button>
        )}
        {currentUser && !['trainer'].includes(currentUser.role) && (
        <button 
          onClick={() => setCurrentView('management')}
          className={`${baseButtonClass} ${currentView === 'management' ? activeButtonClass : inactiveButtonClass}`}
        >
          <SettingsIcon className="h-5 w-5" />
          설정 관리
        </button>
        )}
      </div>
       <div className="flex items-center gap-4">
        <div className="text-right">
            <p className="text-sm font-semibold text-slate-800">{currentUser?.name}</p>
            <p className="text-xs text-slate-500">{currentUser?.email}</p>
        </div>
        <button onClick={onLogout} title="로그아웃" className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-100">
            <LogOutIcon className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};