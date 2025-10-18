import React, { useEffect, useState } from 'react';
import { Trainer, User, Branch } from '../types';
import { TrainerItem } from './TrainerItem';
import { UsersIcon, PlusIcon } from './Icons';
import { useDroppable } from '@dnd-kit/core';
import { supabase } from '../lib/supabaseClient';
import { useResponsive } from '../hooks/useResponsive';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface ResponsiveSidebarProps {
  trainers: Trainer[];
  onAddTrainer: () => void;
  onEditTrainer: (trainer: Trainer) => void;
  onDeleteTrainer: (trainerId: string) => void;
  currentUser: User | null;
  branches: Branch[];
  isOpen?: boolean;
  onClose?: () => void;
}

export const ResponsiveSidebar: React.FC<ResponsiveSidebarProps> = ({ 
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
  const { isMobile, isTablet } = useResponsive();

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
      <aside className="hidden lg:block w-80 bg-slate-50 border-l border-slate-200 p-4">
        <div className="text-center text-slate-500 py-8">
          <p>세션이 만료되었습니다.</p>
          <p className="text-sm mt-2">다시 로그인해주세요.</p>
        </div>
      </aside>
    );
  }

  // 트레이너는 본인만 볼 수 있음
  let filteredTrainers = trainers;
  if (currentUser?.role === 'trainer' && currentUser.trainerProfileId) {
    filteredTrainers = trainers.filter(t => t.id === currentUser.trainerProfileId);
  }
  
  const activeTrainers = filteredTrainers.filter(t => t.isActive);
  const inactiveTrainers = filteredTrainers.filter(t => !t.isActive);

  const canAddTrainer = currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager');

  const sidebarContent = (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UsersIcon className="w-5 h-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-800">강사 목록</h2>
        </div>
        {canAddTrainer && (
          <Button onClick={onAddTrainer} size="sm" className="h-8">
            <PlusIcon className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">추가</span>
          </Button>
        )}
      </div>

      <div className="text-sm text-slate-600 bg-blue-50 p-3 rounded-lg">
        <p className="font-medium mb-1">사용 방법:</p>
        <p>활성 강사를 프로그램에 드래그하여 배정하거나, 아래 목록으로 옮겨 비활성화하세요.</p>
      </div>

      {/* 활성 강사 섹션 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            활성 강사
            <Badge variant="default" className="text-xs">
              {activeTrainers.length}명
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div 
            ref={setActiveRef}
            className={`min-h-[120px] p-3 rounded-lg border-2 border-dashed transition-colors ${
              isOverActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-slate-200 bg-slate-50'
            }`}
          >
            {activeTrainers.length === 0 ? (
              <div className="text-center text-slate-500 py-8">
                <p className="text-sm">활성 강사가 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeTrainers.map(trainer => (
                  <TrainerItem
                    key={trainer.id}
                    trainer={trainer}
                    onEdit={onEditTrainer}
                    onDelete={onDeleteTrainer}
                    branches={branches}
                    currentUser={currentUser}
                    isCompact={isMobile || isTablet}
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 비활성 강사 섹션 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            비활성 강사
            <Badge variant="secondary" className="text-xs">
              {inactiveTrainers.length}명
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div 
            ref={setInactiveRef}
            className={`min-h-[120px] p-3 rounded-lg border-2 border-dashed transition-colors ${
              isOverInactive 
                ? 'border-red-400 bg-red-50' 
                : 'border-slate-200 bg-slate-50'
            }`}
          >
            {inactiveTrainers.length === 0 ? (
              <div className="text-center text-slate-500 py-8">
                <p className="text-sm">활성 강사를 이곳으로 드래그하세요.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {inactiveTrainers.map(trainer => (
                  <TrainerItem
                    key={trainer.id}
                    trainer={trainer}
                    onEdit={onEditTrainer}
                    onDelete={onDeleteTrainer}
                    branches={branches}
                    currentUser={currentUser}
                    isCompact={isMobile || isTablet}
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // 모바일에서는 Sheet 사용
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
        <SheetContent side="right" className="w-full sm:w-80">
          <SheetHeader>
            <SheetTitle>강사 목록</SheetTitle>
            <SheetDescription>
              활성 강사를 프로그램에 드래그하여 배정하거나, 아래 목록으로 옮겨 비활성화하세요.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            {sidebarContent}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // 태블릿에서는 반응형 너비
  if (isTablet) {
    return (
      <aside className="w-72 bg-slate-50 border-l border-slate-200 p-4">
        {sidebarContent}
      </aside>
    );
  }

  // 데스크톱에서는 더 넓은 너비
  return (
    <aside className="w-80 bg-slate-50 border-l border-slate-200 p-4">
      {sidebarContent}
    </aside>
  );
};
