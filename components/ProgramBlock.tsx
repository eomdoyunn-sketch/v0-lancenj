import React from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { Member, MemberProgram, Session, Trainer, User } from '../types';
import { SessionTracker } from './SessionCard';
import { EditIcon, TrashIcon, UserIcon, CopyIcon } from './Icons';

const DraggableTrainer: React.FC<{ trainer: Trainer }> = ({ trainer }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: trainer.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`flex items-center justify-center gap-2 cursor-move hover:bg-slate-100 rounded-md p-1 transition-colors ${isDragging ? 'opacity-50 bg-slate-200' : ''}`}
    >
      <div className={`w-6 h-6 rounded-full overflow-hidden ${trainer.color}`}>
        {trainer.photoUrl ? (
          <img src={trainer.photoUrl} alt={trainer.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <UserIcon className="w-3 h-3 text-white"/>
          </div>
        )}
      </div>
      <span className="text-slate-700">{trainer.name}</span>
    </div>
  );
};

interface ProgramRowProps {
  program: MemberProgram;
  members: Member[];
  sessions: Session[];
  trainers: Trainer[];
  onSessionClick: (programId: string, sessionNumber: number, session: Session | null) => void;
  onEdit: (program: MemberProgram) => void;
  onReRegister: (program: MemberProgram) => void;
  onDelete: (programId: string) => void;
  onShowTooltip: (content: React.ReactNode, rect: DOMRect) => void;
  onHideTooltip: () => void;
  currentUser: User | null;
}

export const ProgramRow: React.FC<ProgramRowProps> = ({ program, members, sessions, trainers, onSessionClick, onEdit, onReRegister, onDelete, onShowTooltip, onHideTooltip, currentUser }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: program.id,
  });

  const remainingSessions = program.totalSessions - program.completedSessions;
  const programSessions = sessions.filter(s => s.programId === program.id);
  const assignedTrainer = trainers.find(t => t.id === program.assignedTrainerId);
  
  const programMembers = members.filter(m => program.memberIds.includes(m.id));

  const lastSession = programSessions.filter(s => s.status === 'completed').length > 0
    ? programSessions.filter(s => s.status === 'completed').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : null;

  const daysSinceLastSession = lastSession
    ? Math.floor((new Date().getTime() - new Date(lastSession.date).getTime()) / (1000 * 3600 * 24))
    : null;
    
  const canPerformAction = () => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin' || currentUser.role === 'manager') return true;
    if (currentUser.role === 'trainer') {
      const userTrainerProfile = trainers.find(t => t.id === currentUser.trainerProfileId);
      return userTrainerProfile?.id === program.assignedTrainerId;
    }
    return false;
  }

  const getStatusChip = (status: string) => {
    switch (status) {
      case '유효':
        return 'bg-blue-100 text-blue-800';
      case '정지':
        return 'bg-yellow-100 text-yellow-800';
      case '만료':
        return 'bg-slate-200 text-slate-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const memberNames = programMembers.map(m => m.name).join(', ');
  const memberTooltip = programMembers.map(m => `${m.name} (${m.contact})`).join('\n');

  return (
    <tr ref={setNodeRef} className={`border-b border-slate-200 transition-colors ${isOver ? 'bg-blue-100' : 'bg-white hover:bg-slate-50'}`}>
      <td className="px-4 py-3 text-sm font-medium text-slate-900">
        <div className="group relative">
          <span className="truncate">{memberNames}</span>
          <div className="absolute bottom-full mb-2 w-max px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-pre-wrap">
            {memberTooltip}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">{program.programName}</td>
      <td className="px-4 py-3 text-sm text-slate-600">{program.registrationDate}</td>
       <td className="px-4 py-3 text-sm text-center">
        {assignedTrainer ? (
          <DraggableTrainer trainer={assignedTrainer} />
        ) : (
          <span className="text-slate-400 text-xs italic">미배정</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-center font-mono text-slate-600">{program.totalSessions}</td>
      <td className="px-4 py-3 text-sm text-center font-mono text-blue-600 font-semibold">{remainingSessions}</td>
      <td className="px-4 py-3 text-sm text-center font-mono text-slate-600">
        {daysSinceLastSession !== null ? `${daysSinceLastSession}일 전` : '-'}
      </td>
      <td className="px-4 py-3 text-sm text-right font-mono text-slate-600">{program.unitPrice.toLocaleString()}원</td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(program.status)}`}>
          {program.status}
        </span>
      </td>
      <td className="p-3" style={{ minWidth: '300px' }}>
        <SessionTracker
          programId={program.id}
          totalSessions={program.totalSessions}
          sessions={programSessions}
          trainers={trainers}
          members={members}
          onSessionClick={onSessionClick}
          onShowTooltip={onShowTooltip}
          onHideTooltip={onHideTooltip}
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-center gap-2">
         {canPerformAction() && (
            <>
              <button onClick={() => onReRegister(program)} className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 hover:text-green-700 bg-slate-100 hover:bg-green-100 rounded-md" title="재등록">
                <CopyIcon className="w-3 h-3" />
                <span>재등록</span>
              </button>
              <button onClick={() => onEdit(program)} className="p-2 text-slate-500 hover:text-blue-600 rounded-full hover:bg-slate-100" title="수정">
                <EditIcon className="w-4 h-4" />
              </button>
              <button onClick={() => onDelete(program.id)} className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-100" title="삭제">
                <TrashIcon className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
};
