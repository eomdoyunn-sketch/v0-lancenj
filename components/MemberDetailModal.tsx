import React, { useState } from 'react';
import { Member, Branch, Session, Trainer, MemberProgram } from '../types';
import { Modal } from './Modal';
import { DownloadIcon, CreditCardIcon, CalendarPlusIcon, CheckCircleIcon, CopyIcon, UserIcon } from './Icons';
import { SessionTracker } from './SessionCard';

export interface HistoryItem {
  date: string;
  time: string;
  type: '프로그램 등록' | '수업 예약' | '수업 완료';
  description: string;
  trainerName: string;
  amount: number;
  amountType: '결제' | '수업료' | '';
}

interface MemberDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    member: Member | null;
    history: HistoryItem[];
    members: Member[];
    programs: MemberProgram[];
    sessions: Session[];
    trainers: Trainer[];
    branches: Branch[];
    onShowTooltip: (content: React.ReactNode, rect: DOMRect) => void;
    onHideTooltip: () => void;
}

const historyTypes: HistoryItem['type'][] = ['프로그램 등록', '수업 예약', '수업 완료'];

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({ isOpen, onClose, member, history, members, programs, sessions, trainers, branches, onShowTooltip, onHideTooltip }) => {
    const [typeFilter, setTypeFilter] = useState<HistoryItem['type'] | '전체'>('전체');
    const [searchFilter, setSearchFilter] = useState('');
    const [showCopyToast, setShowCopyToast] = useState(false);

    if (!member) return null;

    const branchMap = new Map(branches.map(b => [b.id, b.name]));
    const memberBranchName = branchMap.get(member.branchId) || member.branchId;

    const referrer = member.referrerId ? members.find(m => m.id === member.referrerId) : null;

    const filteredHistory = history.filter(item => {
        const typeMatch = typeFilter === '전체' || item.type === typeFilter;
        const searchMatch = searchFilter === '' || 
            item.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
            item.trainerName.toLowerCase().includes(searchFilter.toLowerCase());
        return typeMatch && searchMatch;
    });

    const memberPrograms = programs
        .filter(p => p.memberIds.includes(member.id))
        .sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime());

    const getTypeInfo = (type: HistoryItem['type']) => {
        switch (type) {
            case '프로그램 등록': 
                return { 
                    icon: <CreditCardIcon className="w-4 h-4 text-blue-600"/>, 
                    chip: 'bg-blue-100 text-blue-800' 
                };
            case '수업 예약': 
                return { 
                    icon: <CalendarPlusIcon className="w-4 h-4 text-slate-600"/>, 
                    chip: 'bg-slate-100 text-slate-800' 
                };
            case '수업 완료': 
                return { 
                    icon: <CheckCircleIcon className="w-4 h-4 text-green-600"/>, 
                    chip: 'bg-green-100 text-green-800' 
                };
            default: 
                return { icon: null, chip: '' };
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(`${member.name} / ${member.contact}`);
        setShowCopyToast(true);
        setTimeout(() => setShowCopyToast(false), 2000);
    };

    const handleDownloadCSV = () => {
        const headers = ["일시", "구분", "내용", "담당 강사", "관련 금액(원)", "금액 구분"];
        const rows = filteredHistory.map(item => {
            const dateTime = `${item.date} ${item.time}`;
            return [
                `"${dateTime}"`,
                `"${item.type}"`,
                `"${item.description}"`,
                `"${item.trainerName}"`,
                item.amount > 0 ? item.amount : '',
                `"${item.amountType}"`
            ].join(',');
        });
        const csvContent = "\uFEFF" + [headers.join(','), ...rows].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `${member.name}_회원이력.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };
    
    const titleNode = (
      <div className="flex items-center gap-2 relative">
        <span>{`${member.name} 회원 상세 정보`}</span>
        <button onClick={handleCopy} className="p-1 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors">
          <CopyIcon className="w-4 h-4" />
        </button>
        {showCopyToast && (
          <div className="absolute left-0 top-full mt-2 bg-slate-800 text-white text-sm px-3 py-1.5 rounded-md shadow-lg animate-pulse">
            클립보드에 복사되었습니다.
          </div>
        )}
      </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={titleNode} maxWidth="max-w-4xl">
             <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <p className="font-semibold text-slate-500">연락처</p>
                        <p className="text-slate-800">{member.contact}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-slate-500">소속 지점</p>
                        <p className="text-slate-800">{memberBranchName}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-slate-500">소개 회원</p>
                        {referrer ? (
                            <div className="flex items-center gap-2 text-slate-800">
                                <UserIcon className="w-4 h-4 text-slate-400" />
                                <span>{referrer.name}</span>
                            </div>
                        ) : (
                            <p className="text-slate-500">-</p>
                        )}
                    </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                    <h3 className="text-base font-bold text-slate-800 mb-3">회원 상세 정보</h3>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                        <div className="col-span-1 md:col-span-2">
                            <dt className="font-semibold text-slate-500">주요 운동 목표</dt>
                            <dd className="text-slate-800 mt-1">
                                {member.exerciseGoals && member.exerciseGoals.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {member.exerciseGoals.map(goal => (
                                            <span key={goal} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">{goal}</span>
                                        ))}
                                    </div>
                                ) : <p className="text-slate-500">-</p>}
                            </dd>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <dt className="font-semibold text-slate-500">특이사항 / 부상 이력</dt>
                            <dd className="text-slate-800 mt-1 whitespace-pre-wrap">{member.medicalHistory || '-'}</dd>
                        </div>
                        <div className="col-span-1">
                            <dt className="font-semibold text-slate-500">운동 동기</dt>
                            <dd className="text-slate-800 mt-1">{member.motivation || '-'}</dd>
                        </div>
                        <div className="col-span-1">
                            <dt className="font-semibold text-slate-500">운동 경력</dt>
                            <dd className="text-slate-800 mt-1">{member.exerciseExperience || '-'}</dd>
                        </div>
                        <div className="col-span-1">
                            <dt className="font-semibold text-slate-500">직업</dt>
                            <dd className="text-slate-800 mt-1">{member.occupation || '-'}</dd>
                        </div>
                         <div className="col-span-1">
                            <dt className="font-semibold text-slate-500">선호 운동 시간대</dt>
                            <dd className="text-slate-800 mt-1">
                                {member.preferredTime && member.preferredTime.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {member.preferredTime.map(time => (
                                            <span key={time} className="px-2 py-1 bg-slate-200 text-slate-700 text-xs font-medium rounded-full">{time}</span>
                                        ))}
                                    </div>
                                ) : <p className="text-slate-500">-</p>}
                            </dd>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <dt className="font-semibold text-slate-500">메모</dt>
                            <dd className="text-slate-800 mt-1 whitespace-pre-wrap">{member.memo || '-'}</dd>
                        </div>
                    </dl>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-base font-bold text-slate-800 mb-3">프로그램별 세션 이력</h3>
                  <div className="max-h-[40vh] overflow-y-auto space-y-4 pr-2">
                    {memberPrograms.map(program => {
                        const programSessions = sessions.filter(s => s.programId === program.id);
                        
                        const getStatusChip = (status: string) => {
                            switch (status) {
                              case '유효': return 'bg-blue-100 text-blue-800';
                              case '정지': return 'bg-yellow-100 text-yellow-800';
                              case '만료': return 'bg-slate-200 text-slate-600';
                              default: return 'bg-gray-100 text-gray-800';
                            }
                        };

                        return (
                            <div key={program.id} className="p-3 bg-slate-50 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <div>
                                        <p className="font-semibold text-slate-800">{program.programName}</p>
                                        <p className="text-xs text-slate-500">{program.registrationDate} 등록</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(program.status)}`}>
                                        {program.status}
                                    </span>
                                </div>
                                <SessionTracker
                                  programId={program.id}
                                  totalSessions={program.totalSessions}
                                  sessions={programSessions}
                                  trainers={trainers}
                                  members={members}
                                  onSessionClick={() => {}}
                                  onShowTooltip={onShowTooltip}
                                  onHideTooltip={onHideTooltip}
                                />
                            </div>
                        )
                    })}
                    {memberPrograms.length === 0 && (
                        <p className="text-sm text-slate-500 text-center py-4">등록된 프로그램이 없습니다.</p>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-base font-bold text-slate-800 mb-3">활동 이력</h3>
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                      <div className="flex items-center gap-2 w-full flex-wrap">
                          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="p-2 border rounded-md text-sm">
                              <option value="전체">모든 구분</option>
                              {historyTypes.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <input 
                              type="text"
                              placeholder="내용/강사명 검색..."
                              value={searchFilter}
                              onChange={e => setSearchFilter(e.target.value)}
                              className="p-2 border rounded-md text-sm flex-grow"
                          />
                      </div>
                      <button onClick={handleDownloadCSV} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-green-700 flex-shrink-0 w-full md:w-auto">
                          <DownloadIcon className="w-4 h-4" />
                          이력 다운로드
                      </button>
                  </div>
                  <div className="max-h-[40vh] overflow-y-auto border rounded-lg mt-4">
                      <table className="w-full text-left whitespace-nowrap">
                          <thead className="bg-slate-50 sticky top-0">
                              <tr>
                                  <th className="p-3 font-semibold text-slate-600 text-sm">일시</th>
                                  <th className="p-3 font-semibold text-slate-600 text-sm">구분</th>
                                  <th className="p-3 font-semibold text-slate-600 text-sm">내용</th>
                                  <th className="p-3 font-semibold text-slate-600 text-sm">담당 강사</th>
                                  <th className="p-3 font-semibold text-slate-600 text-sm text-right">관련 금액</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                              {filteredHistory.map((item, index) => {
                                  const { icon, chip } = getTypeInfo(item.type);
                                  return (
                                      <tr key={index}>
                                          <td className="p-3 text-slate-700 font-mono text-sm">{item.date} {item.time === '00:00' && item.type === '프로그램 등록' ? '' : item.time}</td>
                                          <td className="p-3 text-sm">
                                              <div className={`inline-flex items-center gap-2 px-2 py-1 text-xs font-semibold rounded-full ${chip}`}>
                                                  {icon}
                                                  <span>{item.type}</span>
                                              </div>
                                          </td>
                                          <td className="p-3 text-slate-700 text-sm">{item.description}</td>
                                          <td className="p-3 text-slate-700 text-sm">{item.trainerName}</td>
                                          <td className="p-3 text-slate-800 font-mono text-sm text-right">
                                              {item.amount > 0 ? `${item.amount.toLocaleString()}원` : '-'}
                                              {item.amountType && <span className="text-xs text-slate-500 ml-1">({item.amountType})</span>}
                                          </td>
                                      </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                      {filteredHistory.length === 0 && (
                          <div className="text-center py-12 px-6">
                              <h3 className="text-md font-semibold text-slate-600">해당 조건의 활동 기록이 없습니다.</h3>
                          </div>
                      )}
                  </div>
                </div>
            </div>
        </Modal>
    );
};
