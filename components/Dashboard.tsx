import React from 'react';
import { Member, MemberProgram, Session, Trainer, Branch, User } from '../types';
import { ScheduleCalendar } from './ScheduleCalendar';
import { useResponsive } from '../hooks/useResponsive';
import { usePermissions } from '../hooks/usePermissions';
import { CenteredContainer } from './layout/Container';
import { Grid } from './layout/Grid';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { PermissionGuard } from './PermissionGuard';

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
  const { isMobile } = useResponsive();
  const permissions = usePermissions();
  
  const programMap = new Map(programs.map(p => [p.id, p]));

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
  if (permissions.isTrainer() && currentUser?.trainerProfileId) {
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

  const setAllTime = () => {
    // 실제 데이터가 있는 범위를 동적으로 계산
    const allSessionDates = sessionsForBranch.map(s => new Date(`${s.date}T00:00:00`));
    
    if (allSessionDates.length === 0) {
      // 데이터가 없으면 현재 년도로 설정
      const today = new Date();
      const start = new Date(today.getFullYear(), 0, 1);
      const end = new Date(today.getFullYear(), 11, 31);
      setStartDate(toYYYYMMDD(start));
      setEndDate(toYYYYMMDD(end));
    } else {
      // 가장 이른 날짜와 가장 늦은 날짜 찾기
      const minDate = new Date(Math.min(...allSessionDates.map(d => d.getTime())));
      const maxDate = new Date(Math.max(...allSessionDates.map(d => d.getTime())));
      
      // 월 단위로 정리 (각 월의 1일과 마지막 날로 설정)
      const start = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
      const end = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);
      
      setStartDate(toYYYYMMDD(start));
      setEndDate(toYYYYMMDD(end));
    }
  };

  // 전체 기간이 선택되었는지 확인하는 함수
  const isAllTimeSelected = () => {
    if (sessionsForBranch.length === 0) return false;
    
    const allSessionDates = sessionsForBranch.map(s => new Date(`${s.date}T00:00:00`));
    const minDate = new Date(Math.min(...allSessionDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allSessionDates.map(d => d.getTime())));
    
    const dataStart = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const dataEnd = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);
    
    const currentStart = new Date(`${startDate}T00:00:00`);
    const currentEnd = new Date(`${endDate}T23:59:59`);
    
    return currentStart.getTime() === dataStart.getTime() && 
           currentEnd.getTime() === dataEnd.getTime();
  };
  
  // The date string is already in YYYY-MM-DD format, so no conversion is needed for display.
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr;
  }

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-white overflow-y-auto">
      <CenteredContainer>
        <div className="mb-6">
          <h2 className={`${isMobile ? 'text-xl' : 'text-2xl lg:text-3xl'} font-bold text-slate-800 mb-4`}>
              {`${formatDate(startDate)} ~ ${formatDate(endDate)}`} 정산 현황
          </h2>
          
          {/* 지점 필터 - 가로 배치 */}
          <div className="mb-4">
            <div className="flex items-center gap-2 p-1 bg-slate-200 rounded-lg flex-wrap">
              <span className="text-sm font-medium text-slate-700 px-2">지점:</span>
              {/* 관리자만 모든 지점 버튼 표시 */}
              <PermissionGuard requiredRole="admin">
                <button 
                  onClick={() => setFilter({ branchId: '' })}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${filter.branchId === '' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:bg-slate-300'}`}
                >
                  모든 지점
                </button>
              </PermissionGuard>
              {allBranches.map(branch => (
                <PermissionGuard 
                  key={branch.id}
                  requiredPermission={() => permissions.canAccessBranch(branch.id)}
                >
                  <button 
                    onClick={() => setFilter({ branchId: branch.id })}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${filter.branchId === branch.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:bg-slate-300'}`}
                  >
                    {branch.name}
                  </button>
                </PermissionGuard>
              ))}
            </div>
          </div>

          {/* 날짜 선택 영역 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">기간:</span>
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                className="p-2 border rounded-md shadow-sm text-sm"
              />
              <span className="text-slate-500">~</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
                className="p-2 border rounded-md shadow-sm text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={setAllTime} 
                className={`px-3 py-2 rounded-md shadow-sm text-sm font-medium border ${
                  isAllTimeSelected() 
                    ? 'bg-blue-500 text-white border-blue-500' 
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-white'
                }`}
              >
                전체
              </button>
              <button onClick={setThisMonth} className="px-3 py-2 bg-white text-slate-700 rounded-md shadow-sm text-sm font-medium hover:bg-white border">이번 달</button>
              <button onClick={setLastMonth} className="px-3 py-2 bg-white text-slate-700 rounded-md shadow-sm text-sm font-medium hover:bg-white border">지난 달</button>
            </div>
          </div>
        </div>
        
        <Grid cols={2} gap="lg" className="mb-8">
            <Card style={{ backgroundColor: '#F1F5F9' }}>
                <CardHeader className="pb-3">
                    <CardTitle className="text-slate-500 font-medium text-sm sm:text-base">선택 기간 총 완료 수업</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <p className={`${isMobile ? 'text-2xl' : 'text-3xl lg:text-4xl'} font-bold text-blue-600`}>
                      {totalMonthSessions.toLocaleString()}
                      <span className={`${isMobile ? 'text-lg' : 'text-xl'} ml-2`}>회</span>
                    </p>
                </CardContent>
            </Card>
            <PermissionGuard 
              requiredPermission={() => 
                filter.branchId 
                  ? permissions.canViewBranchRevenue(filter.branchId)
                  : permissions.canViewAllRevenue()
              }
            >
              <Card style={{ backgroundColor: '#F1F5F9' }}>
                  <CardHeader className="pb-3">
                      <CardTitle className="text-slate-500 font-medium text-sm sm:text-base">선택 기간 총 강사료</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                      <p className={`${isMobile ? 'text-2xl' : 'text-3xl lg:text-4xl'} font-bold text-green-600`}>
                        ₩{totalMonthRevenue.toLocaleString()}
                      </p>
                  </CardContent>
              </Card>
            </PermissionGuard>
        </Grid>
        
        <PermissionGuard 
          requiredPermission={() => 
            filter.branchId 
              ? permissions.canViewBranchRevenue(filter.branchId)
              : permissions.canViewAllRevenue()
          }
        >
          <Card className="overflow-hidden">
            {/* 데스크톱 테이블 */}
            <div className="hidden sm:block">
              <Table style={{ backgroundColor: '#F1F5F9' }}>
                <TableHeader>
                  <TableRow>
                    <TableHead className="p-4 font-semibold text-slate-600">강사명</TableHead>
                    <TableHead className="p-4 font-semibold text-slate-600">상태</TableHead>
                    <TableHead className="p-4 font-semibold text-slate-600 text-right">총 수업 횟수</TableHead>
                    <TableHead className="p-4 font-semibold text-slate-600 text-right">총 수업료</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trainerStats.map(stat => (
                    <TableRow key={stat.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => onTrainerClick(stat.id)}>
                      <TableCell className="p-4 font-medium text-slate-800">{stat.name}</TableCell>
                      <TableCell className="p-4">
                        <Badge variant={stat.isActive ? 'default' : 'destructive'}>
                          {stat.isActive ? '활성' : '비활성'}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-4 text-right text-slate-600 font-mono">{stat.sessionCount} 회</TableCell>
                      <TableCell className="p-4 text-right text-slate-800 font-semibold font-mono">₩{stat.totalFee.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {trainerStats.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center py-10 px-6 text-slate-500">
                            해당 기간/지점의 정산 내역이 없습니다.
                        </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* 모바일 카드 뷰 */}
            <div className="sm:hidden">
              {trainerStats.map(stat => (
                <div key={stat.id} className="p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => onTrainerClick(stat.id)}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-slate-800">{stat.name}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${stat.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {stat.isActive ? '활성' : '비활성'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">수업 횟수: <span className="font-mono">{stat.sessionCount} 회</span></span>
                    <span className="text-slate-800 font-semibold font-mono">₩{stat.totalFee.toLocaleString()}</span>
                  </div>
                </div>
              ))}
              {trainerStats.length === 0 && (
                <div className="text-center py-10 px-6 text-slate-500">
                  해당 기간/지점의 정산 내역이 없습니다.
                </div>
              )}
            </div>
          </Card>
        </PermissionGuard>

        <div className="mt-8">
          <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-slate-800 mb-4`}>전체 스케줄 현황</h2>
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
      </CenteredContainer>
    </div>
  );
};