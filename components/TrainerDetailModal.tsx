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
    const [modalStartDate, setModalStartDate] = useState(startDate);
    const [modalEndDate, setModalEndDate] = useState(endDate);

    // 모달이 열릴 때마다 초기 날짜를 현재 선택된 기간으로 설정
    React.useEffect(() => {
        if (isOpen) {
            setModalStartDate(startDate);
            setModalEndDate(endDate);
        }
    }, [isOpen, startDate, endDate]);

    if (!trainer) return null;

    const programMap = new Map(programs.map(p => [p.id, p]));
    const memberMap = new Map(members.map(m => [m.id, m]));

    const getAttendedNames = (ids: string[]) => ids.map(id => memberMap.get(id)?.name || 'N/A').join(', ');

    // 날짜 필터링 함수
    const toYYYYMMDD = (date: Date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // 퀵 필터 함수들
    const setThisMonth = () => {
        console.log('이번 달 버튼 클릭됨');
        const today = new Date();
        const y = today.getFullYear();
        const m = today.getMonth();
        const start = new Date(y, m, 1);
        const end = new Date(y, m + 1, 0);
        const startStr = toYYYYMMDD(start);
        const endStr = toYYYYMMDD(end);
        console.log('이번 달 설정:', startStr, '~', endStr);
        setModalStartDate(startStr);
        setModalEndDate(endStr);
    };

    const setLastMonth = () => {
        console.log('지난 달 버튼 클릭됨');
        const today = new Date();
        const y = today.getFullYear();
        const m = today.getMonth();
        const start = new Date(y, m - 1, 1);
        const end = new Date(y, m, 0);
        const startStr = toYYYYMMDD(start);
        const endStr = toYYYYMMDD(end);
        console.log('지난 달 설정:', startStr, '~', endStr);
        setModalStartDate(startStr);
        setModalEndDate(endStr);
    };

    const setAllTime = () => {
        console.log('전체 버튼 클릭됨');
        // 실제 데이터가 있는 범위를 동적으로 계산
        const allSessionDates = sessions.map(s => new Date(`${s.date}T00:00:00`));
        console.log('전체 기간 계산 - 세션 수:', allSessionDates.length);
        
        if (allSessionDates.length === 0) {
            // 데이터가 없으면 현재 년도로 설정
            const today = new Date();
            const start = new Date(today.getFullYear(), 0, 1);
            const end = new Date(today.getFullYear(), 11, 31);
            const startStr = toYYYYMMDD(start);
            const endStr = toYYYYMMDD(end);
            console.log('전체 기간 설정 (데이터 없음):', startStr, '~', endStr);
            setModalStartDate(startStr);
            setModalEndDate(endStr);
        } else {
            // 가장 이른 날짜와 가장 늦은 날짜 찾기
            const minDate = new Date(Math.min(...allSessionDates.map(d => d.getTime())));
            const maxDate = new Date(Math.max(...allSessionDates.map(d => d.getTime())));
            
            // 월 단위로 정리 (각 월의 1일과 마지막 날로 설정)
            const start = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
            const end = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);
            
            const startStr = toYYYYMMDD(start);
            const endStr = toYYYYMMDD(end);
            console.log('전체 기간 설정 (데이터 있음):', startStr, '~', endStr);
            setModalStartDate(startStr);
            setModalEndDate(endStr);
        }
    };

    // 전체 기간이 선택되었는지 확인하는 함수
    const isAllTimeSelected = () => {
        if (sessions.length === 0) return false;
        
        const allSessionDates = sessions.map(s => new Date(`${s.date}T00:00:00`));
        const minDate = new Date(Math.min(...allSessionDates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...allSessionDates.map(d => d.getTime())));
        
        const dataStart = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
        const dataEnd = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);
        
        const currentStart = new Date(`${modalStartDate}T00:00:00`);
        const currentEnd = new Date(`${modalEndDate}T23:59:59`);
        
        return currentStart.getTime() === dataStart.getTime() && 
               currentEnd.getTime() === dataEnd.getTime();
    };

    // 날짜 필터링된 세션들
    const dateFilteredSessions = sessions.filter(session => {
        const sessionDate = new Date(`${session.date}T00:00:00`);
        const filterStartDate = new Date(`${modalStartDate}T00:00:00`);
        const filterEndDate = new Date(`${modalEndDate}T23:59:59`);
        return sessionDate >= filterStartDate && sessionDate <= filterEndDate;
    });

    // 디버깅을 위한 로그 - 모달이 열릴 때만 출력
    if (isOpen) {
        console.log('=== TrainerDetailModal 디버깅 정보 ===');
        console.log('TrainerDetailModal - trainer:', trainer?.name);
        console.log('TrainerDetailModal - sessions count:', sessions.length);
        console.log('TrainerDetailModal - modalStartDate:', modalStartDate);
        console.log('TrainerDetailModal - modalEndDate:', modalEndDate);
        console.log('TrainerDetailModal - dateFilteredSessions count:', dateFilteredSessions.length);
        console.log('TrainerDetailModal - sessions sample:', sessions.slice(0, 3).map(s => ({ id: s.id, date: s.date, trainerId: s.trainerId, status: s.status })));
        console.log('=== 디버깅 정보 끝 ===');
    }

    // 검색 필터링된 세션들
    const filteredSessions = dateFilteredSessions.filter(session => {
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
    const periodTitle = `${formatDate(modalStartDate)} ~ ${formatDate(modalEndDate)}`;

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
            link.setAttribute("download", `${formatDate(modalStartDate)}-${formatDate(modalEndDate)}_${trainer.name}_정산내역.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const title = `${periodTitle} ${trainer.name} 강사 정산 내역`;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-7xl">
            <div className="space-y-4">
                {/* 날짜 필터와 퀵 필터 */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 flex-wrap">
                        <input 
                            type="date" 
                            value={modalStartDate} 
                            onChange={e => setModalStartDate(e.target.value)} 
                            className="p-2 border rounded-md shadow-sm text-sm"
                        />
                        <span>~</span>
                        <input 
                            type="date" 
                            value={modalEndDate} 
                            onChange={e => setModalEndDate(e.target.value)} 
                            className="p-2 border rounded-md shadow-sm text-sm"
                        />
                        <button 
                            onClick={setAllTime} 
                            className={`px-3 py-2 rounded-md shadow-sm text-sm font-medium border ${
                                isAllTimeSelected() 
                                    ? 'bg-blue-500 text-white border-blue-500' 
                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                        >
                            전체
                        </button>
                        <button onClick={setThisMonth} className="px-3 py-2 bg-white text-slate-700 rounded-md shadow-sm text-sm font-medium hover:bg-slate-100 border">이번 달</button>
                        <button onClick={setLastMonth} className="px-3 py-2 bg-white text-slate-700 rounded-md shadow-sm text-sm font-medium hover:bg-slate-100 border">지난 달</button>
                    </div>
                </div>
                
                {/* 검색 필터와 다운로드 버튼 */}
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