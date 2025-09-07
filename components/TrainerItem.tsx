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
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'manager') {
      // Manager can edit a trainer if they share at least one branch
      return trainer.branchIds.some(branchId => currentUser.assignedBranchIds?.includes(branchId));
    }
    return false;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center p-3 rounded-lg gap-3 transition-shadow ${isDragging ? 'shadow-2xl bg-blue-50 z-10' : ''} ${trainer.isActive ? 'bg-white hover:bg-slate-50' : 'bg-slate-200 text-slate-500'}`}
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
        <span className={`ml-auto w-2.5 h-2.5 rounded-full flex-shrink-0 ${trainer.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
      </div>
      {canManageTrainer() && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1.5 text-slate-500 hover:text-blue-600 rounded-full hover:bg-slate-200">
                <SettingsIcon className="w-4 h-4"/>
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-200">
                <TrashIcon className="w-4 h-4"/>
            </button>
        </div>
      )}
    </div>
  );
};