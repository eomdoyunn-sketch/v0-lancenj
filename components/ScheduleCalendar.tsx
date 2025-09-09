import React, { useState } from 'react';
import { Session, Trainer, SessionStatus, MemberProgram, Member, User } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, UsersIcon } from './Icons';

interface ScheduleCalendarProps {
  sessions: Session[];
  allSessions: Session[];
  trainers: Trainer[];
  programs: MemberProgram[];
  members: Member[];
  onSessionEventClick: (session: Session) => void;
  currentUser: User | null;
}

type CalendarView = 'month' | 'week' | 'day' | 'trainer';

const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const HOUR_START = 6; // Calendar starts at 6 AM
const HOUR_END = 23;  // Calendar ends at 11 PM (to show 6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22)

export const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({ sessions, allSessions, trainers, programs, members, onSessionEventClick, currentUser }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('week'); 

  const trainerMap = new Map(trainers.map(t => [t.id, t]));
  const programMap = new Map(programs.map(p => [p.id, p]));
  const memberMap = new Map(members.map(m => [m.id, m]));
  
  // App.tsx에서 이미 올바른 trainers 데이터가 전달되므로 추가 필터링 불필요
  let filteredTrainers = trainers.filter(t => t.isActive);
  let filteredSessions = sessions;
  
  console.log('ScheduleCalendar - 전달받은 sessions:', sessions.length);
  console.log('ScheduleCalendar - 전달받은 allSessions:', allSessions.length);
  console.log('전달받은 강사 목록:', trainers.map(t => `${t.name} (${t.branchIds.join(', ')})`));
  console.log('현재 뷰:', view);
  console.log('현재 사용자:', currentUser?.name, currentUser?.role);
  
  // 트레이너의 경우: 강사별 뷰에서만 지점 전체 강사 세션 표시
  if (currentUser?.role === 'trainer' && currentUser.trainerProfileId && view === 'trainer') {
    const trainerIds = filteredTrainers.map(t => t.id);
    // allSessions에서 지점 전체 강사 세션만 필터링
    filteredSessions = allSessions.filter(s => trainerIds.includes(s.trainerId));
    console.log('강사별 뷰 - 지점 전체 세션:', filteredSessions.length, '강사 ID들:', trainerIds);
  } else if (currentUser?.role === 'trainer') {
    // 일별, 주별, 월별 뷰에서는 본인 세션만 (이미 App.tsx에서 필터링됨)
    console.log('개인 뷰 - 본인 세션만:', filteredSessions.length);
  }
  
  const activeTrainers = filteredTrainers.sort((a,b) => a.name.localeCompare(b.name));
  console.log('ScheduleCalendar - activeTrainers:', activeTrainers.map(t => t.name));

  const getAttendedNames = (ids: string[]) => ids.map(id => memberMap.get(id)?.name || 'N/A');

  const changeDate = (amount: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (view === 'month') newDate.setMonth(newDate.getMonth() + amount);
      if (view === 'week') newDate.setDate(newDate.getDate() + (amount * 7));
      if (view === 'day' || view === 'trainer') newDate.setDate(newDate.getDate() + amount);
      return newDate;
    });
  };
  
  const changeDateWeek = (amount: number) => {
     setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + (amount * 7));
      return newDate;
    });
  }

  const goToToday = () => {
    setCurrentDate(new Date());
    setView('day'); // 오늘 버튼 클릭 시 일별 뷰로 변경
  };


  const renderHeader = () => {
    let title = '';
    const koKR = 'ko-KR';
    if (view === 'month') title = currentDate.toLocaleDateString(koKR, { year: 'numeric', month: 'long' });
    if (view === 'week') {
        const start = new Date(currentDate);
        start.setDate(start.getDate() - start.getDay());
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        title = `${start.toLocaleDateString(koKR, { month: 'long', day: 'numeric' })} - ${end.toLocaleDateString(koKR, { month: 'long', day: 'numeric' })}`;
        if (start.getFullYear() !== end.getFullYear()) {
             title = `${start.toLocaleDateString(koKR, { year: 'numeric', month: 'long', day: 'numeric' })} - ${end.toLocaleDateString(koKR, { year: 'numeric', month: 'long', day: 'numeric' })}`;
        }
    }
    if (view === 'day' || view === 'trainer') title = currentDate.toLocaleDateString(koKR, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

    return (
      <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
        <h3 className="text-xl font-bold text-slate-700">{title}</h3>
        <div className="flex items-center gap-4 flex-wrap justify-end">
          <div className="flex items-center gap-2">
              <button onClick={() => goToToday()} className="px-3 py-1.5 bg-white text-slate-700 rounded-md shadow-sm text-sm font-medium hover:bg-slate-100 border">오늘</button>
          </div>
          
          <div className="flex items-center p-1 bg-slate-200 rounded-md">
            <button onClick={() => setView('day')} className={`px-3 py-1 text-sm rounded ${view === 'day' ? 'bg-white shadow-sm' : ''}`}>일별</button>
            <button onClick={() => setView('week')} className={`px-3 py-1 text-sm rounded ${view === 'week' ? 'bg-white shadow-sm' : ''}`}>주별</button>
            <button onClick={() => setView('month')} className={`px-3 py-1 text-sm rounded ${view === 'month' ? 'bg-white shadow-sm' : ''}`}>월별</button>
            <button onClick={() => setView('trainer')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${view === 'trainer' ? 'bg-slate-600 text-white' : 'bg-transparent text-slate-600'}`}>
                <UsersIcon className="w-4 h-4" />
                <span>강사별</span>
              </button>
          </div>
          
           <div className="flex items-center">
              <button onClick={() => changeDate(-1)} className="p-2 rounded-full hover:bg-slate-100"><ChevronLeftIcon className="w-5 h-5 text-slate-500"/></button>
              <button onClick={() => changeDate(1)} className="p-2 rounded-full hover:bg-slate-100"><ChevronRightIcon className="w-5 h-5 text-slate-500"/></button>
          </div>
        </div>
      </div>
    );
  };

  const renderSessionEvent = (session: Session, key: string | number) => {
    const program = programMap.get(session.programId);
    const trainer = trainerMap.get(session.trainerId);
    if (!program || !trainer) return null;

    const attendedNames = getAttendedNames(session.attendedMemberIds);
    const isCompleted = session.status === SessionStatus.Completed;
    
    return (
        <div key={key} onClick={() => onSessionEventClick(session)}
            className={`p-1 rounded text-white cursor-pointer hover:opacity-90 transition-opacity h-full flex flex-col justify-center ${trainer.color} ${isCompleted ? 'opacity-70' : ''}`}
            title={`${program.programName} - ${attendedNames.join(', ')}`}>
            <p className="text-xs font-bold truncate">{program.programName}</p>
            <p className="text-xs truncate">{trainer.name} / {attendedNames.join(', ')}</p>
        </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const endDate = new Date(monthEnd);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const days = [];
    let day = new Date(startDate);
    while (day <= endDate) {
        days.push(new Date(day));
        day.setDate(day.getDate() + 1);
    }
    
    return (
      <div className="grid grid-cols-7 border-t border-l">
        {WEEK_DAYS.map(dayName => <div key={dayName} className="text-center font-semibold text-sm p-2 bg-slate-50 border-r border-b">{dayName}</div>)}
        {days.map((d, i) => {
            const isCurrentMonth = d.getMonth() === currentDate.getMonth();
            const dateStr = d.toISOString().split('T')[0];
            const daySessions = filteredSessions.filter(s => s.date === dateStr);
            return (
                <div key={i} className={`p-2 border-r border-b min-h-[120px] ${isCurrentMonth ? 'bg-white' : 'bg-slate-50'}`}>
                    <span className={`text-sm ${isCurrentMonth ? 'font-medium' : 'text-slate-400'}`}>{d.getDate()}</span>
                    <div className="space-y-1 mt-1">
                        {daySessions.map(session => renderSessionEvent(session, session.id))}
                    </div>
                </div>
            );
        })}
      </div>
    );
  };
  
const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - startOfWeek.getDay());
    
    const weekDays = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(d.getDate() + i);
        return d;
    });

    return (
        <div className="grid" style={{ gridTemplateColumns: `60px repeat(7, minmax(100px, 1fr))` }}>
            {/* Header */}
            <div className="row-span-1"></div>
            {weekDays.map((day, i) => (
                <div key={i} className="text-center font-semibold text-sm p-2 bg-slate-50 border-r border-b border-t">
                    {WEEK_DAYS[day.getDay()]} <span className="font-normal">{day.getDate()}</span>
                </div>
            ))}

            {/* Body */}
            <div> {/* Time column */}
                {Array.from({ length: HOUR_END - HOUR_START }).map((_, i) => (
                    <div key={i} className="h-16 text-right text-xs p-1 text-slate-400 border-t relative">
                       <span className="absolute -top-2 right-1">{`${String(HOUR_START + i).padStart(2, '0')}:00`}</span>
                    </div>
                ))}
            </div>

            {weekDays.map((day, i) => {
                const dateStr = day.toISOString().split('T')[0];
                const daySessions = filteredSessions.filter(s => s.date === dateStr);
                return (
                    <div key={i} className="relative border-r">
                        {Array.from({ length: HOUR_END - HOUR_START }).map((_, hourIdx) => (
                            <div key={hourIdx} className="h-16 border-t border-slate-100"></div>
                        ))}
                        {daySessions.map(session => {
                            if (!session.startTime || !session.startTime.includes(':')) return null;
                            const [hour, minute] = session.startTime.split(':').map(Number);
                            const top = ((hour - HOUR_START) * 60 + minute) / 60 * 64; // 64px per hour
                            const height = session.duration / 60 * 64;
                            return (
                                <div key={session.id} style={{ top: `${top}px`, height: `${height}px` }} className="absolute w-full px-1 z-10">
                                    {renderSessionEvent(session, session.id)}
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
};
  
const renderDayView = () => {
    const dateStr = currentDate.toISOString().split('T')[0];
    return (
        <div className="grid" style={{ gridTemplateColumns: `60px 1fr` }}>
            {/* Header */}
            <div></div>
            <div className="text-center font-semibold text-sm p-2 bg-slate-50 border-r border-b border-t">일정</div>
            
            {/* Body */}
            <div> {/* Time column */}
                {Array.from({ length: HOUR_END - HOUR_START }).map((_, i) => (
                    <div key={i} className="h-16 text-right text-xs p-1 text-slate-400 border-t relative">
                       <span className="absolute -top-2 right-1">{`${String(HOUR_START + i).padStart(2, '0')}:00`}</span>
                    </div>
                ))}
            </div>
            <div className="relative border-r">
                {Array.from({ length: HOUR_END - HOUR_START }).map((_, hourIdx) => (
                    <div key={hourIdx} className="h-16 border-t border-slate-100"></div>
                ))}
                {filteredSessions.filter(s => s.date === dateStr).map(session => {
                    if (!session.startTime || !session.startTime.includes(':')) return null;
                    const [hour, minute] = session.startTime.split(':').map(Number);
                    const top = ((hour - HOUR_START) * 60 + minute) / 60 * 64; // 64px per hour
                    const height = session.duration / 60 * 64;
                    return (
                        <div key={session.id} style={{ top: `${top}px`, height: `${height}px` }} className="absolute w-full px-1 z-10">
                            {renderSessionEvent(session, session.id)}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const renderTrainerView = () => {
    // 강사별 뷰에서는 모든 세션을 보여줌 (날짜 필터링 제거)
    const daySessions = filteredSessions;
    const totalHours = HOUR_END - HOUR_START;
    const timelineWidth = totalHours * 96; // 96px per hour

    const renderTimeHeaders = () => {
        const headers = [];
        for (let i = HOUR_START; i < HOUR_END; i++) {
            headers.push(
                <div key={i} className="w-24 flex-shrink-0 text-center text-sm font-medium text-slate-500">
                    {`${i.toString().padStart(2, '0')}:00`}
                </div>
            );
        }
        return headers;
    };
    
    const minutesToPosition = (time: string) => {
        if (!time || !time.includes(':')) return 0;
        const [hour, minute] = time.split(':').map(Number);
        const sessionMinutes = (hour * 60 + minute) - (HOUR_START * 60);
        return (sessionMinutes / (totalHours * 60)) * timelineWidth;
    };

    const durationToWidth = (duration: number) => {
        return (duration / (totalHours * 60)) * timelineWidth;
    };

    return (
        <div className="w-full border-t">
            <div className="grid sticky top-0 bg-white z-20" style={{ gridTemplateColumns: `120px 1fr` }}>
                <div className="p-2 font-semibold text-slate-600 border-b border-r flex items-center justify-center">강사</div>
                <div className="overflow-x-auto border-b">
                    <div className="relative flex h-full" style={{ width: `${timelineWidth}px` }}>
                        {renderTimeHeaders()}
                    </div>
                </div>
            </div>
            <div className="overflow-y-auto" style={{maxHeight: '60vh'}}>
                {activeTrainers.map(trainer => {
                    const trainerSessions = daySessions.filter(s => s.trainerId === trainer.id);
                    return (
                        <div key={trainer.id} className="grid" style={{ gridTemplateColumns: `120px 1fr` }}>
                            <div className="p-2 font-medium text-slate-800 border-b border-r flex items-center justify-center text-center">
                                {trainer.name}
                            </div>
                            <div className="border-b relative min-h-[60px] overflow-hidden">
                                <div className="relative h-full" style={{ width: `${timelineWidth}px` }}>
                                     {/* Background grid lines */}
                                    <div className="absolute top-0 left-0 w-full h-full flex">
                                        {Array.from({ length: totalHours }).map((_, i) => (
                                            <div key={i} className="w-24 h-full border-r border-slate-100 flex-shrink-0"></div>
                                        ))}
                                    </div>
                                    {trainerSessions.map(session => {
                                        const left = minutesToPosition(session.startTime);
                                        const width = durationToWidth(session.duration);
                                        return (
                                            <div key={session.id}
                                                 style={{ left: `${left}px`, width: `${width}px` }}
                                                 className="absolute top-1/2 -translate-y-1/2 h-5/6 p-0.5">
                                                {renderSessionEvent(session, session.id)}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
                 {activeTrainers.length === 0 && <div className="text-center text-slate-500 py-8">활성 강사가 없습니다.</div>}
            </div>
        </div>
    );
};

  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      {renderHeader()}
      <div className="overflow-x-auto">
          {view === 'month' && renderMonthView()}
          {view === 'week' && renderWeekView()}
          {view === 'day' && renderDayView()}
          {view === 'trainer' && renderTrainerView()}
      </div>
    </div>
  );
};