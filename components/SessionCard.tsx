import React from 'react';
import { Member, Session, SessionStatus, Trainer } from '../types';
import { CheckCircleIcon } from './Icons';

interface SessionTrackerProps {
  programId: string;
  totalSessions: number;
  sessions: Session[];
  trainers: Trainer[];
  members: Member[];
  onSessionClick: (programId: string, sessionNumber: number, session: Session | null) => void;
  onShowTooltip: (content: React.ReactNode, rect: DOMRect) => void;
  onHideTooltip: () => void;
}

export const SessionTracker: React.FC<SessionTrackerProps> = ({ programId, totalSessions, sessions, trainers, members, onSessionClick, onShowTooltip, onHideTooltip }) => {
  
  const sessionMap = new Map(sessions.map(s => [s.sessionNumber, s]));
  const trainerMap = new Map(trainers.map(t => [t.id, t]));
  const memberMap = new Map(members.map(m => [m.id, m]));

  const renderTooltipContent = (session: Session | null, sessionNumber: number) => {
    if (!session) {
      return <>{sessionNumber}회차 미예약</>;
    }

    const trainer = trainerMap.get(session.trainerId);
    const statusText = session.status === SessionStatus.Completed ? '완료' : '예약';
    const attendedMemberNames = session.attendedMemberIds.map(id => memberMap.get(id)?.name || 'Unknown');
    
    return (
      <div className="text-left space-y-1">
        <div><span className="font-semibold">상태:</span> {statusText}</div>
        <div>{session.date} {session.startTime}</div>
        <div><span className="font-semibold">강사:</span> {trainer?.name || 'N/A'}</div>
        <div><span className="font-semibold">참석:</span> {attendedMemberNames.join(', ')}</div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-10 gap-1.5">
      {Array.from({ length: totalSessions }, (_, i) => i + 1).map(sessionNumber => {
        const session = sessionMap.get(sessionNumber);
        const tooltipContent = renderTooltipContent(session, sessionNumber);
        
        const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
            onShowTooltip(tooltipContent, e.currentTarget.getBoundingClientRect());
        };

        if (!session) { // Empty slot
          return (
            <button
              key={sessionNumber}
              onClick={() => onSessionClick(programId, sessionNumber, null)}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={onHideTooltip}
              className="w-7 h-7 flex items-center justify-center bg-slate-200 hover:bg-blue-200 rounded text-slate-500 text-xs font-mono"
            >
              {sessionNumber}
            </button>
          );
        }

        if (session.status === SessionStatus.Completed) {
          const trainer = trainerMap.get(session.trainerId);
          return (
            <button
              key={sessionNumber}
              onClick={() => onSessionClick(programId, sessionNumber, session)}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={onHideTooltip}
              className={`w-7 h-7 flex items-center justify-center ${trainer?.color || 'bg-green-500'} rounded text-white hover:opacity-80 transition-opacity`}
            >
              <CheckCircleIcon className="w-4 h-4" />
            </button>
          );
        }

        if (session.status === SessionStatus.Booked) {
          const isPastDue = new Date(`${session.date}T${session.startTime}`) < new Date();
          return (
             <button
              key={sessionNumber}
              onClick={() => onSessionClick(programId, sessionNumber, session)}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={onHideTooltip}
              className={`w-7 h-7 flex items-center justify-center rounded text-white text-xs font-mono transition-colors
                ${isPastDue 
                  ? 'bg-orange-500 hover:bg-orange-600 animate-pulse' 
                  : 'bg-slate-400 hover:bg-slate-500 cursor-pointer'
                }`
              }
            >
              {sessionNumber}
            </button>
          );
        }
        
        return null;
      })}
    </div>
  );
};
