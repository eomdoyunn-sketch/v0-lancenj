import React from 'react';
import { Trainer, User, Branch } from '../types';
import { UserIcon, SettingsIcon, TrashIcon } from './Icons';
import { useDraggable } from '@dnd-kit/core';

interface TrainerItemProps {
  trainer: Trainer;
  onEdit: () => void;
  onDelete: () => void;
  currentUser: User | null;
  branches: Branch[];
}

export const TrainerItem: React.FC<TrainerItemProps> = ({ trainer, onEdit, onDelete, currentUser, branches }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: trainer.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;
  
  const branchMap = new Map(branches.map(b => [b.id, b.name]));

  const canManageTrainer = () => {
    if (!currentUser) return false;
    
    // Admin은 모든 강사 관리 가능
    if (currentUser.role === 'admin') return true;
    
    // Manager는 같은 지점의 강사 관리 가능
    if (currentUser.role === 'manager') {
      return trainer.branchIds.some(branchId => currentUser.assignedBranchIds?.includes(branchId));
    }
    
    // Trainer는 본인 프로필 관리 가능 (이름으로도 확인)
    if (currentUser.role === 'trainer') {
      return trainer.id === currentUser.trainerProfileId || trainer.name === currentUser.name;
    }
    
    return false;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center p-3 rounded-lg gap-3 transition-shadow ${isDragging ? 'shadow-2xl bg-blue-50 z-10' : ''} ${
        trainer.isActive ? 'bg-white hover:bg-slate-50' : 'bg-slate-200 text-slate-500'
      } ${
        // 새로 가입한 강사(모든 지점의 요율이 0%인 경우)에게 하이라이트 효과
        Object.values(trainer.branchRates).every(rate => rate.value === 0) && trainer.isActive ? 'ring-2 ring-blue-400 ring-opacity-50 animate-pulse' : ''
      }`}
    >
      <div 
        {...listeners}
        {...attributes}
        className={`flex items-center gap-3 flex-grow cursor-grab`}
      >
        <div className={`w-8 h-8 rounded-full overflow-hidden ${trainer.isActive ? trainer.color : 'bg-slate-300'}`}>
          {trainer.photoUrl ? (
            <img src={trainer.photoUrl} alt={trainer.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <UserIcon className="h-5 w-5 text-white" />
            </div>
          )}
        </div>
        <div className="flex-grow">
          <p className="font-semibold text-sm text-slate-800">{trainer.name}</p>
          <div className="text-xs text-slate-500">
             {Object.entries(trainer.branchRates).map(([branchId, rate]) => (
                <div key={branchId}>{branchMap.get(branchId) || branchId}: {
                  rate.type === 'percentage'
                  ? `${(rate.value * 100).toFixed(0)}%`
                  : `${rate.value.toLocaleString()}원`
                }</div>
            ))}
          </div>
        </div>
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${trainer.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
      </div>
      <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {/* 톱니 아이콘은 항상 보이게 (본인 정보 수정용) */}
        {canManageTrainer() && (
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(); }} 
            className={`p-1.5 text-slate-500 hover:text-blue-600 rounded-full hover:bg-slate-200 opacity-100 ${
              // 새로 가입한 강사(모든 지점의 요율이 0%인 경우)에게 반짝거림 효과
              Object.values(trainer.branchRates).every(rate => rate.value === 0) && trainer.isActive ? 'animate-pulse bg-blue-100' : ''
            }`}
            title={Object.values(trainer.branchRates).every(rate => rate.value === 0) ? '설정을 완료해주세요!' : '강사 정보 수정'}
          >
            <SettingsIcon className="w-4 h-4"/>
          </button>
        )}
        {/* 쓰레기통 아이콘은 트레이너가 아닌 경우에만 표시 */}
        {canManageTrainer() && currentUser?.role !== 'trainer' && (
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-200 opacity-0 group-hover:opacity-100 transition-opacity">
            <TrashIcon className="w-4 h-4"/>
          </button>
        )}
      </div>
    </div>
  );
};