import React from 'react';
import { Member, MemberProgram, Session, MemberStatus, User, Branch } from '../types';
import { PlusIcon, EditIcon, TrashIcon, DownloadIcon } from './Icons';
import { useResponsive } from '../hooks/useResponsive';
import { Container, Grid, Flex } from './layout/Container';

interface MemberManagementProps {
  members: Member[];
  programs: MemberProgram[];
  sessions: Session[];
  onAddMember: () => void;
  onEditMember: (member: Member) => void;
  onDeleteMember: (memberId: string) => void;
  onMemberClick: (memberId: string) => void;
  allBranches: Branch[];
  filter: { branchId: string };
  setFilter: (filter: { branchId: string }) => void;
  currentUser: User | null;
}

export const MemberManagement: React.FC<MemberManagementProps> = ({ members, programs, sessions, onAddMember, onEditMember, onDeleteMember, onMemberClick, allBranches, filter, setFilter, currentUser }) => {
  const { isMobile, isTablet } = useResponsive();
  
  const canManageMembers = currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager' || currentUser.role === 'trainer');
  const branchMap = new Map(allBranches.map(b => [b.id, b.name]));

  const getStatusChip = (status: MemberStatus) => {
    switch (status) {
      case '활성':
        return 'bg-green-100 text-green-800';
      case '휴면 예상':
        return 'bg-yellow-100 text-yellow-800';
      case '비활성':
        return 'bg-slate-200 text-slate-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateMemberMetrics = (member: Member) => {
    const memberPrograms = programs.filter(p => p.memberIds.includes(member.id));
    const validPrograms = memberPrograms.filter(p => p.status === '유효');

    const registrationDates = memberPrograms.map(p => new Date(p.registrationDate).getTime());
    const sessionDates = sessions
        .filter(s =>
            memberPrograms.some(p => p.id === s.programId) &&
            s.attendedMemberIds.includes(member.id)
        )
        .map(s => new Date(s.date).getTime());

    const allActivityTimestamps = [...registrationDates, ...sessionDates];

    let lastActivityDate: string | null = null;
    let daysSinceLastActivity: number | null = null;

    if (allActivityTimestamps.length > 0) {
        const lastActivityTimestamp = Math.max(...allActivityTimestamps);
        const lastActivityDateObj = new Date(lastActivityTimestamp);
        lastActivityDate = lastActivityDateObj.toISOString().split('T')[0];
        daysSinceLastActivity = Math.floor((new Date().getTime() - lastActivityTimestamp) / (1000 * 3600 * 24));
    }

    let status: MemberStatus = '비활성';
    if (validPrograms.length > 0) {
        if (lastActivityDate && daysSinceLastActivity !== null) {
            if (daysSinceLastActivity <= 14) {
                status = '활성';
            } else {
                status = '휴면 예상';
            }
        } else {
            status = '활성'; // Has valid programs but no sessions yet.
        }
    }

    const totalRemainingSessions = validPrograms.reduce((acc, p) => acc + (p.totalSessions - p.completedSessions), 0);
    
    return {
      status,
      lastActivityDate,
      daysSinceLastActivity,
      totalRemainingSessions,
    };
  };

  const enrichedMembers = members.map(member => ({
    ...member,
    ...calculateMemberMetrics(member),
  }));

  const handleDownloadCSV = () => {
    const headers = ["ID", "회원명", "연락처", "소속 지점", "회원 상태", "최근 활동일", "최근 경과(일)", "총 잔여 세션", "운동 목표", "운동 동기", "특이사항/부상 이력", "운동 경력", "선호 시간대", "직업", "메모"];
    
    const rows = enrichedMembers.map(member => {
        return [
            member.id,
            member.name,
            member.contact,
            branchMap.get(member.branchId) || member.branchId,
            member.status,
            member.lastActivityDate || '',
            member.daysSinceLastActivity !== null ? member.daysSinceLastActivity : '',
            member.totalRemainingSessions,
            member.exerciseGoals?.join('; ') || '',
            member.motivation || '',
            member.medicalHistory || '',
            member.exerciseExperience || '',
            member.preferredTime?.join('; ') || '',
            member.occupation || '',
            member.memo || ''
        ].map(value => `"${String(value).replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `members_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };


  return (
    <div className="flex-1 p-4 sm:p-6 bg-slate-100 overflow-y-auto">
      <Container>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <div>
            <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-slate-800`}>회원 관리</h2>
            <p className="text-slate-500 mt-1 text-sm sm:text-base">센터의 모든 회원을 관리합니다.</p>
          </div>
          {canManageMembers && (
              <button onClick={onAddMember} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700 w-full sm:w-auto justify-center">
                  <PlusIcon className="w-4 h-4" />
                  신규 회원 추가
              </button>
          )}
        </div>
        
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-white rounded-lg shadow-sm">
          <button onClick={handleDownloadCSV} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-green-700 w-full sm:w-auto justify-center">
            <DownloadIcon className="w-4 h-4" />
            CSV 다운로드
          </button>
          <div className="flex items-center gap-4">
            {/* 트레이너는 지점 선택을 할 수 없음 */}
            {currentUser?.role !== 'trainer' && (
              <select
                  value={filter.branchId}
                  onChange={e => setFilter({ ...filter, branchId: e.target.value })}
                  className="p-2 border rounded-md text-sm w-full sm:w-auto"
              >
                  <option value="">모든 지점</option>
                  {allBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* 데스크톱 테이블 */}
          <div className="hidden lg:block">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-4 font-semibold text-slate-600">회원명</th>
                  <th className="p-4 font-semibold text-slate-600">연락처</th>
                  <th className="p-4 font-semibold text-slate-600">소속 지점</th>
                  <th className="p-4 font-semibold text-slate-600">회원 상태</th>
                  <th className="p-4 font-semibold text-slate-600">최근 활동일</th>
                  <th className="p-4 font-semibold text-slate-600">최근 경과</th>
                  <th className="p-4 font-semibold text-slate-600 text-center">총 잔여 세션</th>
                  <th className="p-4 font-semibold text-slate-600 text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {enrichedMembers.map(member => (
                  <tr key={member.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => onMemberClick(member.id)}>
                    <td className="p-4 font-medium text-slate-800">{member.name}</td>
                    <td className="p-4 text-slate-600">{member.contact}</td>
                    <td className="p-4 text-slate-600">{branchMap.get(member.branchId) || member.branchId}</td>
                    <td className="p-4">
                       <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(member.status)}`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 font-mono">{member.lastActivityDate || '-'}</td>
                    <td className="p-4 text-slate-600 font-mono">
                      {member.daysSinceLastActivity !== null ? `${member.daysSinceLastActivity}일 전` : '-'}
                    </td>
                    <td className="p-4 text-slate-800 font-mono text-center font-semibold">{member.totalRemainingSessions} 회</td>
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        {canManageMembers && (
                            <>
                                <button onClick={() => onEditMember(member)} className="p-2 text-slate-500 hover:text-blue-600 rounded-full hover:bg-slate-100" title="수정">
                                    <EditIcon className="w-4 h-4" />
                                </button>
                                <button onClick={() => onDeleteMember(member.id)} className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-100" title="삭제">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* 태블릿 테이블 */}
          <div className="hidden sm:block lg:hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 font-semibold text-slate-600">회원명</th>
                  <th className="p-3 font-semibold text-slate-600">연락처</th>
                  <th className="p-3 font-semibold text-slate-600">상태</th>
                  <th className="p-3 font-semibold text-slate-600">잔여 세션</th>
                  <th className="p-3 font-semibold text-slate-600 text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {enrichedMembers.map(member => (
                  <tr key={member.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => onMemberClick(member.id)}>
                    <td className="p-3 font-medium text-slate-800">{member.name}</td>
                    <td className="p-3 text-slate-600 text-sm">{member.contact}</td>
                    <td className="p-3">
                       <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(member.status)}`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-800 font-mono text-center font-semibold">{member.totalRemainingSessions} 회</td>
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        {canManageMembers && (
                            <>
                                <button onClick={() => onEditMember(member)} className="p-2 text-slate-500 hover:text-blue-600 rounded-full hover:bg-slate-100" title="수정">
                                    <EditIcon className="w-4 h-4" />
                                </button>
                                <button onClick={() => onDeleteMember(member.id)} className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-100" title="삭제">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* 모바일 카드 뷰 */}
          <div className="sm:hidden">
            {enrichedMembers.map(member => (
              <div key={member.id} className="p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => onMemberClick(member.id)}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-slate-800">{member.name}</h3>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(member.status)}`}>
                    {member.status}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-slate-600">
                  <p>연락처: {member.contact}</p>
                  <p>지점: {branchMap.get(member.branchId) || member.branchId}</p>
                  <p>잔여 세션: <span className="font-semibold text-slate-800">{member.totalRemainingSessions} 회</span></p>
                  {member.lastActivityDate && (
                    <p>최근 활동: {member.lastActivityDate} ({member.daysSinceLastActivity !== null ? `${member.daysSinceLastActivity}일 전` : '-'})</p>
                  )}
                </div>
                {canManageMembers && (
                  <div className="flex items-center justify-end gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => onEditMember(member)} className="p-2 text-slate-500 hover:text-blue-600 rounded-full hover:bg-slate-100" title="수정">
                      <EditIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDeleteMember(member.id)} className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-100" title="삭제">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {members.length === 0 && (
              <div className="text-center py-16 px-6">
                  <h3 className="text-lg font-semibold text-slate-700">해당 조건의 회원이 없습니다.</h3>
                  <p className="text-slate-500 mt-2">'신규 회원 추가' 버튼을 눌러 새 회원을 등록하거나 필터를 변경해보세요.</p>
              </div>
          )}
        </div>
      </Container>
    </div>
  );
};
