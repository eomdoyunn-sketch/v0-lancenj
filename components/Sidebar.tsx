import React from 'react';
import { Trainer, User, Branch } from '../types';
import { TrainerItem } from './TrainerItem';
import { UsersIcon, PlusIcon } from './Icons';
import { useDroppable } from '@dnd-kit/core';

interface SidebarProps {
  trainers: Trainer[];
  onAddTrainer: () => void;
  onEditTrainer: (trainer: Trainer) => void;
  onDeleteTrainer: (trainerId: string) => void;
  currentUser: User | null;
  branches: Branch[];
}

export const Sidebar: React.FC<SidebarProps> = ({ trainers, onAddTrainer, onEditTrainer, onDeleteTrainer, currentUser, branches }) => {
  // 트레이너는 본인만 볼 수 있음
  let filteredTrainers = trainers;
  if (currentUser?.role === 'trainer' && currentUser.trainerProfileId) {
    filteredTrainers = trainers.filter(t => t.id === currentUser.trainerProfileId);
  }
  
  const activeTrainers = filteredTrainers.filter(t => t.isActive);
  const inactiveTrainers = filteredTrainers.filter(t => !t.isActive);

  const { setNodeRef: setActiveRef, isOver: isOverActive } = useDroppable({ id: 'active-droppable' });
  const { setNodeRef: setInactiveRef, isOver: isOverInactive } = useDroppable({ id: 'inactive-droppable' });

  const canAddTrainer = currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager');

  return (
    <aside className="w-72 bg-slate-50 border-l border-slate-200 p-4 flex flex-col gap-6">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-slate-500"/>
                <h2 className="text-lg font-bold text-slate-800">강사 목록</h2>
            </div>
            {canAddTrainer && (
                <button onClick={onAddTrainer} className="p-1.5 text-slate-500 hover:text-blue-600 rounded-full hover:bg-slate-200">
                    <PlusIcon className="w-5 h-5"/>
                </button>
            )}
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
  );
};
