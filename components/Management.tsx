import React, { useState } from 'react';
import { User, ProgramPreset, Branch, Trainer, UserRole } from '../types';
import { PermissionsManagement } from './PermissionsManagement';
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
    onAddPreset: () => void;
    onEditPreset: (preset: ProgramPreset) => void;
    onDeletePreset: (presetId: string) => void;
    onAddBranch: () => void;
    onEditBranch: (branch: Branch) => void;
    onDeleteBranch: (branchId: string) => void;
}

type ManagementTab = 'branches' | 'presets' | 'permissions';

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
    onAddPreset,
    onEditPreset,
    onDeletePreset,
    onAddBranch,
    onEditBranch,
    onDeleteBranch,
}) => {
    const defaultTab: ManagementTab = currentUser?.role === 'admin' ? 'branches' : 'presets';
    const [activeTab, setActiveTab] = useState<ManagementTab>(defaultTab);

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
        <div className="flex-1 p-6 bg-slate-100 overflow-y-auto">
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
                      <TabButton tab="permissions" current={activeTab} icon={<ShieldCheckIcon className="w-5 h-5" />}>
                          권한 관리
                      </TabButton>
                  )}
              </nav>
          </div>
          <div>
              {activeTab === 'branches' && currentUser?.role === 'admin' && renderBranches()}
              {activeTab === 'presets' && renderPresets()}
              {activeTab === 'permissions' && currentUser?.role === 'admin' && (
                  <div className="mt-6">
                    <PermissionsManagement 
                        users={users}
                        trainers={trainers}
                        allBranches={allBranches}
                        onAddUser={onAddUser}
                        onDeleteUser={onDeleteUser}
                        onUpdateManagerBranches={onUpdateManagerBranches}
                        onUpdateUserRole={onUpdateUserRole}
                    />
                  </div>
              )}
          </div>
        </div>
    );
};