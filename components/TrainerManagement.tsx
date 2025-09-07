import React from 'react';
import { Trainer, Branch, BranchRate } from '../types';
import { PlusIcon, EditIcon, TrashIcon } from './Icons';

interface TrainerManagementProps {
  trainers: Trainer[];
  allBranches: Branch[];
  onAddTrainer: () => void;
  onEditTrainer: (trainer: Trainer) => void;
  onDeleteTrainer: (trainerId: string) => void;
}

export const TrainerManagement: React.FC<TrainerManagementProps> = ({ trainers, allBranches, onAddTrainer, onEditTrainer, onDeleteTrainer }) => {
  const branchMap = new Map(allBranches.map(b => [b.id, b.name]));

  const formatRate = (rate: BranchRate) => {
    if (rate.type === 'percentage') {
      return `${(rate.value * 100).toFixed(0)}%`;
    }
    return `${rate.value.toLocaleString()}원`;
  };

  return (
    <div className="flex-1 p-6 bg-slate-100 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">강사 관리</h2>
          <p className="text-slate-500 mt-1">센터의 모든 강사 정보를 관리합니다.</p>
        </div>
        <button onClick={onAddTrainer} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700">
          <PlusIcon className="w-4 h-4" />
          신규 강사 추가
        </button>
      </div>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-4 font-semibold text-slate-600">강사명</th>
              <th className="p-4 font-semibold text-slate-600">색상</th>
              <th className="p-4 font-semibold text-slate-600">상태</th>
              <th className="p-4 font-semibold text-slate-600">지점별 수업료</th>
              <th className="p-4 font-semibold text-slate-600">소속 지점</th>
              <th className="p-4 font-semibold text-slate-600 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {trainers.map(trainer => (
              <tr key={trainer.id}>
                <td className="p-4 font-medium text-slate-800">{trainer.name}</td>
                 <td className="p-4">
                  <div className={`w-6 h-6 rounded-full ${trainer.color}`}></div>
                </td>
                <td className="p-4">
                   <span className={`px-2 py-1 text-xs font-semibold rounded-full ${trainer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {trainer.isActive ? '활성' : '비활성'}
                  </span>
                </td>
                <td className="p-4 text-slate-600 text-xs">
                  {Object.entries(trainer.branchRates).map(([branchId, rate]) => (
                    <div key={branchId}>{`${branchMap.get(branchId) || branchId}: ${formatRate(rate)}`}</div>
                  ))}
                </td>
                <td className="p-4 text-slate-600">{trainer.branchIds.map(id => branchMap.get(id) || id).join(', ')}</td>
                <td className="p-4">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => onEditTrainer(trainer)} className="p-2 text-slate-500 hover:text-blue-600 rounded-full hover:bg-slate-100">
                      <EditIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDeleteTrainer(trainer.id)} className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-100">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
         {trainers.length === 0 && (
            <div className="text-center py-16 px-6">
                <h3 className="text-lg font-semibold text-slate-700">등록된 강사가 없습니다.</h3>
                <p className="text-slate-500 mt-2">'신규 강사 추가' 버튼을 눌러 새 강사를 등록하세요.</p>
            </div>
        )}
      </div>
    </div>
  );
};