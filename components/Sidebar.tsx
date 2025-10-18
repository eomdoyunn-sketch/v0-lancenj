import React, { useEffect, useState } from 'react';
import { Trainer, User, Branch } from '../types';
import { TrainerItem } from './TrainerItem';
import { UsersIcon, PlusIcon, XIcon } from './Icons';
import { useDroppable } from '@dnd-kit/core';
import { supabase } from '../lib/supabaseClient';
import { useResponsive } from '../hooks/useResponsive';
import { usePermissions } from '../hooks/usePermissions';
import { PermissionGuard } from './PermissionGuard';

interface SidebarProps {
  trainers: Trainer[];
  onAddTrainer: () => void;
  onEditTrainer: (trainer: Trainer) => void;
  onDeleteTrainer: (trainerId: string) => void;
  currentUser: User | null;
  branches: Branch[];
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  trainers, 
  onAddTrainer, 
  onEditTrainer, 
  onDeleteTrainer, 
  currentUser, 
  branches, 
  isOpen = true, 
  onClose 
}) => {
  const [isSessionValid, setIsSessionValid] = useState(true);
  const { isMobile } = useResponsive();
  const permissions = usePermissions();

  // 모든 훅을 먼저 호출
  const { setNodeRef: setActiveRef, isOver: isOverActive } = useDroppable({ id: 'active-droppable' });
  const { setNodeRef: setInactiveRef, isOver: isOverInactive } = useDroppable({ id: 'inactive-droppable' });

  // 세션 유효성 검증
  useEffect(() => {
    const checkSessionValidity = async () => {
      if (!currentUser) {
        setIsSessionValid(false);
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session?.user) {
          console.log('세션이 유효하지 않습니다. 권한을 제한합니다.');
          setIsSessionValid(false);
          return;
        }

        // 세션의 사용자 ID와 현재 사용자 ID가 일치하는지 확인
        if (session.user.id !== currentUser.id) {
          console.log('세션 사용자와 현재 사용자가 일치하지 않습니다.');
          setIsSessionValid(false);
          return;
        }

        setIsSessionValid(true);
      } catch (error) {
        console.error('세션 검증 중 오류:', error);
        setIsSessionValid(false);
      }
    };

    checkSessionValidity();
  }, [currentUser]);

  // 세션이 유효하지 않으면 빈 컴포넌트 반환
  if (!isSessionValid || !currentUser) {
    return (
      <aside className={`${isMobile ? 'fixed inset-y-0 right-0 w-72 bg-white shadow-strong z-50' : 'w-72 bg-slate-50 border-l border-slate-200'} p-4 flex flex-col gap-6`}>
        <div className="text-center text-slate-500 py-8">
          <p>세션이 만료되었습니다.</p>
          <p className="text-sm mt-2">다시 로그인해주세요.</p>
        </div>
      </aside>
    );
  }

  // 트레이너는 본인만 볼 수 있음
  let filteredTrainers = trainers;
  if (permissions.isTrainer() && currentUser?.trainerProfileId) {
    filteredTrainers = trainers.filter(t => t.id === currentUser.trainerProfileId);
  }
  
  const activeTrainers = filteredTrainers.filter(t => t.isActive);
  const inactiveTrainers = filteredTrainers.filter(t => !t.isActive);

  const canAddTrainer = permissions.canManageTrainers();

  const sidebarClasses = isMobile 
    ? `fixed inset-y-0 right-0 w-72 bg-white shadow-strong z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`
    : 'w-72 bg-slate-50 border-l border-slate-200';

  return (
    <>
      {/* 모바일 오버레이 */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}
      
      <aside className={`${sidebarClasses} p-4 flex flex-col gap-6`}>
        {/* 모바일 헤더 */}
        {isMobile && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">강사 목록</h2>
            <button 
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-100"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        )}
        
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                  <UsersIcon className="w-5 h-5 text-slate-500"/>
                  <h2 className="text-lg font-bold text-slate-800 hidden sm:block">강사 목록</h2>
              </div>
              <PermissionGuard requiredPermission={() => permissions.canManageTrainers()}>
                <button onClick={onAddTrainer} className="p-1.5 text-slate-500 hover:text-blue-600 rounded-full hover:bg-slate-200">
                    <PlusIcon className="w-5 h-5"/>
                </button>
              </PermissionGuard>
          </div>
          <p className="text-sm text-slate-500 mb-4">활성 강사를 프로그램에 드래그하여 배정하거나, 아래 목록으로 옮겨 비활성화하세요.</p>
          
          <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">활성 강사</h3>
               <div ref={setActiveRef} className={`p-2 rounded-lg transition-colors min-h-[60px] space-y-2 ${isOverActive ? 'bg-green-100' : ''}`}>
                  {activeTrainers.map(trainer => (
                      <TrainerItem 
                          key={trainer.id} 
                          trainer={trainer} 
                          onEdit={() => onEditTrainer(trainer)}
                          onDelete={() => onDeleteTrainer(trainer.id)}
                          currentUser={currentUser}
                          branches={branches}
                      />
                  ))}
                  {activeTrainers.length === 0 && <p className="text-center text-xs text-slate-400 py-4">비활성 강사를 이곳으로 드래그하세요.</p>}
              </div>
          </div>
           <div className="space-y-2 mt-6">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">비활성 강사</h3>
              <div ref={setInactiveRef} className={`p-2 rounded-lg transition-colors min-h-[60px] space-y-2 ${isOverInactive ? 'bg-red-100' : ''}`}>
                  {inactiveTrainers.map(trainer => (
                      <TrainerItem 
                          key={trainer.id} 
                          trainer={trainer}
                          onEdit={() => onEditTrainer(trainer)}
                          onDelete={() => onDeleteTrainer(trainer.id)}
                          currentUser={currentUser}
                          branches={branches}
                      />
                  ))}
                  {inactiveTrainers.length === 0 && <p className="text-center text-xs text-slate-400 py-4">활성 강사를 이곳으로 드래그하세요.</p>}
              </div>
          </div>
        </div>
      </aside>
    </>
  );
};
