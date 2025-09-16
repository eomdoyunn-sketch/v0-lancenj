import React, { useState } from 'react';
import { User, View } from '../types';
import { BarChartIcon, DumbbellIcon, UsersIcon, FileTextIcon, SettingsIcon, LogOutIcon, MenuIcon, XIcon } from './Icons';
import { useResponsive } from '../hooks/useResponsive';

interface HeaderProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  currentUser: User | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView, currentUser, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isMobile } = useResponsive();
  
  const baseButtonClass = "flex items-center gap-2 px-3 py-2 sm:px-4 rounded-md text-sm font-medium transition-colors";
  const activeButtonClass = "bg-blue-600 text-white";
  const inactiveButtonClass = "bg-white text-slate-700 hover:bg-slate-100";
  
  const navigationItems = [
    { id: 'programs', label: '프로그램 관리', icon: DumbbellIcon, show: true },
    { id: 'members', label: '회원 관리', icon: UsersIcon, show: true },
    { id: 'dashboard', label: '대시보드', icon: BarChartIcon, show: true },
    { id: 'logs', label: '로그 관리', icon: FileTextIcon, show: currentUser && !['trainer'].includes(currentUser.role) },
    { id: 'management', label: '설정 관리', icon: SettingsIcon, show: currentUser && !['trainer'].includes(currentUser.role) },
  ].filter(item => item.show);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavigation = (view: View) => {
    setCurrentView(view);
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className="bg-white shadow-md p-4">
      {/* 데스크톱 헤더 */}
      <div className="hidden sm:flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            LANCE & J<sup className="text-xs">®</sup>
          </h1>
        </div>
        
        <div className="flex items-center gap-2 p-1 bg-slate-200 rounded-lg">
          {navigationItems.map(({ id, label, icon: Icon }) => (
            <button 
              key={id}
              onClick={() => handleNavigation(id as View)}
              className={`${baseButtonClass} ${currentView === id ? activeButtonClass : inactiveButtonClass}`}
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden lg:inline">{label}</span>
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-800">{currentUser?.name}</p>
            <p className="text-xs text-slate-500">{currentUser?.email}</p>
          </div>
          <button 
            onClick={onLogout} 
            title="로그아웃" 
            className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-100"
          >
            <LogOutIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 모바일 헤더 */}
      <div className="sm:hidden">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-bold text-slate-800">
            LANCE & J<sup className="text-xs">®</sup>
          </h1>
          
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800">{currentUser?.name}</p>
              <p className="text-xs text-slate-500">{currentUser?.email}</p>
            </div>
            <button 
              onClick={toggleMobileMenu}
              className="p-2 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-100"
            >
              {isMobileMenuOpen ? (
                <XIcon className="w-5 h-5" />
              ) : (
                <MenuIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
        
        {/* 모바일 메뉴 */}
        {isMobileMenuOpen && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex flex-col space-y-2">
              {navigationItems.map(({ id, label, icon: Icon }) => (
                <button 
                  key={id}
                  onClick={() => handleNavigation(id as View)}
                  className={`${baseButtonClass} w-full justify-start ${currentView === id ? activeButtonClass : inactiveButtonClass}`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
              <button 
                onClick={onLogout} 
                className="flex items-center gap-2 px-3 py-2 w-full text-left text-slate-700 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <LogOutIcon className="h-5 w-5" />
                로그아웃
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};