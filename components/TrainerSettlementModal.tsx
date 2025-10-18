import React, { useState, useEffect } from 'react';
import { Trainer, Session, MemberProgram, Member, Branch } from '../types';

interface TrainerSettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainer: Trainer | null;
  sessions: Session[];
  programs: MemberProgram[];
  members: Member[];
  allBranches: Branch[];
  currentUser: any;
}

interface SettlementData {
  sessionCount: number;
  totalFee: number;
  totalRevenue: number;
  sessions: Session[];
}

export const TrainerSettlementModal: React.FC<TrainerSettlementModalProps> = ({
  isOpen,
  onClose,
  trainer,
  sessions,
  programs,
  members,
  allBranches,
  currentUser
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [settlementData, setSettlementData] = useState<SettlementData>({
    sessionCount: 0,
    totalFee: 0,
    totalRevenue: 0,
    sessions: []
  });

  // 초기 날짜 설정 (이번 달)
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      
      setStartDate(formatDate(start));
      setEndDate(formatDate(end));
      setSelectedBranchId('');
    }
  }, [isOpen]);

  // 정산 데이터 계산
  useEffect(() => {
    if (!trainer || !startDate || !endDate) return;

    const programMap = new Map(programs.map(p => [p.id, p]));
    const memberMap = new Map(members.map(m => [m.id, m]));

    // 기간 필터링
    const filterStartDate = new Date(`${startDate}T00:00:00`);
    const filterEndDate = new Date(`${endDate}T23:59:59`);

    let filteredSessions = sessions.filter(s => {
      const sessionDate = new Date(`${s.date}T00:00:00`);
      return s.trainerId === trainer.id && 
             s.status === 'completed' &&
             sessionDate >= filterStartDate && 
             sessionDate <= filterEndDate;
    });

    // 지점 필터링
    if (selectedBranchId) {
      filteredSessions = filteredSessions.filter(s => {
        const program = programMap.get(s.programId);
        return program && program.branchId === selectedBranchId;
      });
    }

    // 권한 필터링 (트레이너는 본인 데이터만)
    if (currentUser?.role === 'trainer' && currentUser.trainerProfileId === trainer.id) {
      // 이미 trainer.id로 필터링되어 있음
    }

    const totalFee = filteredSessions.reduce((acc, s) => acc + (s.trainerFee || 0), 0);
    const totalRevenue = filteredSessions.reduce((acc, s) => acc + (s.sessionFee || 0), 0);

    setSettlementData({
      sessionCount: filteredSessions.length,
      totalFee,
      totalRevenue,
      sessions: filteredSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    });
  }, [trainer, sessions, programs, startDate, endDate, selectedBranchId, currentUser]);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const setThisMonth = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
  };

  const setLastMonth = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
  };

  const setAllTime = () => {
    if (sessions.length === 0) return;
    
    const trainerSessions = sessions.filter(s => s.trainerId === trainer?.id && s.status === 'completed');
    if (trainerSessions.length === 0) return;

    const dates = trainerSessions.map(s => new Date(s.date));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    setStartDate(formatDate(minDate));
    setEndDate(formatDate(maxDate));
  };

  const downloadSettlement = () => {
    if (!trainer || settlementData.sessions.length === 0) return;

    const programMap = new Map(programs.map(p => [p.id, p]));
    const memberMap = new Map(members.map(m => [m.id, m]));
    const branchMap = new Map(allBranches.map(b => [b.id, b.name]));

    // CSV 데이터 생성
    const csvData = [
      ['수업일시', '프로그램명', '참석 회원', '지점', '단가', '강사료', '수업료', '요율'],
      ...settlementData.sessions.map(session => {
        const program = programMap.get(session.programId);
        const attendedMembers = session.attendedMemberIds.map(id => memberMap.get(id)?.name || id).join(', ');
        const branchName = program ? branchMap.get(program.branchId) || program.branchId : '';
        const rateText = session.trainerRate === -1 ? '고정' : `${(session.trainerRate * 100).toFixed(1)}%`;
        
        return [
          `${session.date} ${session.startTime}`,
          program?.programName || '',
          attendedMembers,
          branchName,
          program?.unitPrice?.toLocaleString() || '0',
          session.trainerFee?.toLocaleString() || '0',
          session.sessionFee?.toLocaleString() || '0',
          rateText
        ];
      })
    ];

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${trainer.name}_정산내역_${startDate}_${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen || !trainer) return null;

  const programMap = new Map(programs.map(p => [p.id, p]));
  const memberMap = new Map(members.map(m => [m.id, m]));
  const branchMap = new Map(allBranches.map(b => [b.id, b.name]));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 lg:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full h-full lg:h-auto lg:min-w-[1200px] lg:max-w-[98vw] xl:max-w-[95vw] 2xl:max-w-[90vw] lg:max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 lg:p-6 border-b border-slate-200">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg lg:text-2xl font-bold text-slate-800 truncate">{trainer.name} 강사 정산 내역</h2>
            <p className="text-sm lg:text-base text-slate-600 mt-1">상세 정산 내역 및 다운로드</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl font-bold ml-4 flex-shrink-0"
          >
            ×
          </button>
        </div>

        <div className="p-3 lg:p-6 overflow-y-auto max-h-[calc(100vh-120px)] lg:max-h-[calc(90vh-140px)]">
          {/* 기간 설정 및 필터 */}
          <div className="mb-4 lg:mb-6 p-3 lg:p-4 bg-slate-50 rounded-lg">
            <div className="space-y-4">
              {/* 날짜 필터 */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <label className="text-sm font-medium text-slate-700 whitespace-nowrap">기간:</label>
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input 
                      type="date" 
                      value={startDate} 
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full sm:w-auto p-2 border rounded-md text-sm min-h-[44px]"
                    />
                    <span className="text-slate-500">~</span>
                    <input 
                      type="date" 
                      value={endDate} 
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full sm:w-auto p-2 border rounded-md text-sm min-h-[44px]"
                    />
                  </div>
                </div>
                
                {/* 빠른 선택 버튼 */}
                <div className="flex flex-wrap gap-2">
                  <button onClick={setAllTime} className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 min-h-[44px] touch-manipulation">
                    전체
                  </button>
                  <button onClick={setThisMonth} className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 min-h-[44px] touch-manipulation">
                    이번 달
                  </button>
                  <button onClick={setLastMonth} className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 min-h-[44px] touch-manipulation">
                    지난 달
                  </button>
                </div>
              </div>

              {/* 지점 필터 */}
              {currentUser?.role === 'admin' && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <label className="text-sm font-medium text-slate-700 whitespace-nowrap">지점:</label>
                  <select 
                    value={selectedBranchId} 
                    onChange={e => setSelectedBranchId(e.target.value)}
                    className="w-full sm:w-auto p-2 border rounded-md text-sm min-h-[44px]"
                  >
                    <option value="">모든 지점</option>
                    {allBranches.map(branch => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 요약 정보 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 mt-4">
              <div className="bg-white p-3 lg:p-4 rounded-lg border">
                <h3 className="text-slate-500 text-sm font-medium">총 수업 횟수</h3>
                <p className="text-xl lg:text-2xl font-bold text-blue-600 mt-1">{settlementData.sessionCount}회</p>
              </div>
              <div className="bg-white p-3 lg:p-4 rounded-lg border">
                <h3 className="text-slate-500 text-sm font-medium">총 강사료</h3>
                <p className="text-xl lg:text-2xl font-bold text-green-600 mt-1">₩{settlementData.totalFee.toLocaleString()}</p>
              </div>
              <div className="bg-white p-3 lg:p-4 rounded-lg border sm:col-span-2 lg:col-span-1">
                <h3 className="text-slate-500 text-sm font-medium">총 수업료</h3>
                <p className="text-xl lg:text-2xl font-bold text-purple-600 mt-1">₩{settlementData.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* 다운로드 버튼 */}
          <div className="mb-4 flex justify-center lg:justify-end">
            <button
              onClick={downloadSettlement}
              disabled={settlementData.sessions.length === 0}
              className="w-full sm:w-auto px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px] touch-manipulation"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              정산 내역 다운로드
            </button>
          </div>

          {/* 상세 내역 - 데스크톱 테이블 뷰 */}
          <div className="hidden lg:block bg-white rounded-lg border overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto overflow-x-hidden">
              <table className="w-full text-left table-fixed">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="p-3 font-semibold text-slate-600 text-sm w-[18%]">수업일시</th>
                    <th className="p-3 font-semibold text-slate-600 text-sm w-[18%]">프로그램명</th>
                    <th className="p-3 font-semibold text-slate-600 text-sm w-[22%]">참석 회원</th>
                    <th className="p-3 font-semibold text-slate-600 text-sm w-[8%]">지점</th>
                    <th className="p-3 font-semibold text-slate-600 text-sm text-right w-[10%]">단가</th>
                    <th className="p-3 font-semibold text-slate-600 text-sm text-right w-[10%]">강사료</th>
                    <th className="p-3 font-semibold text-slate-600 text-sm text-right w-[10%]">수업료</th>
                    <th className="p-3 font-semibold text-slate-600 text-sm text-center w-[4%]">요율</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {settlementData.sessions.map(session => {
                    const program = programMap.get(session.programId);
                    const attendedMembers = session.attendedMemberIds.map(id => memberMap.get(id)?.name || id).join(', ');
                    const branchName = program ? branchMap.get(program.branchId) || program.branchId : '';
                    const rateText = session.trainerRate === -1 ? '고정' : `${(session.trainerRate * 100).toFixed(1)}%`;
                    
                    return (
                      <tr key={session.id} className="hover:bg-slate-50">
                        <td className="p-3 text-sm text-slate-800 w-[18%]">
                          <div className="truncate" title={`${session.date} ${session.startTime}`}>
                            {session.date} {session.startTime}
                          </div>
                        </td>
                        <td className="p-3 text-sm text-slate-800 w-[18%]">
                          <div className="truncate" title={program?.programName || '-'}>
                            {program?.programName || '-'}
                          </div>
                        </td>
                        <td className="p-3 text-sm text-slate-600 w-[22%]">
                          <div className="truncate" title={attendedMembers || '-'}>
                            {attendedMembers || '-'}
                          </div>
                        </td>
                        <td className="p-3 text-sm text-slate-600 w-[8%]">
                          <div className="truncate" title={branchName || '-'}>
                            {branchName || '-'}
                          </div>
                        </td>
                        <td className="p-3 text-sm text-slate-600 text-right font-mono w-[10%]">
                          ₩{program?.unitPrice?.toLocaleString() || '0'}
                        </td>
                        <td className="p-3 text-sm text-slate-800 text-right font-mono font-semibold w-[10%]">
                          ₩{session.trainerFee?.toLocaleString() || '0'}
                        </td>
                        <td className="p-3 text-sm text-slate-600 text-right font-mono w-[10%]">
                          ₩{session.sessionFee?.toLocaleString() || '0'}
                        </td>
                        <td className="p-3 text-sm text-slate-600 text-center w-[4%]">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            session.trainerRate === -1 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {rateText}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {settlementData.sessions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-10 px-6 text-slate-500">
                        해당 기간의 정산 내역이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 상세 내역 - 모바일 카드 뷰 */}
          <div className="lg:hidden space-y-3">
            {settlementData.sessions.length === 0 ? (
              <div className="text-center py-10 px-6 text-slate-500 bg-white rounded-lg border">
                해당 기간의 정산 내역이 없습니다.
              </div>
            ) : (
              settlementData.sessions.map(session => {
                const program = programMap.get(session.programId);
                const attendedMembers = session.attendedMemberIds.map(id => memberMap.get(id)?.name || id).join(', ');
                const branchName = program ? branchMap.get(program.branchId) || program.branchId : '';
                const rateText = session.trainerRate === -1 ? '고정' : `${(session.trainerRate * 100).toFixed(1)}%`;
                
                return (
                  <div key={session.id} className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="space-y-3">
                      {/* 수업일시 */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600">수업일시</span>
                        <span className="text-sm text-slate-800 font-semibold">
                          {session.date} {session.startTime}
                        </span>
                      </div>
                      
                      {/* 프로그램명 */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600">프로그램명</span>
                        <span className="text-sm text-slate-800">{program?.programName || '-'}</span>
                      </div>
                      
                      {/* 참석 회원 */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600">참석 회원</span>
                        <span className="text-sm text-slate-800">{attendedMembers || '-'}</span>
                      </div>
                      
                      {/* 지점 */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600">지점</span>
                        <span className="text-sm text-slate-800">{branchName || '-'}</span>
                      </div>
                      
                      {/* 금액 정보 */}
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                        <div className="text-center">
                          <span className="text-xs text-slate-500 block">단가</span>
                          <span className="text-sm font-mono text-slate-600">
                            ₩{program?.unitPrice?.toLocaleString() || '0'}
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="text-xs text-slate-500 block">강사료</span>
                          <span className="text-sm font-mono font-semibold text-green-600">
                            ₩{session.trainerFee?.toLocaleString() || '0'}
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="text-xs text-slate-500 block">수업료</span>
                          <span className="text-sm font-mono text-slate-600">
                            ₩{session.sessionFee?.toLocaleString() || '0'}
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="text-xs text-slate-500 block">요율</span>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                            session.trainerRate === -1 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {rateText}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

