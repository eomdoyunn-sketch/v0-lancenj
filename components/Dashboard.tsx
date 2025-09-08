import React from 'react';
import { Member, MemberProgram, Session, Trainer, Branch, User } from '../types';
import { ScheduleCalendar } from './ScheduleCalendar';

interface DashboardProps {
  trainers: Trainer[];
  sessions: Session[];
  allSessions: Session[];
  programs: MemberProgram[];
  members: Member[];
  startDate: string;
  endDate: string;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  onTrainerClick: (trainerId: string) => void;
  onSessionEventClick: (session: Session) => void;
  allBranches: Branch[];
  filter: { branchId: string };
  setFilter: (filter: { branchId: string }) => void;
  currentUser: User | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
    trainers, 
    sessions,
    allSessions,
    programs,
    members,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    onTrainerClick,
    onSessionEventClick,
    allBranches,
    filter,
    setFilter,
    currentUser,
}) => {
  
  const programMap = new Map(programs.map(p => [p.id, p]));
  const branchMap = new Map(allBranches.map(b => [b.id, b.name]));

  // Filter data based on selected branch and user role
  let branchFilteredTrainers = trainers.filter(t => !filter.branchId || t.branchIds.includes(filter.branchId));
  console.log('Dashboard - branchFilteredTrainers:', branchFilteredTrainers.map(t => t.name));
  let sessionsForBranch = sessions.filter(s => {
      const program = programMap.get(s.programId);
      return !filter.branchId || (program && program.branchId === filter.branchId);
  });
  let programsForBranch = programs.filter(p => !filter.branchId || p.branchId === filter.branchId);

  // 트레이너는 본인이 완료한 수업만 정산에서 조회 가능
  let trainerStatsTrainers = branchFilteredTrainers; // 정산 테이블용
  if (currentUser?.role === 'trainer' && currentUser.trainerProfileId) {
    sessionsForBranch = sessionsForBranch.filter(s => s.trainerId === currentUser.trainerProfileId);
    trainerStatsTrainers = branchFilteredTrainers.filter(t => t.id === currentUser.trainerProfileId);
  }

  // Correctly parse dates in local timezone to avoid off-by-one errors
  const filterStartDate = new Date(`${startDate}T00:00:00`);
  const filterEndDate = new Date(`${endDate}T23:59:59`);

  const filteredSessions = sessionsForBranch.filter(s => {
    const sessionDate = new Date(`${s.date}T00:00:00`);
    return sessionDate >= filterStartDate && sessionDate <= filterEndDate;
  });

  const trainerStats = trainerStatsTrainers.map(trainer => {
    const completedSessions = filteredSessions.filter(s => s.trainerId === trainer.id && s.status === 'completed');
    const totalFee = completedSessions.reduce((acc, session) => acc + (session.trainerFee || 0), 0);
    return {
      ...trainer,
      sessionCount: completedSessions.length,
      totalFee,
    };
  }).sort((a, b) => b.totalFee - a.totalFee);

  const totalMonthSessions = filteredSessions.filter(s => s.status === 'completed').length;
  const totalMonthRevenue = trainerStats.reduce((acc, t) => acc + t.totalFee, 0);

  const toYYYYMMDD = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const setThisMonth = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0);
    setStartDate(toYYYYMMDD(start));
    setEndDate(toYYYYMMDD(end));
  };

  const setLastMonth = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0);
    setStartDate(toYYYYMMDD(start));
    setEndDate(toYYYYMMDD(end));
  };
  
  // The date string is already in YYYY-MM-DD format, so no conversion is needed for display.
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr;
  }

  return (
    <div className="flex-1 p-8 bg-slate-100 overflow-y-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <h2 className="text-3xl font-bold text-slate-800 shrink-0">
            {`${formatDate(startDate)} ~ ${formatDate(endDate)}`} 정산 현황
        </h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto justify-end">
            <div className="flex items-center gap-2 p-1 bg-slate-200 rounded-lg flex-wrap">
                {/* 관리자만 모든 지점 버튼 표시 */}
                {currentUser?.role === 'admin' && (
                    <button 
                        onClick={() => setFilter({ branchId: '' })}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${filter.branchId === '' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:bg-slate-300'}`}
                    >
                        모든 지점
                    </button>
                )}
                {allBranches.map(branch => (
                    <button 
                        key={branch.id}
                        onClick={() => setFilter({ branchId: branch.id })}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${filter.branchId === branch.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:bg-slate-300'}`}
                    >
                        {branch.name}
                    </button>
                ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded-md shadow-sm text-sm"/>
                <span>~</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded-md shadow-sm text-sm"/>
                <button onClick={setThisMonth} className="px-3 py-2 bg-white text-slate-700 rounded-md shadow-sm text-sm font-medium hover:bg-slate-100 border">이번 달</button>
                <button onClick={setLastMonth} className="px-3 py-2 bg-white text-slate-700 rounded-md shadow-sm text-sm font-medium hover:bg-slate-100 border">지난 달</button>
            </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-slate-500 font-medium">선택 기간 총 완료 수업</h3>
              <p className="text-4xl font-bold text-blue-600 mt-2">{totalMonthSessions.toLocaleString()}<span className="text-xl ml-2">회</span></p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-slate-500 font-medium">선택 기간 총 강사료</h3>
              <p className="text-4xl font-bold text-green-600 mt-2">₩{totalMonthRevenue.toLocaleString()}</p>
          </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-4 font-semibold text-slate-600">강사명</th>
              <th className="p-4 font-semibold text-slate-600">상태</th>
              <th className="p-4 font-semibold text-slate-600 text-right">총 수업 횟수</th>
              <th className="p-4 font-semibold text-slate-600 text-right">총 수업료</th>
            </tr>
          </thead>
          <tbody>
            {trainerStats.map(stat => (
              <tr key={stat.id} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => onTrainerClick(stat.id)}>
                <td className="p-4 font-medium text-slate-800">{stat.name}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${stat.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {stat.isActive ? '활성' : '비활성'}
                  </span>
                </td>
                <td className="p-4 text-right text-slate-600 font-mono">{stat.sessionCount} 회</td>
                <td className="p-4 text-right text-slate-800 font-semibold font-mono">₩{stat.totalFee.toLocaleString()}</td>
              </tr>
            ))}
             {trainerStats.length === 0 && (
              <tr>
                  <td colSpan={4} className="text-center py-10 px-6 text-slate-500">
                      해당 기간/지점의 정산 내역이 없습니다.
                  </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">전체 스케줄 현황</h2>
        <ScheduleCalendar 
            sessions={sessionsForBranch} 
            allSessions={allSessions}
            trainers={branchFilteredTrainers} 
            programs={programsForBranch}
            members={members}
            onSessionEventClick={onSessionEventClick}
            currentUser={currentUser}
        />
      </div>
    </div>
  );
};