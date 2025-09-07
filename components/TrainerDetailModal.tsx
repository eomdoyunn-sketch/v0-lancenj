import React, { useState } from 'react';
import { Member, MemberProgram, Session, Trainer } from '../types';
import { Modal } from './Modal';
import { DownloadIcon } from './Icons';

interface TrainerDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    trainer: Trainer | null;
    sessions: Session[];
    programs: MemberProgram[];
    members: Member[];
    startDate: string;
    endDate: string;
}

export const TrainerDetailModal: React.FC<TrainerDetailModalProps> = ({ isOpen, onClose, trainer, sessions, programs, members, startDate, endDate }) => {
    const [searchFilter, setSearchFilter] = useState('');

    if (!trainer) return null;

    const programMap = new Map(programs.map(p => [p.id, p]));
    const memberMap = new Map(members.map(m => [m.id, m]));

    const getAttendedNames = (ids: string[]) => ids.map(id => memberMap.get(id)?.name || 'N/A').join(', ');

    const filteredSessions = sessions.filter(session => {
        if (searchFilter === '') return true;
        const program = programMap.get(session.programId);
        const lowercasedFilter = searchFilter.toLowerCase();
        
        const programNameMatch = program?.programName.toLowerCase().includes(lowercasedFilter);
        const memberNameMatch = getAttendedNames(session.attendedMemberIds).toLowerCase().includes(lowercasedFilter);
        
        return programNameMatch || memberNameMatch;
    });
    
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    }
    const periodTitle = `${formatDate(startDate)} ~ ${formatDate(endDate)}`;

    const totalSessionsCount = filteredSessions.length;
    const totalFeeSum = filteredSessions.reduce((acc, session) => acc + session.trainerFee, 0);

    const handleDownloadCSV = () => {
        const headers = ["수업일시", "프로그램명", "참석 회원", "단가(원)", "적용 요율(%)", "수업료(원)"];
        
        const rows = filteredSessions.map(session => {
            const program = programMap.get(session.programId);
            return [
                `"${session.date} ${session.startTime}"`,
                `"${program?.programName || 'N/A'}"`,
                `"${getAttendedNames(session.attendedMemberIds)}"`,
                program?.unitPrice || 0,
                session.trainerRate * 100,
                session.trainerFee
            ].join(',');
        });

        const totalRow = ["총계", "", "", "", `"${totalSessionsCount}회"`, `"${totalFeeSum}"`].join(',');

        const csvContent = "\uFEFF" + [headers.join(','), ...rows, totalRow].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `${formatDate(startDate)}-${formatDate(endDate)}_${trainer.name}_정산내역.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const title = `${periodTitle} ${trainer.name} 강사 정산 내역`;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-4xl">
            <div className="space-y-4">
                <div className="flex justify-between items-center gap-4">
                    <input 
                        type="text"
                        placeholder="프로그램/회원명 검색..."
                        value={searchFilter}
                        onChange={e => setSearchFilter(e.target.value)}
                        className="p-2 border rounded-md w-full md:w-72 text-sm"
                    />
                    <button onClick={handleDownloadCSV} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-green-700 flex-shrink-0">
                        <DownloadIcon className="w-4 h-4" />
                        CSV 다운로드
                    </button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto border rounded-lg">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-slate-50 sticky top-0">
                            <tr>
                                <th className="p-3 font-semibold text-slate-600 text-sm">수업일시</th>
                                <th className="p-3 font-semibold text-slate-600 text-sm">프로그램명</th>
                                <th className="p-3 font-semibold text-slate-600 text-sm">참석 회원</th>
                                <th className="p-3 font-semibold text-slate-600 text-sm text-right">단가</th>
                                <th className="p-3 font-semibold text-slate-600 text-sm text-right">강사료 책정</th>
                                <th className="p-3 font-semibold text-slate-600 text-sm text-right">수업료</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredSessions.map(session => {
                                const program = programMap.get(session.programId);
                                return (
                                    <tr key={session.id}>
                                        <td className="p-3 text-slate-700 font-mono text-sm">{session.date} {session.startTime}</td>
                                        <td className="p-3 text-slate-700 text-sm">{program?.programName}</td>
                                        <td className="p-3 text-slate-700 text-sm">{getAttendedNames(session.attendedMemberIds)}</td>
                                        <td className="p-3 text-slate-600 font-mono text-sm text-right">{program?.unitPrice.toLocaleString()}원</td>
                                        <td className="p-3 text-slate-600 font-mono text-sm text-right">
                                            {session.trainerRate === -1 
                                                ? `고정액` 
                                                : `${(session.trainerRate * 100).toFixed(0)}%`}
                                        </td>
                                        <td className="p-3 text-slate-800 font-semibold font-mono text-sm text-right">{session.trainerFee.toLocaleString()}원</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                                <td colSpan={4} className="p-3 text-slate-800 text-sm text-right">총계</td>
                                <td className="p-3 text-slate-800 font-mono text-sm text-right">{totalSessionsCount}회</td>
                                <td className="p-3 text-slate-800 font-mono text-sm text-right">{totalFeeSum.toLocaleString()}원</td>
                            </tr>
                        </tfoot>
                    </table>
                     {filteredSessions.length === 0 && (
                        <div className="text-center py-12 px-6">
                            <h3 className="text-md font-semibold text-slate-600">해당 조건의 수업 내역이 없습니다.</h3>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};