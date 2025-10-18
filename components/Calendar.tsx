import React from 'react';
import { Branch, Member, MemberProgram, ProgramStatus, Session, Trainer, User } from '../types';
import { ProgramRow } from './ProgramBlock';
import { SessionTracker } from './SessionCard';
import { PlusIcon, ChevronDownIcon } from './Icons';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface ProgramTableProps {
  programs: MemberProgram[];
  members: Member[];
  sessions: Session[];
  allSessions: Session[];
  trainers: Trainer[];
  allBranches: Branch[];
  onAddProgram: () => void;
  onEditProgram: (program: MemberProgram) => void;
  onReRegisterProgram: (program: MemberProgram) => void;
  onDeleteProgram: (programId: string) => void;
  onSessionClick: (programId: string, sessionNumber: number, session: Session | null) => void;
  filter: { status: ProgramStatus; search: string; trainerId: string; branchId: string; };
  setFilter: (filter: { status: ProgramStatus; search: string; trainerId: string; branchId: string; }) => void;
  onShowTooltip: (content: React.ReactNode, rect: DOMRect) => void;
  onHideTooltip: () => void;
  currentUser: User | null;
}

const statusFilters: ProgramStatus[] = ['유효', '정지', '만료'];

export const ProgramTable: React.FC<ProgramTableProps> = ({
  programs,
  members,
  sessions,
  allSessions,
  trainers,
  allBranches,
  onAddProgram,
  onEditProgram,
  onReRegisterProgram,
  onDeleteProgram,
  onSessionClick,
  filter,
  setFilter,
  onShowTooltip,
  onHideTooltip,
  currentUser
}) => {
  const canAddProgram = currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager' || currentUser.role === 'trainer');

  // 디버깅을 위한 로그
  console.log('=== ProgramTable 렌더링 ===');
  console.log('전달받은 programs:', programs);
  console.log('전달받은 members:', members);
  console.log('전달받은 sessions:', sessions);
  console.log('전달받은 trainers:', trainers);
  console.log('현재 필터:', filter);

  const CustomTableHead = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <TableHead className={`px-4 py-3 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider ${className}`}>
        <div className="flex items-center gap-1">
            {children}
            <ChevronDownIcon className="w-3 h-3 text-slate-400" />
        </div>
    </TableHead>
  );

  // 모바일용 카드 컴포넌트
  const MobileProgramCard = ({ program }: { program: MemberProgram }) => {
    const programMembers = members.filter(m => program.memberIds.includes(m.id));
    const assignedTrainer = trainers.find(t => t.id === program.assignedTrainerId);
    const programSessions = allSessions.filter(s => s.programId === program.id);
    const remainingSessions = program.totalSessions - program.completedSessions;
    
    const lastSession = programSessions.filter(s => s.status === 'completed').length > 0
      ? programSessions.filter(s => s.status === 'completed').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
      : null;

    const daysSinceLastSession = lastSession
      ? Math.floor((new Date().getTime() - new Date(lastSession.date).getTime()) / (1000 * 3600 * 24))
      : null;

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

    return (
      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4 shadow-sm">
        {/* 상단: 회원명과 상태 */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-slate-900 text-lg">{memberNames}</h3>
            <p className="text-slate-600 text-sm">{program.programName}</p>
          </div>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(program.status)}`}>
            {program.status}
          </span>
        </div>

        {/* 중간: 주요 정보 */}
        <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
          <div>
            <span className="text-slate-500">등록일:</span>
            <span className="ml-1 font-medium">{program.registrationDate}</span>
          </div>
          <div>
            <span className="text-slate-500">담당 강사:</span>
            <span className="ml-1 font-medium">{assignedTrainer?.name || '미배정'}</span>
          </div>
          <div>
            <span className="text-slate-500">총 세션:</span>
            <span className="ml-1 font-medium">{program.totalSessions}</span>
          </div>
          <div>
            <span className="text-slate-500">잔여:</span>
            <span className="ml-1 font-medium text-blue-600">{remainingSessions}</span>
          </div>
          <div>
            <span className="text-slate-500">최근 경과:</span>
            <span className="ml-1 font-medium">
              {daysSinceLastSession !== null ? `${daysSinceLastSession}일 전` : '-'}
            </span>
          </div>
          <div>
            <span className="text-slate-500">단가:</span>
            <span className="ml-1 font-medium">{program.unitPrice.toLocaleString()}원</span>
          </div>
        </div>

        {/* 하단: 세션 트래커와 관리 버튼 */}
        <div className="border-t pt-3">
          <div className="mb-3">
            <span className="text-slate-500 text-sm">세션 트래커:</span>
            <div className="mt-1">
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
            </div>
          </div>
          
          {/* 관리 버튼들 */}
          <div className="flex gap-2">
            <button 
              onClick={() => onReRegisterProgram(program)} 
              className="flex-1 px-3 py-2 text-xs text-slate-600 hover:text-green-700 bg-slate-100 hover:bg-green-100 rounded-md"
            >
              재등록
            </button>
            <button 
              onClick={() => onEditProgram(program)} 
              className="px-3 py-2 text-slate-500 hover:text-blue-600 rounded-md hover:bg-slate-100"
            >
              수정
            </button>
            <button 
              onClick={() => onDeleteProgram(program.id)} 
              className="px-3 py-2 text-slate-500 hover:text-red-600 rounded-md hover:bg-slate-100"
            >
              삭제
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="flex-1 p-6 bg-slate-100 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-3xl font-bold text-slate-800">회원 프로그램 관리</h2>
            <p className="text-slate-500 mt-1">전체 회원들의 프로그램 등록 및 세션 현황을 관리합니다.</p>
        </div>
        {canAddProgram && (
            <button onClick={onAddProgram} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700">
                <PlusIcon className="w-4 h-4" />
                신규 프로그램 등록
            </button>
        )}
      </div>
      
      <div className="mb-4 flex flex-col gap-4 p-4 bg-white rounded-lg shadow-sm">
        {/* 상태 필터 */}
        <div className="flex items-center gap-2 p-1 bg-slate-200 rounded-lg overflow-x-auto">
          {statusFilters.map(status => (
            <button 
              key={status}
              onClick={() => setFilter({ ...filter, status })}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${filter.status === status ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:bg-slate-300'}`}
            >
              {status}
            </button>
          ))}
        </div>
        
        {/* 검색 및 필터 */}
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <input 
            type="text"
            placeholder="회원/프로그램명 검색..."
            value={filter.search}
            onChange={e => setFilter({ ...filter, search: e.target.value })}
            className="flex-1 p-2 border rounded-md text-sm"
          />
          {currentUser?.role !== 'trainer' && (
            <select
              value={filter.trainerId}
              onChange={e => setFilter({ ...filter, trainerId: e.target.value })}
              className="p-2 border rounded-md text-sm"
            >
              {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && <option value="">모든 강사</option>}
              {trainers.filter(t => t.isActive).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
          {currentUser?.role !== 'trainer' && (
            <select
              value={filter.branchId}
              onChange={e => setFilter({ ...filter, branchId: e.target.value })}
              className="p-2 border rounded-md text-sm"
            >
              {currentUser?.role === 'admin' && <option value="">모든 지점</option>}
              {allBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
        </div>
      </div>

      <Card className="overflow-hidden">
        {/* 데스크톱 테이블 - lg 이상에서만 표시 */}
        <div className="hidden lg:block">
          <Table>
            <TableHeader>
              <TableRow>
                <CustomTableHead>
                  회원명
                </CustomTableHead>
                <CustomTableHead>
                  프로그램
                </CustomTableHead>
                <CustomTableHead>
                  등록일
                </CustomTableHead>
                <CustomTableHead className="text-center">
                  담당 강사
                </CustomTableHead>
                <CustomTableHead className="text-center">
                  총 세션
                </CustomTableHead>
                <CustomTableHead className="text-center">
                  잔여
                </CustomTableHead>
                <CustomTableHead className="text-center">
                  최근 경과
                </CustomTableHead>
                <CustomTableHead className="text-right">
                  단가
                </CustomTableHead>
                <CustomTableHead>
                  상태
                </CustomTableHead>
                <CustomTableHead>
                  세션 트래커
                </CustomTableHead>
                <CustomTableHead className="text-center">
                  관리
                </CustomTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.map(program => (
                <ProgramRow
                  key={program.id}
                  program={program}
                  members={members}
                  sessions={sessions}
                  allSessions={allSessions}
                  trainers={trainers}
                  onSessionClick={onSessionClick}
                  onEdit={onEditProgram}
                  onReRegister={onReRegisterProgram}
                  onDelete={onDeleteProgram}
                  onShowTooltip={onShowTooltip}
                  onHideTooltip={onHideTooltip}
                  currentUser={currentUser}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        {/* 모바일 카드 뷰 - lg 미만에서만 표시 */}
        <div className="lg:hidden p-4">
          {programs.map(program => (
            <MobileProgramCard key={program.id} program={program} />
          ))}
        </div>

        {programs.length === 0 && (
          <div className="text-center py-16 px-6">
            <h3 className="text-lg font-semibold text-slate-700">해당 조건의 프로그램이 없습니다.</h3>
            <p className="text-slate-500 mt-2">'신규 프로그램 등록' 버튼을 눌러 새 프로그램을 추가하거나 필터를 변경해보세요.</p>
          </div>
        )}
      </Card>
    </div>
  );
};
