import React from 'react';
import { User, Trainer, UserRole, Branch } from '../types';
import { UserIcon, TrashIcon, PlusIcon, BuildingIcon, IdCardIcon, HelpCircleIcon, ShieldCheckIcon, XIcon } from './Icons';
import { useDroppable, useDraggable } from '@dnd-kit/core';

interface DraggableUserCardProps {
    user: User;
    trainers: Trainer[];
    branches: Branch[];
    onDelete: (userId: string) => void;
    onUpdateManagerBranches: (userId: string, newBranches: string[]) => void;
}

const DraggableUserCard: React.FC<DraggableUserCardProps> = ({ user, trainers, branches, onDelete, onUpdateManagerBranches }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: user.id,
        disabled: user.role === 'admin',
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0) rotate(3deg)`,
        zIndex: 100,
    } : undefined;

    const trainerProfile = user.role === 'trainer' && user.trainerProfileId ? trainers.find(t => t.id === user.trainerProfileId) : null;
    const branchMap = new Map(branches.map(b => [b.id, b.name]));

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group flex flex-col p-3 bg-white rounded-lg border shadow-sm transition-all ${isDragging ? 'shadow-2xl scale-105' : 'hover:shadow-md hover:border-blue-400'}`}
        >
            <div className="flex items-start w-full">
                <div
                    {...listeners}
                    {...attributes}
                    className={`flex-grow flex items-center gap-3 ${user.role !== 'admin' ? 'cursor-grab' : 'cursor-default'}`}
                >
                    <UserIcon className="w-8 h-8 text-slate-400 flex-shrink-0 bg-slate-100 p-1.5 rounded-full" />
                    <div className="flex-1">
                        <p className="font-semibold text-slate-800">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                </div>
                {user.role !== 'admin' && (
                    <button
                        onClick={() => onDelete(user.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-full hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="사용자 삭제"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                )}
            </div>

            {user.role === 'manager' && user.assignedBranchIds && user.assignedBranchIds.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                    {user.assignedBranchIds.map(branchId => (
                        <span key={branchId} className="flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                            {branchMap.get(branchId) || branchId}
                            <button
                                onClick={() => onUpdateManagerBranches(user.id, user.assignedBranchIds?.filter(b => b !== branchId) || [])}
                                className="ml-0.5 -mr-1 p-0.5 rounded-full hover:bg-blue-200"
                            >
                                <XIcon className="w-3 h-3"/>
                            </button>
                        </span>
                    ))}
                </div>
            )}
            {user.role === 'trainer' && trainerProfile && (
                <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <span className="font-medium text-slate-500">연결된 프로필:</span> {trainerProfile.name}
                </div>
            )}
        </div>
    );
};

interface EmptyPlaceholderProps {
    message: string;
    icon?: React.ReactNode;
}

const EmptyPlaceholder: React.FC<EmptyPlaceholderProps> = ({ message, icon }) => (
    <div className="flex flex-col items-center justify-center h-full min-h-[80px] text-center p-4 border-2 border-dashed border-slate-200 rounded-lg">
        {icon && <div className="mb-2 text-slate-300">{icon}</div>}
        <p className="text-xs text-slate-400">{message}</p>
    </div>
);

interface DroppableBlockProps {
    id: string;
    children: React.ReactNode;
    onAdd?: () => void;
    addLabel?: string;
}

const DroppableBlock: React.FC<DroppableBlockProps> = ({ id, children, onAdd, addLabel }) => {
    const { isOver, setNodeRef } = useDroppable({ id: `droppable-${id}` });
    const childrenArray = React.Children.toArray(children);
    const hasChildren = childrenArray.length > 0 && childrenArray.some(c => c);


    return (
        <div
            ref={setNodeRef}
            className={`p-3 bg-slate-50/70 rounded-lg min-h-[120px] transition-all duration-200 ${isOver ? 'bg-blue-100 ring-2 ring-blue-400 ring-offset-2' : ''}`}
        >
            {hasChildren ? 
                <div className="space-y-3">{children}</div> : 
                (
                    onAdd ? (
                        <div className="flex flex-col items-center justify-center h-full min-h-[80px] text-center p-4 border-2 border-dashed border-slate-200 rounded-lg">
                            <button onClick={onAdd} className="flex items-center gap-2 px-3 py-1.5 bg-slate-200 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-300">
                                <PlusIcon className="w-4 h-4" />
                                {addLabel || '추가'}
                            </button>
                            <p className="text-xs text-slate-400 mt-2">또는 드래그하여 배정하세요.</p>
                        </div>
                    ) : (
                        <EmptyPlaceholder 
                            message="이곳으로 드래그하여 배정하세요." 
                            icon={<UserIcon className="w-6 h-6"/>}
                        />
                    )
                )
            }
        </div>
    );
};

interface PermissionsManagementProps {
  users: User[];
  trainers: Trainer[];
  allBranches: Branch[];
  onAddUser: (context?: { role: UserRole; branchId: string; }) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateManagerBranches: (userId: string, newBranches: string[]) => void;
}

export const PermissionsManagement: React.FC<PermissionsManagementProps> = ({ users, trainers, allBranches, onAddUser, onDeleteUser, onUpdateManagerBranches }) => {
    
    const admins = users.filter(u => u.role === 'admin');
    const globalUnassigned = users.filter(u => 
        u.role === 'unassigned' || 
        (u.role === 'manager' && (!u.assignedBranchIds || u.assignedBranchIds.length === 0))
    );

    const roleInfo: Record<UserRole, { icon: React.ReactNode, title: string }> = {
        manager: { icon: <BuildingIcon className="w-5 h-5 text-blue-600" />, title: "매니저" },
        trainer: { icon: <IdCardIcon className="w-5 h-5 text-green-600" />, title: "트레이너" },
        unassigned: { icon: <HelpCircleIcon className="w-5 h-5 text-slate-500" />, title: "미배정" },
        admin: { icon: <ShieldCheckIcon className="w-5 h-5 text-purple-600" />, title: "관리자" },
    };

    return (
    <div className="flex-1 p-6 lg:p-8 bg-slate-100 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-800">권한 관리</h2>
              <p className="text-slate-500 mt-1">사용자 계정을 드래그 앤 드롭하여 역할과 소속을 변경합니다.</p>
            </div>
             <button onClick={() => onAddUser()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700">
                <PlusIcon className="w-4 h-4" />
                신규 사용자 추가
            </button>
        </div>
        <div className="space-y-8">
            <div className="p-5 bg-white rounded-xl shadow-sm">
                <h3 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-4 mb-4">글로벌 권한</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-3 px-1">
                            {roleInfo.admin.icon}
                            <h4 className="font-semibold text-slate-700">{roleInfo.admin.title}</h4>
                        </div>
                        <div className="p-3 bg-slate-50/70 rounded-lg space-y-3">
                            {admins.map(user => <DraggableUserCard key={user.id} user={user} trainers={trainers} branches={allBranches} onDelete={onDeleteUser} onUpdateManagerBranches={onUpdateManagerBranches} />)}
                            {admins.length === 0 && <EmptyPlaceholder message="관리자가 없습니다." />}
                        </div>
                    </div>
                     <div>
                        <div className="flex items-center gap-2 mb-3 px-1">
                            {roleInfo.unassigned.icon}
                            <h4 className="font-semibold text-slate-700">미배정 (글로벌)</h4>
                        </div>
                         <DroppableBlock id="unassigned-global">
                            {globalUnassigned.map(user => <DraggableUserCard key={user.id} user={user} trainers={trainers} branches={allBranches} onDelete={onDeleteUser} onUpdateManagerBranches={onUpdateManagerBranches} />)}
                         </DroppableBlock>
                    </div>
                </div>
            </div>

            {allBranches.map(branch => {
                const branchManagers = users.filter(u => u.role === 'manager' && u.assignedBranchIds?.includes(branch.id));
                const branchTrainers = users.filter(u => {
                    if (u.role !== 'trainer' || !u.trainerProfileId) return false;
                    const profile = trainers.find(t => t.id === u.trainerProfileId);
                    return profile?.branchIds?.includes(branch.id) ?? false;
                });
                const branchUnassigned = users.filter(u => u.role === 'unassigned' && u.assignedBranchIds?.includes(branch.id));

                return (
                    <div key={branch.id} className="p-5 bg-white rounded-xl shadow-sm">
                        <h3 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-4 mb-4">{branch.name}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            { (['manager', 'trainer', 'unassigned'] as const).map(role => (
                                <div key={role}>
                                    <div className="flex items-center gap-2 mb-3 px-1">
                                        {roleInfo[role].icon}
                                        <h4 className="font-semibold text-slate-700">{roleInfo[role].title}</h4>
                                    </div>
                                    <DroppableBlock 
                                        id={`${role}-${branch.id}`}
                                        onAdd={role === 'manager' ? () => onAddUser({ role: 'manager', branchId: branch.id }) : undefined}
                                        addLabel={role === 'manager' ? '매니저 지정' : undefined}
                                    >
                                        {role === 'manager' && branchManagers.map(user => <DraggableUserCard key={user.id} user={user} trainers={trainers} branches={allBranches} onDelete={onDeleteUser} onUpdateManagerBranches={onUpdateManagerBranches} />)}
                                        {role === 'trainer' && branchTrainers.map(user => <DraggableUserCard key={user.id} user={user} trainers={trainers} branches={allBranches} onDelete={onDeleteUser} onUpdateManagerBranches={onUpdateManagerBranches} />)}
                                        {role === 'unassigned' && branchUnassigned.map(user => <DraggableUserCard key={user.id} user={user} trainers={trainers} branches={allBranches} onDelete={onDeleteUser} onUpdateManagerBranches={onUpdateManagerBranches} />)}
                                    </DroppableBlock>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
  );
};