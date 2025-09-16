

import React, { ReactNode, useEffect } from 'react';
import { XIcon } from './Icons';
import { useResponsive } from '../hooks/useResponsive';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = "md",
  showCloseButton = true,
  closeOnOverlayClick = true
}) => {
  const { isMobile } = useResponsive();

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // 모달이 열릴 때 body 스크롤 방지
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getMaxWidthClass = () => {
    switch (maxWidth) {
      case 'sm':
        return 'max-w-sm';
      case 'md':
        return 'max-w-md';
      case 'lg':
        return 'max-w-lg';
      case 'xl':
        return 'max-w-xl';
      case '2xl':
        return 'max-w-2xl';
      case 'full':
        return 'max-w-full';
      default:
        return 'max-w-md';
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" 
      onClick={handleOverlayClick}
    >
      <div 
        className={`bg-white rounded-lg shadow-strong w-full ${getMaxWidthClass()} ${
          isMobile ? 'max-h-[90vh] overflow-y-auto' : 'max-h-[80vh] overflow-y-auto'
        }`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`${isMobile ? 'p-4' : 'p-6'} border-b flex justify-between items-center sticky top-0 bg-white rounded-t-lg`}>
          <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-slate-800`}>{title}</h2>
          {showCloseButton && (
            <button 
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
          {children}
        </div>
      </div>
    </div>
  );
};