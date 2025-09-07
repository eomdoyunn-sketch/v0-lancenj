import React, { useState, useMemo } from 'react';
import { AuditLog, User, Branch } from '../types';
import { FileTextIcon } from './Icons';

interface LogManagementProps {
  logs: AuditLog[];
  branches: Branch[];
  currentUser: User | null;
}

export const LogManagement: React.FC<LogManagementProps> = ({ logs, branches, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<'all' | AuditLog['action']>('all');
  
  const branchMap = new Map(branches.map(b => [b.id, b.name]));

  const filteredLogs = useMemo(() => {
    let logsToFilter = logs;

    if (currentUser?.role === 'manager' && currentUser.assignedBranchIds) {
        const managerBranches = currentUser.assignedBranchIds;
        logsToFilter = logs.filter(log => !log.branchId || managerBranches.includes(log.branchId));
    }
      
    return logsToFilter.filter(log => {
      const searchTermLower = searchTerm.toLowerCase();
      const searchMatch = 
        log.details.toLowerCase().includes(searchTermLower) ||
        log.entityName.toLowerCase().includes(searchTermLower) ||
        log.user.toLowerCase().includes(searchTermLower);
      
      const actionMatch = actionFilter === 'all' || log.action === actionFilter;

      return searchMatch && actionMatch;
    });
  }, [logs, searchTerm, actionFilter, currentUser]);

  const getActionChip = (action: AuditLog['action']) => {
    switch (action) {
      case '생성': return 'bg-blue-100 text-blue-800';
      case '수정': return 'bg-yellow-100 text-yellow-800';
      case '삭제': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };
  
  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 p-6 bg-slate-100 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">로그 관리</h2>
          <p className="text-slate-500 mt-1">시스템 내 주요 변경 사항에 대한 이력을 확인합니다.</p>
        </div>
      </div>

      <div className="mb-4 flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-white rounded-lg shadow-sm">
        <div className="flex items-center gap-4 flex-wrap">
          <input 
            type="text"
            placeholder="내용, 담당자 검색..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="p-2 border rounded-md w-64 text-sm"
          />
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value as any)}
            className="p-2 border rounded-md text-sm"
          >
            <option value="all">모든 작업</option>
            <option value="생성">생성</option>
            <option value="수정">수정</option>
            <option value="삭제">삭제</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full whitespace-nowrap">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">시간</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">작업</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">담당자</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">소속 지점</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">내용</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredLogs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="p-4 text-sm text-slate-600 font-mono">{formatTimestamp(log.timestamp)}</td>
                <td className="p-4 text-sm">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionChip(log.action)}`}>
                    {log.action}
                  </span>
                </td>
                <td className="p-4 text-sm text-slate-800 font-medium">{log.user}</td>
                <td className="p-4 text-sm text-slate-600">{log.branchId ? branchMap.get(log.branchId) : 'N/A'}</td>
                <td className="p-4 text-sm text-slate-600 whitespace-normal">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredLogs.length === 0 && (
          <div className="text-center py-16 px-6">
            <FileTextIcon className="w-12 h-12 mx-auto text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-700 mt-4">해당 조건의 로그가 없습니다.</h3>
            <p className="text-slate-500 mt-2">검색어나 필터를 변경해보세요.</p>
          </div>
        )}
      </div>
    </div>
  );
};
