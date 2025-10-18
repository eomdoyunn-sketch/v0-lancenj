import React, { useState } from 'react';
import { User, ProgramPreset, Branch, Trainer, UserRole } from '../types';
import { PlusIcon, EditIcon, TrashIcon, SettingsIcon, ShieldCheckIcon } from './Icons';

interface ManagementViewProps {
    currentUser: User | null;
    users: User[];
    trainers: Trainer[];
    allBranches: Branch[];
    presets: ProgramPreset[];
    onAddUser: (context?: { role: UserRole; branchId: string; }) => void;
    onDeleteUser: (userId: string) => void;
    onUpdateManagerBranches: (userId: string, newBranches: string[]) => void;
    onUpdateUserRole: (userId: string, newRole: UserRole, branchId?: string) => void;
    onUpdateUsersBranch: (userNames: string[], branchId: string) => void;
    onAddPreset: () => void;
    onEditPreset: (preset: ProgramPreset) => void;
    onDeletePreset: (presetId: string) => void;
    onAddBranch: () => void;
    onEditBranch: (branch: Branch) => void;
    onDeleteBranch: (branchId: string) => void;
    onAddTrainer: () => void;
    onEditTrainer: (trainer: Trainer) => void;
    onDeleteTrainer: (trainerId: string) => void;
    onRestoreTrainer: (trainerId: string) => void;
    onUpdateTrainerBranches: (trainerId: string, newBranchIds: string[]) => void;
}

type ManagementTab = 'branches' | 'presets' | 'trainers';

export const ManagementView: React.FC<ManagementViewProps> = ({
    currentUser,
    users,
    trainers,
    allBranches,
    presets,
    onAddUser,
    onDeleteUser,
    onUpdateManagerBranches,
    onUpdateUserRole,
    onUpdateUsersBranch,
    onAddPreset,
    onEditPreset,
    onDeletePreset,
    onAddBranch,
    onEditBranch,
    onDeleteBranch,
    onAddTrainer,
    onEditTrainer,
    onDeleteTrainer,
    onRestoreTrainer,
    onUpdateTrainerBranches,
}) => {
    const defaultTab: ManagementTab = currentUser?.role === 'admin' ? 'branches' : 'presets';
    const [activeTab, setActiveTab] = useState<ManagementTab>(defaultTab);
    const [selectedBranch, setSelectedBranch] = useState<string>('');

    const branchMap = new Map(allBranches.map(b => [b.id, b.name]));

    const renderBranches = () => (
        <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
                <p className="text-slate-500">지점 정보를 관리합니다. 지점은 프로그램 프리셋과 회원 관리의 기본 단위입니다.</p>
                <button onClick={onAddBranch} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
                    <PlusIcon className="w-4 h-4" />
                    지점 추가
                </button>
            </div>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50">
                        <tr>
                          <th className="p-4 font-semibold text-slate-600">지점명</th>
                          <th className="p-4 font-semibold text-slate-600">등록일</th>
                          <th className="p-4 font-semibold text-slate-600 text-center">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {allBranches.map(branch => (
                            <tr key={branch.id} className="hover:bg-slate-50">
                                <td className="p-4 font-medium text-slate-800">{branch.name}</td>
                                <td className="p-4 text-slate-600">
                                    {branch.createdAt ? new Date(branch.createdAt).toLocaleDateString() : '알 수 없음'}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <button onClick={() => onEditBranch(branch)} className="p-2 text-slate-500 hover:text-blue-600 rounded-full hover:bg-slate-100" title="수정">
                                            <EditIcon className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => onDeleteBranch(branch.id)} className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-100" title="삭제">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {allBranches.length === 0 && (
                    <div className="text-center py-16 px-6">
                        <h3 className="text-lg font-semibold text-slate-700">등록된 지점이 없습니다.</h3>
                        <p className="text-slate-500 mt-2">'지점 추가' 버튼을 눌러 새 지점을 등록하세요.</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderTrainers = () => {
        // 지점 필터링된 강사 목록
        const filteredTrainers = selectedBranch === '' 
            ? trainers 
            : trainers.filter(trainer => trainer.branchIds.includes(selectedBranch));

        return (
            <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                    <p className="text-slate-500">강사 정보를 관리합니다. 강사 수업료와 지점 배정을 설정할 수 있습니다.</p>
                    <button onClick={onAddTrainer} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
                        <PlusIcon className="w-4 h-4" />
                        강사 추가
                    </button>
                </div>

                {/* 지점 필터 */}
                <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-slate-700">지점 필터:</label>
                        <select
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
                        >
                            <option value="">전체 지점</option>
                            {allBranches.map(branch => (
                                <option key={branch.id} value={branch.id}>{branch.name}</option>
                            ))}
                        </select>
                        <span className="text-sm text-slate-500">
                            {filteredTrainers.length}명의 강사
                        </span>
                    </div>
                </div>


            <div className="style={{ backgroundColor: '#F1F5F9' }} shadow-sm rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="p-4 font-semibold text-slate-600 text-left">강사명</th>
                            <th className="p-4 font-semibold text-slate-600">이메일</th>
                            <th className="p-4 font-semibold text-slate-600">상태</th>
                            <th className="p-4 font-semibold text-slate-600">지점별 수업료</th>
                            <th className="p-4 font-semibold text-slate-600">소속 지점</th>
                            <th className="p-4 font-semibold text-slate-600 text-center">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {filteredTrainers.map(trainer => {
                            // 강사와 연결된 사용자 찾기
                            const connectedUser = users.find(user => user.trainerProfileId === trainer.id);
                            
                            return (
                                <tr key={trainer.id} className="hover:bg-slate-50">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div 
                                                className="w-6 h-6 rounded-full border-2 border-slate-300" 
                                                style={{ backgroundColor: trainer.color }}
                                            ></div>
                                            <span className="font-medium text-slate-800">{trainer.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-sm text-slate-600">
                                            {connectedUser?.email || '연결된 계정 없음'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${trainer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {trainer.isActive ? '활성' : '비활성'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-600">
                                        <div className="space-y-1">
                                            {Object.entries(trainer.branchRates).map(([branchId, rate]) => (
                                                <div key={branchId} className="text-xs">
                                                    <span className="font-medium">{branchMap.get(branchId) || '알 수 없음'}: </span>
                                                    <span className="font-mono">
                                                        {rate.type === 'fixed' ? `${rate.value.toLocaleString()}원` : `${(rate.value * 100).toFixed(0)}%`}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-600">
                                        <div className="flex flex-wrap gap-1">
                                            {trainer.branchIds.map(branchId => (
                                                <span key={branchId} className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
                                                    {branchMap.get(branchId) || '알 수 없음'}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button 
                                                onClick={() => onEditTrainer(trainer)} 
                                                className="p-2 text-slate-500 hover:text-blue-600 rounded-full hover:bg-slate-100" 
                                                title="수정"
                                            >
                                                <EditIcon className="w-4 h-4" />
                                            </button>
                                            {trainer.isActive ? (
                                                <button 
                                                    onClick={() => onDeleteTrainer(trainer.id)} 
                                                    className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-100" 
                                                    title="삭제"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => onRestoreTrainer(trainer.id)} 
                                                    className="p-2 text-slate-500 hover:text-green-600 rounded-full hover:bg-slate-100" 
                                                    title="복원"
                                                >
                                                    <PlusIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filteredTrainers.length === 0 && (
                    <div className="text-center py-16 px-6">
                        <h3 className="text-lg font-semibold text-slate-700">
                            {selectedBranch === '' ? '등록된 강사가 없습니다.' : '해당 지점에 등록된 강사가 없습니다.'}
                        </h3>
                        <p className="text-slate-500 mt-2">
                            {selectedBranch === '' 
                                ? "'강사 추가' 버튼을 눌러 새 강사를 등록하세요."
                                : "다른 지점을 선택하거나 '강사 추가' 버튼을 눌러 새 강사를 등록하세요."
                            }
                        </p>
                    </div>
                )}
            </div>
        </div>
        );
    };

    const renderPresets = () => (
        <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
                <p className="text-slate-500">프로그램 등록 시 사용할 수 있는 템플릿을 관리합니다.</p>
                <button onClick={onAddPreset} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
                    <PlusIcon className="w-4 h-4" />
                    프리셋 추가
                </button>
            </div>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50">
                        <tr>
                          <th className="p-4 font-semibold text-slate-600">프리셋 이름</th>
                          <th className="p-4 font-semibold text-slate-600 text-right">총 금액</th>
                          <th className="p-4 font-semibold text-slate-600 text-center">총 횟수</th>
                          <th className="p-4 font-semibold text-slate-600">적용 지점</th>
                          <th className="p-4 font-semibold text-slate-600 text-center">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {presets.map(preset => (
                            <tr key={preset.id} className="hover:bg-slate-50">
                                <td className="p-4 font-medium text-slate-800">{preset.name}</td>
                                <td className="p-4 text-slate-600 font-mono text-right">{preset.totalAmount.toLocaleString()}원</td>
                                <td className="p-4 text-slate-600 font-mono text-center">{preset.totalSessions}회</td>
                                <td className="p-4 text-slate-600">
                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
                                        {preset.branchId ? branchMap.get(preset.branchId) || '알 수 없음' : '모든 지점'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <button onClick={() => onEditPreset(preset)} className="p-2 text-slate-500 hover:text-blue-600 rounded-full hover:bg-slate-100" title="수정">
                                            <EditIcon className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => onDeletePreset(preset.id)} className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-100" title="삭제">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {presets.length === 0 && (
                    <div className="text-center py-16 px-6">
                        <h3 className="text-lg font-semibold text-slate-700">등록된 프리셋이 없습니다.</h3>
                        <p className="text-slate-500 mt-2">'프리셋 추가' 버튼을 눌러 새 템플릿을 등록하세요.</p>
                    </div>
                )}
            </div>
        </div>
    );

    const TabButton: React.FC<{tab: ManagementTab, current: ManagementTab, children: React.ReactNode, icon: React.ReactNode}> = ({tab, current, children, icon}) => (
        <button 
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
                current === tab 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`
            }
        >
            {icon}
            {children}
        </button>
    );

    return (
        <div className="flex-1 p-6 style={{ backgroundColor: '#F1F5F9' }} overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
                <h2 className="text-3xl font-bold text-slate-800">설정 관리</h2>
                <p className="text-slate-500 mt-1">시스템의 다양한 설정을 관리합니다.</p>
            </div>
          </div>
          <div className="border-b border-slate-200">
              <nav className="-mb-px flex space-x-6">
                  {currentUser?.role === 'admin' && (
                      <TabButton tab="branches" current={activeTab} icon={<SettingsIcon className="w-5 h-5" />}>
                          지점 관리
                      </TabButton>
                  )}
                  <TabButton tab="presets" current={activeTab} icon={<SettingsIcon className="w-5 h-5" />}>
                      프로그램 프리셋
                  </TabButton>
                  {currentUser?.role === 'admin' && (
                      <TabButton tab="trainers" current={activeTab} icon={<SettingsIcon className="w-5 h-5" />}>
                          강사 관리
                      </TabButton>
                  )}
              </nav>
          </div>
          <div>
              {activeTab === 'branches' && currentUser?.role === 'admin' && renderBranches()}
              {activeTab === 'presets' && renderPresets()}
              {activeTab === 'trainers' && currentUser?.role === 'admin' && renderTrainers()}
          </div>
        </div>
    );
};