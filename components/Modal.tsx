

import React, { ReactNode, useEffect } from 'react';
import { XIcon } from './Icons';
import { useResponsive } from '../hooks/useResponsive';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | string;
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
  closeOnOverlayClick = false
}) => {
  const { isMobile } = useResponsive();
  const [isVisible, setIsVisible] = React.useState(false);

  // 모달이 열릴 때 body 스크롤 방지 및 애니메이션 처리
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // 모달이 열릴 때 약간의 지연 후 애니메이션 시작
      setTimeout(() => setIsVisible(true), 10);
    } else {
      // 모달이 닫힐 때 애니메이션 후 완전히 제거
      setIsVisible(false);
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  // 모달이 완전히 닫힌 후 DOM에서 제거
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        // 모달이 닫힌 후 body 스크롤 복원 확인
        document.body.style.overflow = 'unset';
      }, 300); // 애니메이션 시간과 동일
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getMaxWidthClass = () => {
    // maxWidth가 문자열로 직접 전달된 경우 (예: "max-w-4xl")
    if (typeof maxWidth === 'string' && maxWidth.startsWith('max-w-')) {
      return maxWidth;
    }
    
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
      handleClose();
    }
  };

  const handleClose = () => {
    // 모달 닫기 시 애니메이션 시작
    setIsVisible(false);
    // 애니메이션 완료 후 실제 닫기
    setTimeout(() => {
      onClose();
      // 모바일에서 확실하게 정리
      document.body.style.overflow = 'unset';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.bottom = '';
    }, 300);
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex justify-center items-center p-4 transition-all duration-300 ${
        isVisible 
          ? 'bg-black bg-opacity-50' 
          : 'bg-transparent'
      }`}
      onClick={handleOverlayClick}
      style={{
        // 모바일에서 오버레이가 확실히 제거되도록 강제
        backgroundColor: isVisible ? 'rgba(0, 0, 0, 0.5)' : 'transparent',
        // 모바일에서 터치 이벤트 처리 개선
        touchAction: 'none',
        // 모바일에서 스크롤 방지 강화
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%'
      }}
    >
      <div 
        className={`bg-white rounded-lg shadow-strong w-full transition-all duration-300 ${
          isVisible 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-95'
        } ${getMaxWidthClass()} ${
          isMobile ? 'max-h-[90vh] overflow-y-auto' : 'max-h-[80vh] overflow-y-auto'
        }`} 
        onClick={(e) => e.stopPropagation()}
        style={{
          // 모바일에서 터치 이벤트 처리
          touchAction: 'auto',
          // 모바일에서 스크롤 개선
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div className={`${isMobile ? 'p-4' : 'p-6'} border-b flex justify-between items-center sticky top-0 bg-white rounded-t-lg`}>
          <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-slate-800`}>{title}</h2>
          {showCloseButton && (
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
              aria-label="모달 닫기"
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