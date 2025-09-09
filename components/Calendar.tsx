import React from 'react';
import { Branch, Member, MemberProgram, ProgramStatus, Session, Trainer, User } from '../types';
import { ProgramRow } from './ProgramBlock';
import { PlusIcon, ChevronDownIcon } from './Icons';

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
  filter: { status: ProgramStatus | '전체'; search: string; trainerId: string; branchId: string; };
  setFilter: (filter: { status: ProgramStatus | '전체'; search: string; trainerId: string; branchId: string; }) => void;
  onShowTooltip: (content: React.ReactNode, rect: DOMRect) => void;
  onHideTooltip: () => void;
  currentUser: User | null;
}

const statusFilters: (ProgramStatus | '전체')[] = ['전체', '유효', '정지', '만료'];

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

  const TableHeader = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <th className={`px-4 py-3 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider ${className}`}>
        <div className="flex items-center gap-1">
            {children}
            <ChevronDownIcon className="w-3 h-3 text-slate-400" />
        </div>
    </th>
  );
  
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
      
      <div className="mb-4 flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-white rounded-lg shadow-sm">
         <div className="flex items-center gap-2 p-1 bg-slate-200 rounded-lg">
            {statusFilters.map(status => (
                 <button 
                    key={status}
                    onClick={() => setFilter({ ...filter, status })}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${filter.status === status ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:bg-slate-300'}`}
                 >
                    {status}
                 </button>
            ))}
        </div>
        <div className="flex items-center gap-4 flex-wrap">
             <input 
                type="text"
                placeholder="회원/프로그램명 검색..."
                value={filter.search}
                onChange={e => setFilter({ ...filter, search: e.target.value })}
                className="p-2 border rounded-md w-48 text-sm"
             />
             {/* 트레이너는 강사와 지점 필터를 사용할 수 없음 */}
             {currentUser?.role !== 'trainer' && (
                <select
                   value={filter.trainerId}
                   onChange={e => setFilter({ ...filter, trainerId: e.target.value })}
                   className="p-2 border rounded-md text-sm"
                >
                   {/* 관리자와 매니저 모두 모든 강사 옵션 표시 */}
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
                   {/* 관리자만 모든 지점 옵션 표시 */}
                   {currentUser?.role === 'admin' && <option value="">모든 지점</option>}
                   {allBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
             )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full whitespace-nowrap">
          <thead>
            <tr>
              <TableHeader>회원명</TableHeader>
              <TableHeader>프로그램</TableHeader>
              <TableHeader>등록일</TableHeader>
              <TableHeader className="text-center">담당 강사</TableHeader>
              <TableHeader className="text-center">총 세션</TableHeader>
              <TableHeader className="text-center">잔여</TableHeader>
              <TableHeader className="text-center">최근 경과</TableHeader>
              <TableHeader className="text-right">단가</TableHeader>
              <TableHeader>상태</TableHeader>
              <TableHeader>세션 트래커</TableHeader>
              <TableHeader className="text-center">관리</TableHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
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
          </tbody>
        </table>
         {programs.length === 0 && (
          <div className="text-center py-16 px-6">
            <h3 className="text-lg font-semibold text-slate-700">해당 조건의 프로그램이 없습니다.</h3>
            <p className="text-slate-500 mt-2">'신규 프로그램 등록' 버튼을 눌러 새 프로그램을 추가하거나 필터를 변경해보세요.</p>
          </div>
        )}
      </div>
    </div>
  );
};
