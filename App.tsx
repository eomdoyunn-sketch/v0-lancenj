


import React, { useState, useEffect, useCallback } from 'react';
import { MemberProgram, Trainer, Session, SessionStatus, View, ProgramStatus, Member, ProgramPreset, ExerciseGoal, ExerciseExperience, PreferredTime, AuditLog, User, UserRole, Branch, RateType, BranchRate } from './types';
import { ProgramTable } from './components/Calendar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { MemberManagement } from './components/MemberManagement';
import { LogManagement } from './components/LogManagement';
import { ManagementView } from './components/Management';
import { Modal } from './components/Modal';
import { Sidebar } from './components/Sidebar';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { CheckCircleIcon, DumbbellIcon } from './components/Icons';
import { TrainerDetailModal } from './components/TrainerDetailModal';
import { MemberDetailModal, HistoryItem } from './components/MemberDetailModal';
import { Auth } from './components/Auth';
import { AuthService } from './lib/authService';
import { DataManager } from './lib/dataService';

const availableColors = [
    'bg-red-500', 'bg-red-600', 'bg-orange-500', 'bg-orange-600', 'bg-amber-500', 'bg-amber-600', 
    'bg-yellow-500', 'bg-yellow-600', 'bg-lime-500', 'bg-lime-600', 'bg-green-500', 'bg-green-600', 
    'bg-emerald-500', 'bg-emerald-600', 'bg-teal-500', 'bg-teal-600', 'bg-cyan-500', 'bg-cyan-600', 
    'bg-sky-500', 'bg-sky-600', 'bg-blue-500', 'bg-blue-600', 'bg-indigo-500', 'bg-indigo-600', 
    'bg-violet-500', 'bg-violet-600', 'bg-purple-500', 'bg-purple-600', 'bg-fuchsia-500', 'bg-fuchsia-600', 
    'bg-pink-500', 'bg-pink-600', 'bg-rose-500', 'bg-rose-600', 'bg-red-400', 'bg-orange-400',
    'bg-yellow-400', 'bg-green-400', 'bg-blue-400', 'bg-indigo-400', 'bg-purple-400', 'bg-pink-400',
    'bg-red-700', 'bg-orange-700', 'bg-yellow-700', 'bg-green-700', 'bg-blue-700', 'bg-indigo-700',
    'bg-purple-700', 'bg-pink-700'
];

const exerciseGoalOptions: ExerciseGoal[] = ['체중 감량', '근력 증가', '체형 교정', '재활 및 통증 완화', '대회 준비', '스트레스 해소', '기초 체력 증진'];
const exerciseExperienceOptions: ExerciseExperience[] = ['입문', '초급', '중급', '고급'];
const preferredTimeOptions: PreferredTime[] = ['오전', '오후', '저녁', '주말'];

const initialProgramFormData = {
  memberIds: [] as string[],
  programName: '',
  registrationType: '신규' as '신규' | '재등록',
  registrationDate: new Date().toISOString().split('T')[0],
  paymentDate: new Date().toISOString().split('T')[0],
  totalAmount: '',
  totalSessions: '',
  status: '유효' as ProgramStatus,
  assignedTrainerId: '',
  memo: '',
  defaultSessionDuration: '50',
  branchId: '',
  selectedPresetId: '',
  fixedTrainerFee: '',
  sessionFees: {} as { [sessionNumber: number]: number },
};

type ProgramFormData = typeof initialProgramFormData;

const toYYYYMMDD = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

type TrainerFormState = {
    id?: string;
    name: string;
    isActive: boolean;
    color: string;
    photoUrl?: string;
    branches: {
        [branchId: string]: {
            selected: boolean;
            rateType: RateType;
            rateValue: string;
        }
    }
};

const App: React.FC = () => {
  const [programs, setPrograms] = useState<MemberProgram[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [programPresets, setProgramPresets] = useState<ProgramPreset[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('programs');
  
  const [isLoading, setIsLoading] = useState(true);
  
  const [programFilter, setProgramFilter] = useState({status: '유효' as ProgramStatus | '전체', search: '', trainerId: '', branchId: ''});
  const [memberFilter, setMemberFilter] = useState({ branchId: '' });
  const [dashboardFilter, setDashboardFilter] = useState({ branchId: '' });

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const [filterStartDate, setFilterStartDate] = useState(toYYYYMMDD(firstDayOfMonth));
  const [filterEndDate, setFilterEndDate] = useState(toYYYYMMDD(lastDayOfMonth));

  const [isProgramModalOpen, setProgramModalOpen] = useState(false);
  const [programToEdit, setProgramToEdit] = useState<MemberProgram | null>(null);
  const [programFormData, setProgramFormData] = useState<ProgramFormData>(initialProgramFormData);
  
  const [isBookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingData, setBookingData] = useState<{programId: string, sessionNumber: number} | null>(null);
  const [sessionToEdit, setSessionToEdit] = useState<Session | null>(null);

  const [isCompletionModalOpen, setCompletionModalOpen] = useState(false);
  const [completionData, setCompletionData] = useState<Session | null>(null);

  const [isMemberModalOpen, setMemberModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);
  const [memberModalTab, setMemberModalTab] = useState<'basic' | 'detail'>('basic');
  const [memberFormData, setMemberFormData] = useState<Partial<Member>>({});

  const [isTrainerModalOpen, setTrainerModalOpen] = useState(false);
  const [trainerToEdit, setTrainerToEdit] = useState<Trainer | null>(null);
  const [trainerFormState, setTrainerFormState] = useState<TrainerFormState | null>(null);
  
  const [isTrainerDetailModalOpen, setTrainerDetailModalOpen] = useState(false);
  const [selectedTrainerForDetail, setSelectedTrainerForDetail] = useState<Trainer | null>(null);

  const [isMemberDetailModalOpen, setMemberDetailModalOpen] = useState(false);
  const [selectedMemberForDetail, setSelectedMemberForDetail] = useState<Member | null>(null);
  
  const [tooltip, setTooltip] = useState<{ content: React.ReactNode; rect: DOMRect } | null>(null);
  
  const [isUserModalOpen, setUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [newUserContext, setNewUserContext] = useState<{ role?: UserRole, branchId?: string } | null>(null);
  
  const [isPresetModalOpen, setPresetModalOpen] = useState(false);
  const [isBranchModalOpen, setBranchModalOpen] = useState(false);
  const [branchToEdit, setBranchToEdit] = useState<Branch | null>(null);
  const [presetToEdit, setPresetToEdit] = useState<ProgramPreset | null>(null);
  const [isSessionFeeModalOpen, setSessionFeeModalOpen] = useState(false);
  const [sessionToEditFee, setSessionToEditFee] = useState<Session | null>(null);


  const fetchInitialData = useCallback(async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
        // Load all data from Supabase
        const [allBranches, allMembers, allTrainers, allPrograms, allSessions, allPresets, allUsers, allLogs] = await Promise.all([
            DataManager.getBranches(),
            DataManager.getMembers(),
            DataManager.getTrainers(),
            DataManager.getPrograms(),
            DataManager.getSessions(),
            DataManager.getProgramPresets(),
            DataManager.getUsers(),
            DataManager.getAuditLogs()
        ]);

        if (currentUser.role === 'manager' && currentUser.assignedBranchIds && currentUser.assignedBranchIds.length > 0) {
            const managerBranches = currentUser.assignedBranchIds;

            // Only show branches that the manager is assigned to
            const filteredBranches = allBranches.filter(b => managerBranches.includes(b.id));
            setBranches(filteredBranches);

            // Filter other data by manager's branches
            const filteredMembers = allMembers.filter(m => m.branchId && managerBranches.includes(m.branchId));
            const filteredPrograms = allPrograms.filter(p => managerBranches.includes(p.branchId));
            const filteredSessions = allSessions.filter(s => {
                const program = allPrograms.find(p => p.id === s.programId);
                return program && managerBranches.includes(program.branchId);
            });
            const filteredPresets = allPresets.filter(p => p.branchId && managerBranches.includes(p.branchId));
            const filteredLogs = allLogs.filter(l => l.branchId && managerBranches.includes(l.branchId));

            setMembers(filteredMembers);
            setPrograms(filteredPrograms);
            setSessions(filteredSessions);
            setProgramPresets(filteredPresets);
            setAuditLogs(filteredLogs);
        } else {
            // Admin sees all data
            setBranches(allBranches);
            setMembers(allMembers);
            setPrograms(allPrograms);
            setSessions(allSessions);
            setProgramPresets(allPresets);
            setAuditLogs(allLogs);
        }

        // Filter trainers by manager's branches
        if (currentUser.role === 'manager' && currentUser.assignedBranchIds && currentUser.assignedBranchIds.length > 0) {
            const managerBranches = currentUser.assignedBranchIds;
            const filteredTrainersForManager = allTrainers.filter(t => t.branchIds.some(branchId => managerBranches.includes(branchId)));
            setTrainers(filteredTrainersForManager);
        } else {
            setTrainers(allTrainers); // Admin sees all trainers
        }
        
        setUsers(allUsers); // Users are global
    } catch (error) {
        console.error('데이터 로딩 실패:', error);
    } finally {
        setIsLoading(false);
    }
}, [currentUser]);


  useEffect(() => {
    // Initialize auth service
    AuthService.initialize();
    
    // Load branches data even before login (needed for signup form)
    const loadBranches = async () => {
      try {
        const allBranches = await DataManager.getBranches();
        setBranches(allBranches);
      } catch (error) {
        console.error('지점 데이터 로딩 실패:', error);
      }
    };
    
    loadBranches();
    
    // Check if user is already logged in
    const savedUser = AuthService.getCurrentUser();
    if (savedUser) {
      setCurrentUser(savedUser);
    } else {
      setIsLoading(false);
    }
  }, []);


  useEffect(() => {
    if (currentUser) {
      fetchInitialData();
      
      // Set default branch filters for managers
      if (currentUser.role === 'manager' && currentUser.assignedBranchIds && currentUser.assignedBranchIds.length > 0) {
        const defaultBranch = currentUser.assignedBranchIds[0];
        setProgramFilter(prev => ({ ...prev, branchId: defaultBranch }));
        setMemberFilter(prev => ({ ...prev, branchId: defaultBranch }));
        setDashboardFilter(prev => ({ ...prev, branchId: defaultBranch }));
      }

      
      // Set initial view based on user permissions
      const permissions: Record<UserRole, View[]> = {
        admin: ['programs', 'dashboard', 'members', 'logs', 'management'],
        manager: ['programs', 'dashboard', 'members', 'logs', 'management'],
        trainer: ['programs', 'dashboard', 'members'],
        unassigned: [],
      };
      
      const availableViews = permissions[currentUser.role];
      if (availableViews.length > 0 && !availableViews.includes(currentView)) {
        setCurrentView(availableViews[0]);
      }
    }
  }, [currentUser, fetchInitialData, currentView]);

  // 회차별 수업료 필드 동적 생성
  useEffect(() => {
    const container = document.getElementById('sessionFeesContainer');
    if (container && isPresetModalOpen) {
        const totalSessions = presetToEdit?.totalSessions || 10; // 기본값
        container.innerHTML = '';
        
        for (let i = 1; i <= totalSessions; i++) {
            const div = document.createElement('div');
            div.className = 'flex flex-col';
            div.innerHTML = `
                <label class="text-xs text-gray-600">${i}회차</label>
                <input type="number" name="sessionFee_${i}" 
                       value="${presetToEdit?.sessionFees?.[i] || ''}" 
                       placeholder="수업료" 
                       class="text-xs px-2 py-1 border border-gray-300 rounded"/>
            `;
            container.appendChild(div);
        }
    }
  }, [isPresetModalOpen, presetToEdit]);

  const addAuditLog = async (action: AuditLog['action'], entityType: AuditLog['entityType'], entityName: string, details: string, branchId?: string) => {
    if (!currentUser) return;
    const newLog = await DataManager.addAuditLog({
      user: (currentUser.name || 'Unknown') as string,
      action,
      entityType,
      entityName,
      details,
      branchId
    });
    if (newLog) {
      setAuditLogs(prev => [newLog, ...prev]);
    }
  };

  const setViewWithPermissions = (view: View) => {
    if (!currentUser) return;
    
    // Define permissions for each role
    const permissions: Record<UserRole, View[]> = {
      admin: ['programs', 'dashboard', 'members', 'logs', 'management'],
      manager: ['programs', 'dashboard', 'members', 'logs', 'management'],
      trainer: ['programs', 'dashboard', 'members'],
      unassigned: [],
    };

    // Check if user has permission for the requested view
    if (permissions[currentUser.role].includes(view)) {
      setCurrentView(view);
    } else {
      console.warn(`User with role ${currentUser.role} does not have permission to access ${view}`);
      // Redirect to first available view
      const availableViews = permissions[currentUser.role];
      if (availableViews.length > 0) {
        setCurrentView(availableViews[0]);
      }
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
    setPrograms([]);
    setMembers([]);
    setTrainers([]);
    setSessions([]);
    setProgramPresets([]);
    setAuditLogs([]);
    setUsers([]);
    setBranches([]);
    setIsLoading(false);
  };
  
  const handleOpenProgramModal = (program: MemberProgram | null) => {
    setProgramToEdit(program);
    if (program) {
        setProgramFormData({
            ...program,
            totalAmount: String(program.totalAmount),
            totalSessions: String(program.totalSessions),
            assignedTrainerId: program.assignedTrainerId || '',
            memo: program.memo || '',
            defaultSessionDuration: String(program.defaultSessionDuration || 50),
        });
    } else {
        const defaultBranchId = (currentUser?.role === 'manager' && currentUser.assignedBranchIds && currentUser.assignedBranchIds.length > 0) 
            ? currentUser.assignedBranchIds[0] 
            : (branches.length > 0 ? branches[0].id : '');
        setProgramFormData({
            ...initialProgramFormData,
            branchId: defaultBranchId,
        });
    }
    setProgramModalOpen(true);
};
  const handleCloseProgramModal = () => setProgramModalOpen(false);

  const handleMemberSelectionChange = (memberId: string) => {
    setProgramFormData(prev => {
      const newMemberIds = prev.memberIds.includes(memberId)
        ? prev.memberIds.filter(id => id !== memberId)
        : [...prev.memberIds, memberId];
      return { ...prev, memberIds: newMemberIds };
    });
  };

  const handleProgramFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target;
    const name = target.name;
    const value = target.value;
    
    const newFormData = { ...programFormData, [name]: value };

    if (name === 'branchId') {
        newFormData.memberIds = [];
        newFormData.assignedTrainerId = '';
        
        const form = target.closest('form');
        if (form) {
            const presetSelect = form.elements.namedItem('programPreset') as HTMLSelectElement;
            if (presetSelect) presetSelect.value = "";
        }
        newFormData.programName = '';
        newFormData.totalAmount = '';
        newFormData.totalSessions = '';
    }
    
    setProgramFormData(newFormData);
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetName = e.target.value;
    const selectedPreset = programPresets.find(p => p.name === presetName);
    
    if (selectedPreset) {
        setProgramFormData(prev => ({
            ...prev,
            programName: selectedPreset.name,
            totalAmount: String(selectedPreset.totalAmount),
            totalSessions: String(selectedPreset.totalSessions),
        }));
    } else {
        setProgramFormData(prev => ({
            ...prev,
            programName: '',
            totalAmount: '',
            totalSessions: '',
        }));
    }
  };

  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault(); // 폼 제출 기본 동작 방지
    
    try {
      const totalAmount = Number(programFormData.totalAmount);
      const totalSessions = Number(programFormData.totalSessions);

      if (!programFormData.branchId) {
          alert("지점을 선택해주세요.");
          return;
      }
       if (programFormData.memberIds.length === 0) {
          alert("회원을 한 명 이상 선택해주세요.");
          return;
      }

      const programData = {
          memberIds: programFormData.memberIds,
          programName: programFormData.programName,
          registrationType: programFormData.registrationType,
          registrationDate: programFormData.registrationDate,
          paymentDate: programFormData.paymentDate,
          totalAmount: totalAmount,
          totalSessions: totalSessions,
          status: programFormData.status,
          assignedTrainerId: programFormData.assignedTrainerId || undefined,
          memo: programFormData.memo,
          defaultSessionDuration: Number(programFormData.defaultSessionDuration),
          branchId: programFormData.branchId,
          completedSessions: programToEdit?.completedSessions || 0,
          unitPrice: totalSessions > 0 ? Math.round(totalAmount / totalSessions) : 0,
          fixedTrainerFee: programFormData.fixedTrainerFee ? Number(programFormData.fixedTrainerFee) : undefined,
          sessionFees: programFormData.sessionFees,
      };
      
      const memberNames = members.filter(m => programFormData.memberIds.includes(m.id)).map(m => m.name).join(', ');

      let result;
      if (programToEdit && programToEdit.id) {
        result = await DataManager.updateProgram(programToEdit.id, programData);
        if (result) {
          setPrograms(programs.map(p => p.id === result.id ? result : p));
          await addAuditLog('수정', '프로그램', result.programName, `${memberNames} 회원의 프로그램을 수정했습니다.`, result.branchId);
          alert('프로그램이 수정되었습니다.');
        }
      } else {
        result = await DataManager.createProgram(programData);
        if (result) {
          setPrograms([...programs, result]);
          await addAuditLog('생성', '프로그램', result.programName, `${memberNames} 회원의 신규 프로그램을 등록했습니다.`, result.branchId);
          alert('프로그램이 등록되었습니다.');
        }
      }
      
      if (result) {
        handleCloseProgramModal();
      } else {
        alert('프로그램 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('프로그램 저장 오류:', error);
      alert('프로그램 저장 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteProgram = async (programId: string) => {
    const programToDelete = programs.find(p => p.id === programId);
    if (programToDelete && window.confirm(`${programToDelete.programName} 프로그램을 삭제하시겠습니까?`)) {
        const success = await DataManager.deleteProgram(programId);
        if (success) {
          const memberName = members.find(m => programToDelete.memberIds.includes(m.id))?.name || 'Unknown';
          setPrograms(programs.filter(p => p.id !== programId));
          await addAuditLog('삭제', '프로그램', programToDelete.programName, `${memberName} 회원의 프로그램을 삭제했습니다.`, programToDelete.branchId);
        }
    }
  };
  
  const handleOpenPresetModal = (preset: ProgramPreset | null) => {
    setPresetToEdit(preset);
    setPresetModalOpen(true);
  };
  const handleClosePresetModal = () => setPresetModalOpen(false);

  const handleSavePreset = async (presetData: Omit<ProgramPreset, 'id'>) => {
    if (presetToEdit) {
        const updatedPreset = await DataManager.updateProgramPreset(presetToEdit.id, presetData);
        if (updatedPreset) {
          setProgramPresets(programPresets.map(p => p.id === updatedPreset.id ? updatedPreset : p));
          await addAuditLog('수정', '프리셋', updatedPreset.name, `프로그램 프리셋 '${updatedPreset.name}'을(를) 수정했습니다.`);
        }
    } else {
        const newPreset = await DataManager.createProgramPreset(presetData);
        if (newPreset) {
          setProgramPresets([...programPresets, newPreset]);
          await addAuditLog('생성', '프리셋', newPreset.name, `프로그램 프리셋 '${newPreset.name}'을(를) 생성했습니다.`);
        }
    }
    handleClosePresetModal();
  };
  
  const handleDeletePreset = async (presetId: string) => {
    const presetToDelete = programPresets.find(p => p.id === presetId);
    if (presetToDelete && window.confirm(`'${presetToDelete.name}' 프리셋을 삭제하시겠습니까?`)) {
        const success = await DataManager.deleteProgramPreset(presetId);
        if (success) {
          setProgramPresets(programPresets.filter(p => p.id !== presetId));
          await addAuditLog('삭제', '프리셋', presetToDelete.name, `프로그램 프리셋 '${presetToDelete.name}'을(를) 삭제했습니다.`);
        }
    }
  };

  // Branch management functions
  const handleSaveBranch = async (branchData: Omit<Branch, 'id'>) => {
    if (branchToEdit) {
        const updatedBranch = await DataManager.updateBranch(branchToEdit.id, branchData);
        if (updatedBranch) {
          setBranches(branches.map(b => b.id === updatedBranch.id ? updatedBranch : b));
          await addAuditLog('수정', '지점', updatedBranch.name, `지점 '${updatedBranch.name}'을(를) 수정했습니다.`);
        }
    } else {
        const newBranch = await DataManager.createBranch(branchData);
        if (newBranch) {
          setBranches([...branches, newBranch]);
          await addAuditLog('생성', '지점', newBranch.name, `지점 '${newBranch.name}'을(를) 생성했습니다.`);
        }
    }
    setBranchModalOpen(false);
    setBranchToEdit(null);
  };

  const handleDeleteBranch = async (branchId: string) => {
    const branchToDelete = branches.find(b => b.id === branchId);
    if (branchToDelete && window.confirm(`'${branchToDelete.name}' 지점을 삭제하시겠습니까? 이 지점과 관련된 모든 데이터가 삭제됩니다.`)) {
        const success = await DataManager.deleteBranch(branchId);
        if (success) {
          setBranches(branches.filter(b => b.id !== branchId));
          await addAuditLog('삭제', '지점', branchToDelete.name, `지점 '${branchToDelete.name}'을(를) 삭제했습니다.`);
        }
    }
  };

  const handleOpenBranchModal = (branch: Branch | null) => {
    setBranchToEdit(branch);
    setBranchModalOpen(true);
  };

  const handleOpenMemberModal = (member: Member | null) => {
    setMemberToEdit(member);
    
    // 매니저의 경우 소속 지점을 기본값으로 설정
    const defaultData: Partial<Member> = member || {};
    if (!member && currentUser?.role === 'manager' && currentUser.assignedBranchIds && currentUser.assignedBranchIds.length > 0) {
      defaultData.branchId = currentUser.assignedBranchIds[0];
    }
    
    setMemberFormData(defaultData);
    setMemberModalOpen(true);
    setMemberModalTab('basic');
  };
  const handleCloseMemberModal = () => {
    setMemberModalOpen(false);
    setMemberFormData({}); // 폼 데이터 초기화
    setMemberModalTab('basic'); // 탭 초기화
  };

  // 탭 전환 시 상태만 변경 (데이터는 이미 상태로 관리됨)
  const handleMemberTabChange = (newTab: 'basic' | 'detail') => {
    setMemberModalTab(newTab);
  };

  const handleSaveMember = async (memberData: Omit<Member, 'id'>) => {
    if (memberToEdit) {
      const updatedMember = await DataManager.updateMember(memberToEdit.id, memberData);
      if (updatedMember) {
        setMembers(members.map(m => m.id === updatedMember.id ? updatedMember : m));
        await addAuditLog('수정', '사용자', updatedMember.name, `회원 정보를 수정했습니다.`, updatedMember.branchId);
      }
    } else {
      const newMember = await DataManager.createMember(memberData);
      if (newMember) {
        setMembers([...members, newMember]);
        await addAuditLog('생성', '사용자', newMember.name, `신규 회원을 등록했습니다.`, newMember.branchId);
      }
    }
    handleCloseMemberModal();
  };

  const handleDeleteMember = async (memberId: string) => {
    const memberToDelete = members.find(m => m.id === memberId);
    if (memberToDelete && window.confirm(`${memberToDelete.name} 회원을 삭제하시겠습니까? 모든 관련 프로그램이 함께 삭제됩니다.`)) {
      const success = await DataManager.deleteMember(memberId);
      if (success) {
        setMembers(members.filter(m => m.id !== memberId));
        setPrograms(programs.filter(p => !p.memberIds.includes(memberId)));
        await addAuditLog('삭제', '사용자', memberToDelete.name, `회원 정보를 삭제했습니다.`, memberToDelete.branchId);
      }
    }
  };

  const handleOpenTrainerModal = (trainer: Trainer | null) => {
    setTrainerToEdit(trainer);
    const initialState: TrainerFormState = {
        id: trainer?.id,
        name: trainer?.name || '',
        isActive: trainer?.isActive ?? true,
        color: trainer?.color || availableColors[0],
        photoUrl: trainer?.photoUrl || '',
        branches: {},
    };

    branches.forEach(branch => {
        const isSelected = trainer?.branchIds.includes(branch.id) || false;
        const rateInfo = trainer?.branchRates[branch.id];
        
        initialState.branches[branch.id] = {
            selected: isSelected,
            rateType: rateInfo?.type || 'percentage',
            rateValue: rateInfo ? String(rateInfo.type === 'percentage' ? rateInfo.value * 100 : rateInfo.value) : '50'
        };
    });

    setTrainerFormState(initialState);
    setTrainerModalOpen(true);
  };
  const handleCloseTrainerModal = () => {
    setTrainerModalOpen(false);
    setTrainerFormState(null);
  }
  const handleTrainerFormChange = (field: keyof TrainerFormState, value: any) => {
    if (!trainerFormState) return;
    setTrainerFormState({ ...trainerFormState, [field]: value });
  };
  const handleTrainerBranchChange = (branchId: string, field: string, value: any) => {
      if (!trainerFormState) return;
      const newBranches = {
          ...trainerFormState.branches,
          [branchId]: {
              ...trainerFormState.branches[branchId],
              [field]: value,
          }
      };
      
      // 지점 선택이 변경된 경우 색상 유효성 검사
      if (field === 'selected') {
          const selectedBranches = Object.keys(newBranches).filter(id => newBranches[id].selected);
          const usedColors = trainers
              .filter(t => t.id !== trainerToEdit?.id && t.branchIds.some(branchId => selectedBranches.includes(branchId)))
              .map(t => t.color);
          
          // 현재 선택된 색상이 사용 불가능하면 첫 번째 사용 가능한 색상으로 변경
          if (usedColors.includes(trainerFormState.color)) {
              const availableColor = availableColors.find(color => !usedColors.includes(color));
              if (availableColor) {
                  setTrainerFormState({ ...trainerFormState, branches: newBranches, color: availableColor });
                  return;
              }
          }
      }
      
      setTrainerFormState({ ...trainerFormState, branches: newBranches });
  };

  const handleSaveTrainer = async () => {
    if (!trainerFormState) return;

    const branchIds: string[] = [];
    const branchRates: { [key: string]: BranchRate } = {};
    for (const branchId in trainerFormState.branches) {
        const branchState = trainerFormState.branches[branchId];
        if (branchState.selected) {
            branchIds.push(branchId);
            const rateValueNum = Number(branchState.rateValue) || 0;
            branchRates[branchId] = {
                type: branchState.rateType,
                value: branchState.rateType === 'percentage' ? rateValueNum / 100 : rateValueNum
            };
        }
    }

    const branchIdForLog = branchIds.length > 0 ? branchIds[0] : undefined;
    const trainerData = {
        name: trainerFormState.name,
        isActive: trainerFormState.isActive,
        branchIds: branchIds,
        branchRates: branchRates,
        color: trainerFormState.color,
        photoUrl: trainerFormState.photoUrl,
    };

    if (trainerToEdit) {
        const updatedTrainer = await DataManager.updateTrainer(trainerToEdit.id, trainerData);
        if (updatedTrainer) {
          setTrainers(trainers.map(t => t.id === updatedTrainer.id ? updatedTrainer : t));
          await addAuditLog('수정', '강사', updatedTrainer.name, `강사 정보를 수정했습니다.`, branchIdForLog);
        }
    } else {
        const newTrainer = await DataManager.createTrainer(trainerData);
        if (newTrainer) {
          setTrainers([...trainers, newTrainer]);
          await addAuditLog('생성', '강사', newTrainer.name, `신규 강사를 등록했습니다.`, branchIdForLog);
        }
    }
    handleCloseTrainerModal();
  };


  const handleDeleteTrainer = async (trainerId: string) => {
    const trainerToDelete = trainers.find(t => t.id === trainerId);
    if (trainerToDelete && window.confirm(`${trainerToDelete.name} 강사를 삭제하시겠습니까?`)) {
        const success = await DataManager.deleteTrainer(trainerId);
        if (success) {
          setTrainers(trainers.filter(t => t.id !== trainerId));
          await addAuditLog('삭제', '강사', trainerToDelete.name, '강사 정보를 삭제했습니다.', trainerToDelete.branchIds[0]);
        }
    }
  };
  
  const handleOpenUserModal = (user: User | null, context: { role?: UserRole, branchId?: string } | null = null) => {
    setUserToEdit(user);
    setNewUserContext(context);
    setUserModalOpen(true);
  };
  const handleCloseUserModal = () => {
    setUserModalOpen(false);
    setNewUserContext(null);
  };

  const handleSaveUser = async (userToSave: { name: string; email: string }) => {
    const role = newUserContext?.role || 'unassigned';
    const newUser = await AuthService.createUser(userToSave.name, userToSave.email, role, newUserContext?.branchId);
    
    if (newUser) {
      setUsers(prevUsers => [...prevUsers, newUser]);
      
      let logDetails = `신규 사용자 계정(${newUser.email})을 생성했습니다.`;
      let logBranchId: string | undefined = undefined;
      
      if (newUserContext?.role === 'manager' && newUserContext.branchId) {
        const branchName = branches.find(b => b.id === newUserContext.branchId)?.name;
        logDetails = `신규 사용자 ${newUser.name}을(를) ${branchName} 지점 매니저로 생성했습니다.`;
        logBranchId = newUserContext.branchId;
      }
      
      await addAuditLog('생성', '사용자', newUser.name || 'N/A', logDetails, logBranchId);
      handleCloseUserModal();
    } else {
      alert("사용자 생성에 실패했습니다. 이메일이 이미 존재할 수 있습니다.");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete && window.confirm(`${userToDelete.name}(${userToDelete.email}) 사용자를 삭제하시겠습니까?`)) {
      const success = await AuthService.deleteUser(userId);
      if (success) {
        setUsers(users.filter(u => u.id !== userId));
        await addAuditLog('삭제', '사용자', userToDelete.name || '', `사용자 계정(${userToDelete.email})을 삭제했습니다.`);
      }
    }
  };

  const handleUpdateUserPermissions = async (userId: string, updates: Partial<User>) => {
    const updatedUser = await AuthService.updateUser(userId, updates);
    if (updatedUser) {
      setUsers(users.map(u => u.id === userId ? updatedUser : u));
    }
    return updatedUser;
  };

  const handleUpdateManagerBranches = async (userId: string, newBranches: string[]) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const updates: Partial<User> = {
      assignedBranchIds: newBranches
    };

    // If no branches assigned, set role to unassigned
    if (newBranches.length === 0) {
      updates.role = 'unassigned';
    } else if (user.role === 'unassigned') {
      updates.role = 'manager';
    }

    const updatedUser = await handleUpdateUserPermissions(userId, updates);
    if (updatedUser) {
      const branchNames = newBranches.map(branchId => 
        branches.find(b => b.id === branchId)?.name || branchId
      ).join(', ');
      
      const logDetails = newBranches.length > 0 
        ? `${updatedUser.name} 사용자를 ${branchNames} 지점 매니저로 배정했습니다.`
        : `${updatedUser.name} 사용자의 모든 지점 배정을 해제했습니다.`;
      
      await addAuditLog('수정', '사용자', updatedUser.name || 'N/A', logDetails);
    }
  };
    
  const handleSessionClick = (programId: string, sessionNumber: number, session: Session | null) => {
    if (session) {
      // 완료된 세션을 관리자가 클릭하면 수업료 수정 모달 열기
      if (session.status === SessionStatus.Completed && currentUser?.role === 'admin') {
        setSessionToEditFee(session);
        setSessionFeeModalOpen(true);
      } else {
        setCompletionData(session);
        setCompletionModalOpen(true);
      }
    } else {
      setSessionToEdit(null);
      setBookingData({ programId, sessionNumber });
      setBookingModalOpen(true);
    }
  };

  const handleCalendarSessionClick = (session: Session) => {
    setCompletionData(session);
    setCompletionModalOpen(true);
  };

  const handleCloseBookingModal = () => setBookingModalOpen(false);

  const handleSaveSession = async (sessionData: Omit<Session, 'id' | 'status' | 'trainerFee' | 'trainerRate'>) => {
    const program = programs.find(p => p.id === sessionData.programId);
    const trainer = trainers.find(t => t.id === sessionData.trainerId);
    if (!program || !trainer) return;

    const rateInfo = trainer.branchRates[program.branchId];
    let trainerFee = 0;
    let trainerRateForDb = 0;

    if (rateInfo) {
        if (rateInfo.type === 'fixed') {
            trainerFee = rateInfo.value;
            trainerRateForDb = -1; // Special value for fixed rate
        } else { // percentage
            trainerFee = program.unitPrice * rateInfo.value;
            trainerRateForDb = rateInfo.value;
        }
    } else {
        // Fallback for trainers not assigned to this branch, or old data
        trainerFee = program.unitPrice * 0.5;
        trainerRateForDb = 0.5;
    }

    const fullSessionData = { 
        ...sessionData,
        trainerRate: trainerRateForDb, 
        trainerFee: trainerFee, 
        status: sessionToEdit?.status || SessionStatus.Booked // 기존 상태 유지
    };
    
    if (sessionToEdit) {
      const updatedSession = await DataManager.updateSession(sessionToEdit.id, fullSessionData);
      if (updatedSession) {
        setSessions(sessions.map(s => s.id === updatedSession.id ? updatedSession : s));
      }
    } else {
      const newSession = await DataManager.createSession(fullSessionData);
      if (newSession) {
        setSessions([...sessions, newSession]);
      }
    }
    handleCloseBookingModal();
    setSessionToEdit(null);
  };
  
  const handleCloseCompletionModal = () => setCompletionModalOpen(false);
  
  const handleRevertSession = async (sessionToRevert: Session) => {
    if (window.confirm(`'${sessionToRevert.date} ${sessionToRevert.startTime}' 수업의 완료를 취소하시겠습니까?`)) {
      const updatedSessionData = { 
        status: SessionStatus.Booked,
        completedAt: undefined,
        sessionFee: undefined
      };
      const updatedSession = await DataManager.updateSession(sessionToRevert.id, updatedSessionData);
      if (updatedSession) {
        setSessions(sessions.map(s => s.id === updatedSession.id ? updatedSession : s));
        await addAuditLog('수정', '프로그램', `세션 ${sessionToRevert.sessionNumber}회차`, `'${sessionToRevert.date} ${sessionToRevert.startTime}' 수업 완료를 취소했습니다.`);
      }
    }
  };

  const handleUpdateSessionFee = async (sessionId: string, newFee: number) => {
    try {
      console.log('수업료 수정 시작:', { sessionId, newFee });
      
      // 먼저 sessionFee로 시도
      let updatedSession = await DataManager.updateSession(sessionId, { sessionFee: newFee });
      console.log('sessionFee 업데이트 결과:', updatedSession);
      
      // sessionFee가 실패하면 trainerFee로 시도 (임시 해결책)
      if (!updatedSession) {
        console.log('sessionFee 업데이트 실패, trainerFee로 재시도...');
        updatedSession = await DataManager.updateSession(sessionId, { trainerFee: newFee });
        console.log('trainerFee 업데이트 결과:', updatedSession);
      }
      
      if (updatedSession) {
        setSessions(sessions.map(s => s.id === updatedSession.id ? updatedSession : s));
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
          await addAuditLog('수정', '프로그램', `세션 ${session.sessionNumber}회차`, `'${session.date} ${session.startTime}' 수업료를 ${newFee.toLocaleString()}원으로 수정했습니다.`);
        }
        alert('수업료가 성공적으로 수정되었습니다.');
      } else {
        console.error('DataManager.updateSession이 null을 반환했습니다.');
        alert('수업료 수정에 실패했습니다. (데이터베이스 오류)');
      }
    } catch (error) {
      console.error('수업료 수정 중 오류:', error);
      alert(`수업료 수정 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setSessionFeeModalOpen(false);
      setSessionToEditFee(null);
    }
  };
  
  const handleCompleteSession = async (sessionToComplete: Session, attendedMemberIds: string[], sessionFee?: number) => {
    try {
      console.log('수업 완료 처리 시작:', { sessionToComplete: sessionToComplete.id, attendedMemberIds, sessionFee });
      
      const program = programs.find(p => p.id === sessionToComplete.programId);
      if (!program) {
        console.error('프로그램을 찾을 수 없습니다:', sessionToComplete.programId);
        alert('프로그램을 찾을 수 없습니다.');
        return;
      }

      const updatedSessionData = { 
        status: SessionStatus.Completed, 
        attendedMemberIds: attendedMemberIds,
        completedAt: new Date().toISOString(),
        sessionFee: sessionFee || sessionToComplete.trainerFee
      };
      
      console.log('세션 업데이트 데이터:', updatedSessionData);
      const updatedSession = await DataManager.updateSession(sessionToComplete.id, updatedSessionData);
      console.log('세션 업데이트 결과:', updatedSession);
      
      if (!updatedSession) {
        console.error('세션 업데이트 실패');
        alert('수업 완료 처리에 실패했습니다.');
        return;
      }
      
      const wasAlreadyCompleted = sessionToComplete.status === SessionStatus.Completed;
      const updatedSessions = sessions.map(s => s.id === updatedSession.id ? updatedSession : s);
      setSessions(updatedSessions);

      if (!wasAlreadyCompleted) {
          const newCompletedCount = updatedSessions.filter(s => s.programId === program.id && s.status === SessionStatus.Completed).length;
          const programUpdates = {
              completedSessions: newCompletedCount,
              status: newCompletedCount >= program.totalSessions ? '만료' as ProgramStatus : program.status,
          };
          console.log('프로그램 업데이트 데이터:', programUpdates);
          const updatedProgram = await DataManager.updateProgram(program.id, programUpdates);
          console.log('프로그램 업데이트 결과:', updatedProgram);
          
          if (updatedProgram) {
            setPrograms(programs.map(p => p.id === updatedProgram.id ? updatedProgram : p));
          }
      }
      
      // 감사 로그 추가
      await addAuditLog('수정', '프로그램', `세션 ${sessionToComplete.sessionNumber}회차`, `'${sessionToComplete.date} ${sessionToComplete.startTime}' 수업을 완료 처리했습니다.`);
      
      alert('수업이 성공적으로 완료 처리되었습니다.');
      handleCloseCompletionModal();
    } catch (error) {
      console.error('수업 완료 처리 중 오류:', error);
      alert(`수업 완료 처리 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    const success = await DataManager.deleteSession(sessionId);
    if (success) {
      setSessions(sessions.filter(s => s.id !== sessionId));
      handleCloseBookingModal();
      handleCloseCompletionModal();
      setSessionToEdit(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    // Case 1: Dragging a trainer to activate/deactivate in the sidebar
    if (overId === 'active-droppable' || overId === 'inactive-droppable') {
        const trainer = trainers.find(t => t.id === activeId);
        if (!trainer) return;

        const newIsActive = overId === 'active-droppable';
        
        if (trainer.isActive === newIsActive) return; // No change needed

        const updatedTrainer = await DataManager.updateTrainer(trainer.id, { isActive: newIsActive });
        if (updatedTrainer) {
          setTrainers(trainers.map(t => (t.id === updatedTrainer.id ? updatedTrainer : t)));
          const statusText = newIsActive ? '활성' : '비활성';
          await addAuditLog('수정', '강사', trainer.name, `강사 상태를 ${statusText}으로 변경했습니다.`, trainer.branchIds[0]);
        }
        return;
    }

    // Case 2: Dragging a user in Permissions Management
    if (overId.startsWith('droppable-')) {
        const userToUpdate = users.find(u => u.id === activeId);
        if (!userToUpdate || userToUpdate.role === 'admin') return;

        const targetId = overId.replace('droppable-', '');
        const parts = targetId.split('-');
        const newRole = parts[0] as UserRole;
        const branchId = parts.length > 1 && parts[1] !== 'global' ? parts.slice(1).join('-') : null;

        let updates: Partial<User> = {};
        let logDetails = '';

        if (newRole === 'manager' && branchId) {
            updates.role = 'manager';
            const currentBranches = userToUpdate.assignedBranchIds || [];
            if (!currentBranches.includes(branchId)) {
                updates.assignedBranchIds = [...currentBranches, branchId];
            }
            const branchName = branches.find(b => b.id === branchId)?.name;
            logDetails = `${userToUpdate.name} 사용자를 ${branchName} 지점 매니저로 배정했습니다.`;
        } else if (newRole === 'unassigned' && userToUpdate.role === 'manager' && !branchId) {
             // Unassign from all branches, move to global unassigned
            updates.role = 'unassigned';
            updates.assignedBranchIds = [];
            logDetails = `${userToUpdate.name} 사용자를 모든 지점에서 배정 해제했습니다.`;
        } else if (newRole === 'unassigned' && branchId) {
            // Remove from specific branch
            const currentBranches = userToUpdate.assignedBranchIds || [];
            const newBranches = currentBranches.filter(b => b !== branchId);
            updates.assignedBranchIds = newBranches;
            
            if (newBranches.length === 0) {
                updates.role = 'unassigned';
            }
            
            const branchName = branches.find(b => b.id === branchId)?.name;
            logDetails = `${userToUpdate.name} 사용자를 ${branchName} 지점에서 배정 해제했습니다.`;
        }
        
        if (Object.keys(updates).length > 0) {
            const updatedUser = await handleUpdateUserPermissions(activeId, updates);
            if (updatedUser) {
                await addAuditLog('수정', '사용자', updatedUser.name || 'N/A', logDetails, branchId || undefined);
            }
        }
        return;
    }

    // Case 3: Dragging a trainer onto a program row
    const trainer = trainers.find(t => t.id === activeId);
    const program = programs.find(p => p.id === overId);

    if (trainer && program) {
        if (!trainer.isActive) {
            alert('비활성 상태의 강사는 배정할 수 없습니다.');
            return;
        }
        const updatedProgram = await DataManager.updateProgram(program.id, { assignedTrainerId: trainer.id });
        if (updatedProgram) {
          setPrograms(programs.map(p => p.id === updatedProgram.id ? updatedProgram : p));
          await addAuditLog('수정', '프로그램', updatedProgram.programName, `${updatedProgram.programName}에 ${trainer.name} 강사를 배정했습니다.`, updatedProgram.branchId);
        }
    }
  };

  const handleSetProgramFilter = (newFilter: typeof programFilter) => {
    // If branchId changes, reset trainerId to avoid inconsistent state
    if (newFilter.branchId !== programFilter.branchId) {
      newFilter.trainerId = '';
    }
    setProgramFilter(newFilter);
  };


  if (isLoading) {
    return (
        <div className="h-screen w-screen flex flex-col justify-center items-center bg-slate-100">
            <DumbbellIcon className="h-12 w-12 text-blue-600 animate-spin" />
            <p className="text-slate-500 mt-4">데이터를 불러오는 중입니다...</p>
        </div>
    );
  }

  if (!currentUser) {
    return <Auth allBranches={branches} onLogin={handleLogin} />;
  }

  if (currentUser.role === 'unassigned') {
    return (
        <div className="h-screen w-screen flex flex-col justify-center items-center bg-slate-100 p-4 text-center">
             <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-slate-800">승인 대기 중</h2>
                <p className="text-slate-500 mt-2">관리자가 계정을 승인할 때까지 기다려주세요.</p>
                <button onClick={handleLogout} className="mt-6 px-4 py-2 bg-slate-600 text-white rounded-md text-sm font-medium hover:bg-slate-700">
                    로그아웃
                </button>
            </div>
        </div>
    );
  }

  const filteredPrograms = programs.filter(p => {
    const member = members.find(m => p.memberIds.includes(m.id));
    const memberName = member ? member.name.toLowerCase() : '';
    const searchLower = programFilter.search.toLowerCase();
    
    return (
      (programFilter.status === '전체' || p.status === programFilter.status) &&
      (programFilter.search === '' || p.programName.toLowerCase().includes(searchLower) || memberName.includes(searchLower)) &&
      (programFilter.trainerId === '' || p.assignedTrainerId === programFilter.trainerId) &&
      (programFilter.branchId === '' || p.branchId === programFilter.branchId)
    );
  });
  
  const filteredMembers = members.filter(m => memberFilter.branchId === '' || m.branchId === memberFilter.branchId);
  
  const filteredTrainersForDisplay = trainers.filter(t => {
    // 매니저의 경우 소속 지점의 강사만 표시
    if (currentUser?.role === 'manager' && currentUser.assignedBranchIds) {
      return t.branchIds.some(branchId => currentUser.assignedBranchIds!.includes(branchId));
    }
    // 관리자는 모든 강사 표시
    return true;
  });

  const handleMemberClick = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (member) {
        setSelectedMemberForDetail(member);
        setMemberDetailModalOpen(true);
    }
  };
  
  const generateMemberHistory = (member: Member | null): HistoryItem[] => {
    if (!member) return [];
    
    const memberPrograms = programs.filter(p => p.memberIds.includes(member.id));
    const memberProgramIds = memberPrograms.map(p => p.id);
    const memberSessions = sessions.filter(s => memberProgramIds.includes(s.programId) && s.attendedMemberIds.includes(member.id));

    const programHistory: HistoryItem[] = memberPrograms.map(p => ({
        date: p.registrationDate, time: '00:00', type: '프로그램 등록',
        description: `${p.programName} (${p.registrationType})`,
        trainerName: trainers.find(t => t.id === p.assignedTrainerId)?.name || '미배정',
        amount: p.totalAmount, amountType: '결제',
    }));

    const sessionHistory: HistoryItem[] = memberSessions.map(s => {
        const program = programs.find(p => p.id === s.programId);
        return {
            date: s.date, time: s.startTime,
            type: s.status === SessionStatus.Completed ? '수업 완료' : '수업 예약',
            description: `${program?.programName || ''} ${s.sessionNumber}회차`,
            trainerName: trainers.find(t => t.id === s.trainerId)?.name || 'N/A',
            amount: s.status === SessionStatus.Completed ? (program?.unitPrice || 0) : 0,
            amountType: s.status === SessionStatus.Completed ? '수업료' : '',
        };
    });

    return [...programHistory, ...sessionHistory].sort((a, b) => new Date(`${b.date}T${b.time || '00:00'}`).getTime() - new Date(`${a.date}T${a.time || '00:00'}`).getTime());
  }

  const memberHistory = generateMemberHistory(selectedMemberForDetail);
  
  const filteredMembersForModal = programFormData.branchId ? members.filter(m => m.branchId === programFormData.branchId) : [];
  const filteredTrainersForModal = programFormData.branchId ? trainers.filter(t => t.isActive && t.branchIds.includes(programFormData.branchId)) : [];
  const filteredPresetsForModal = programFormData.branchId 
      ? programPresets.filter(p => !p.branchId || p.branchId === programFormData.branchId) 
      : programPresets.filter(p => !p.branchId);

  return (
    <DndContext onDragEnd={handleDragEnd}>
    <div className="h-screen flex flex-col">
      <Header currentView={currentView} setCurrentView={setViewWithPermissions} currentUser={currentUser} onLogout={handleLogout} />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex overflow-hidden">
          {currentView === 'programs' && <ProgramTable programs={filteredPrograms} members={members} sessions={sessions} trainers={filteredTrainersForDisplay} onAddProgram={() => handleOpenProgramModal(null)} onEditProgram={handleOpenProgramModal} onReRegisterProgram={(p) => handleOpenProgramModal({...p, id: ``, registrationType: '재등록', completedSessions: 0, status: '유효'})} onDeleteProgram={handleDeleteProgram} onSessionClick={handleSessionClick} filter={programFilter} setFilter={handleSetProgramFilter} allBranches={branches} onShowTooltip={(content, rect) => setTooltip({ content, rect })} onHideTooltip={() => setTooltip(null)} currentUser={currentUser} />}
          {currentView === 'dashboard' && <Dashboard trainers={filteredTrainersForDisplay} sessions={sessions} programs={programs} members={members} startDate={filterStartDate} endDate={filterEndDate} setStartDate={setFilterStartDate} setEndDate={setFilterEndDate} onTrainerClick={(trainerId) => { const t = trainers.find(t=>t.id===trainerId); if(t) {setSelectedTrainerForDetail(t); setTrainerDetailModalOpen(true);}}} onSessionEventClick={handleCalendarSessionClick} allBranches={branches} filter={dashboardFilter} setFilter={setDashboardFilter} />}
          {/* FIX: Changed setFilter to setMemberFilter to pass the correct state updater function. */}
          {currentView === 'members' && <MemberManagement members={filteredMembers} programs={programs} sessions={sessions} onAddMember={() => handleOpenMemberModal(null)} onEditMember={handleOpenMemberModal} onDeleteMember={handleDeleteMember} onMemberClick={handleMemberClick} allBranches={branches} filter={memberFilter} setFilter={setMemberFilter} currentUser={currentUser} />}
          {currentView === 'logs' && <LogManagement logs={auditLogs} branches={branches} currentUser={currentUser} />}
          {currentView === 'management' && <ManagementView currentUser={currentUser} users={users} trainers={trainers} allBranches={branches} presets={programPresets} onAddUser={(context) => handleOpenUserModal(null, context)} onDeleteUser={handleDeleteUser} onUpdateManagerBranches={handleUpdateManagerBranches} onAddPreset={() => handleOpenPresetModal(null)} onEditPreset={handleOpenPresetModal} onDeletePreset={handleDeletePreset} onAddBranch={() => handleOpenBranchModal(null)} onEditBranch={handleOpenBranchModal} onDeleteBranch={handleDeleteBranch} />}
        </main>
        {currentView === 'programs' && <Sidebar trainers={filteredTrainersForDisplay} onAddTrainer={() => handleOpenTrainerModal(null)} onEditTrainer={handleOpenTrainerModal} onDeleteTrainer={handleDeleteTrainer} currentUser={currentUser} branches={branches} />}
      </div>
      
       {isTrainerDetailModalOpen && (
        <TrainerDetailModal
          isOpen={isTrainerDetailModalOpen}
          onClose={() => setTrainerDetailModalOpen(false)}
          trainer={selectedTrainerForDetail}
          sessions={sessions.filter(s => s.trainerId === selectedTrainerForDetail?.id && s.status === 'completed')}
          programs={programs}
          members={members}
          startDate={filterStartDate}
          endDate={filterEndDate}
        />
      )}
      {isMemberDetailModalOpen && (
        <MemberDetailModal
          isOpen={isMemberDetailModalOpen}
          onClose={() => setMemberDetailModalOpen(false)}
          member={selectedMemberForDetail}
          history={memberHistory}
          members={members}
          programs={programs}
          sessions={sessions}
          trainers={trainers}
          branches={branches}
          onShowTooltip={(content, rect) => setTooltip({ content, rect })}
          onHideTooltip={() => setTooltip(null)}
        />
      )}
      <Modal isOpen={isUserModalOpen} onClose={handleCloseUserModal} title={userToEdit ? "사용자 수정" : "신규 사용자 추가"}>
        <form onSubmit={(e) => { e.preventDefault(); const formData = new FormData(e.currentTarget); handleSaveUser({ name: formData.get('name') as string, email: formData.get('email') as string }); }}>
          <div className="space-y-4">
            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-slate-700">이름</label>
              <input type="text" id="userName" name="name" defaultValue={userToEdit?.name || ''} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
            </div>
            <div>
              <label htmlFor="userEmail" className="block text-sm font-medium text-slate-700">이메일</label>
              <input type="email" id="userEmail" name="email" defaultValue={userToEdit?.email || ''} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
            </div>
             {!userToEdit && <div>
                <p className="text-sm text-slate-500">초기 비밀번호는 가입 이메일로 전송됩니다. 사용자는 '비밀번호 찾기' 기능을 통해 비밀번호를 재설정할 수 있습니다.</p>
              </div>}
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={handleCloseUserModal} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">취소</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">저장</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isProgramModalOpen} onClose={handleCloseProgramModal} title={programToEdit ? "프로그램 수정" : "신규 프로그램 등록"} maxWidth="max-w-4xl">
        <form onSubmit={handleSaveProgram}>
          <div className="space-y-4">
            {/* 프리셋 선택 */}
            <div>
              <label className="block text-sm font-medium text-slate-700">프리셋 선택 (선택사항)</label>
              <select
                value={programFormData.selectedPresetId || ''}
                onChange={(e) => {
                  const presetId = e.target.value;
                  if (presetId) {
                    const preset = programPresets.find(p => p.id === presetId);
                    if (preset) {
                      const unitPrice = preset.totalSessions > 0 ? Math.round(preset.totalAmount / preset.totalSessions) : 0;
                      setProgramFormData(prev => ({
                        ...prev,
                        selectedPresetId: presetId,
                        programName: preset.name,
                        totalAmount: String(preset.totalAmount),
                        totalSessions: String(preset.totalSessions),
                        unitPrice: String(unitPrice),
                        defaultSessionDuration: String(preset.defaultSessionDuration || 50),
                        fixedTrainerFee: preset.fixedTrainerFee ? String(preset.fixedTrainerFee) : '',
                        sessionFees: preset.sessionFees || {}
                      }));
                    }
                  } else {
                    setProgramFormData(prev => ({
                      ...prev,
                      selectedPresetId: '',
                      programName: '',
                      totalAmount: '',
                      totalSessions: '',
                      unitPrice: '',
                      defaultSessionDuration: '50',
                      fixedTrainerFee: '',
                      sessionFees: {}
                    }));
                  }
                }}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"
              >
                <option value="">프리셋을 선택하세요</option>
                {programPresets.map(preset => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name} ({preset.totalAmount.toLocaleString()}원, {preset.totalSessions}회)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">프로그램명</label>
                <input
                  type="text"
                  value={programFormData.programName}
                  onChange={(e) => setProgramFormData(prev => ({ ...prev, programName: e.target.value }))}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">등록 유형</label>
                <select
                  value={programFormData.registrationType}
                  onChange={(e) => setProgramFormData(prev => ({ ...prev, registrationType: e.target.value as '신규' | '재등록' }))}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"
                >
                  <option value="신규">신규</option>
                  <option value="재등록">재등록</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">회원 선택</label>
              <div className="mt-2 space-y-2 max-h-32 overflow-y-auto border border-slate-300 rounded-md p-2">
                {members.map(member => (
                  <label key={member.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={programFormData.memberIds.includes(member.id)}
                      onChange={() => handleMemberSelectionChange(member.id)}
                      className="mr-2"
                    />
                    {member.name} ({member.contact})
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">총 금액</label>
                <input
                  type="number"
                  value={programFormData.totalAmount}
                  onChange={(e) => {
                    const totalAmount = e.target.value;
                    const totalSessions = Number(programFormData.totalSessions);
                    const unitPrice = totalSessions > 0 ? Math.round(Number(totalAmount) / totalSessions) : 0;
                    setProgramFormData(prev => ({ 
                      ...prev, 
                      totalAmount,
                      unitPrice: String(unitPrice)
                    }));
                  }}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">총 세션 수</label>
                <input
                  type="number"
                  value={programFormData.totalSessions}
                  onChange={(e) => {
                    const totalSessions = e.target.value;
                    const totalAmount = Number(programFormData.totalAmount);
                    const unitPrice = Number(totalSessions) > 0 ? Math.round(totalAmount / Number(totalSessions)) : 0;
                    setProgramFormData(prev => ({ 
                      ...prev, 
                      totalSessions,
                      unitPrice: String(unitPrice)
                    }));
                  }}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">단가 (자동계산)</label>
                <input
                  type="number"
                  value={programFormData.unitPrice}
                  readOnly
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm bg-gray-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">수업시간 (분)</label>
                <input
                  type="number"
                  value={programFormData.defaultSessionDuration}
                  onChange={(e) => setProgramFormData(prev => ({ ...prev, defaultSessionDuration: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">고정 강사료 (원)</label>
                <input
                  type="number"
                  value={programFormData.fixedTrainerFee}
                  onChange={(e) => setProgramFormData(prev => ({ ...prev, fixedTrainerFee: e.target.value }))}
                  placeholder="예: 20000 (오티)"
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"
                />
              </div>
            </div>

            {/* 회차별 수업료 동적 필드 */}
            {Number(programFormData.totalSessions) > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700">회차별 수업료 (선택사항)</label>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {Array.from({ length: Number(programFormData.totalSessions) }, (_, i) => i + 1).map(sessionNum => (
                    <div key={sessionNum}>
                      <label className="block text-xs text-slate-600">{sessionNum}회차</label>
                      <input
                        type="number"
                        value={programFormData.sessionFees?.[sessionNum] || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setProgramFormData(prev => ({
                            ...prev,
                            sessionFees: {
                              ...prev.sessionFees,
                              [sessionNum]: value ? Number(value) : undefined
                            }
                          }));
                        }}
                        placeholder="선택사항"
                        className="mt-1 block w-full px-2 py-1 text-sm border border-slate-300 rounded-md shadow-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">등록일</label>
                <input
                  type="date"
                  value={programFormData.registrationDate}
                  onChange={(e) => setProgramFormData(prev => ({ ...prev, registrationDate: e.target.value }))}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">결제일</label>
                <input
                  type="date"
                  value={programFormData.paymentDate}
                  onChange={(e) => setProgramFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">담당 강사</label>
                <select
                  value={programFormData.assignedTrainerId}
                  onChange={(e) => setProgramFormData(prev => ({ ...prev, assignedTrainerId: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"
                >
                  <option value="">강사 선택</option>
                  {filteredTrainersForModal.map(trainer => (
                    <option key={trainer.id} value={trainer.id}>{trainer.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">지점</label>
                <select
                  value={programFormData.branchId}
                  onChange={(e) => setProgramFormData(prev => ({ ...prev, branchId: e.target.value }))}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"
                >
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">메모</label>
              <textarea
                value={programFormData.memo}
                onChange={(e) => setProgramFormData(prev => ({ ...prev, memo: e.target.value }))}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={handleCloseProgramModal} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">취소</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">저장</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isPresetModalOpen} onClose={handleClosePresetModal} title={presetToEdit ? "프리셋 수정" : "신규 프리셋 추가"}>
    <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        // 회차별 수업료 파싱
        const sessionFees: { [sessionNumber: number]: number } = {};
        const totalSessions = Number(formData.get('totalSessions'));
        for (let i = 1; i <= totalSessions; i++) {
            const fee = formData.get(`sessionFee_${i}`);
            if (fee && Number(fee) > 0) {
                sessionFees[i] = Number(fee);
            }
        }
        
        const data: Omit<ProgramPreset, 'id'> = {
            name: formData.get('name') as string,
            totalAmount: Number(formData.get('totalAmount')),
            totalSessions: totalSessions,
            branchId: formData.get('branchId') as string || null,
            defaultSessionDuration: formData.get('defaultSessionDuration') ? Number(formData.get('defaultSessionDuration')) : undefined,
            fixedTrainerFee: formData.get('fixedTrainerFee') ? Number(formData.get('fixedTrainerFee')) : undefined,
            sessionFees: Object.keys(sessionFees).length > 0 ? sessionFees : undefined
        };
        handleSavePreset(data);
    }}>
        <div className="space-y-4">
            <div><label className="block text-sm font-medium text-slate-700">프리셋 이름</label><input type="text" name="name" defaultValue={presetToEdit?.name} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/></div>
            <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700">총 금액</label><input type="number" name="totalAmount" defaultValue={presetToEdit?.totalAmount} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/></div>
                <div><label className="block text-sm font-medium text-slate-700">총 횟수</label><input type="number" name="totalSessions" defaultValue={presetToEdit?.totalSessions} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700">수업시간 (분)</label><input type="number" name="defaultSessionDuration" defaultValue={presetToEdit?.defaultSessionDuration || 50} placeholder="50" className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/></div>
                <div><label className="block text-sm font-medium text-slate-700">고정 강사료 (원)</label><input type="number" name="fixedTrainerFee" defaultValue={presetToEdit?.fixedTrainerFee} placeholder="예: 20000 (오티)" className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/></div>
            </div>
            
            {/* 회차별 수업료 설정 */}
            <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="text-sm font-medium text-slate-700 mb-3">회차별 수업료 설정 (선택사항)</h4>
                <div className="grid grid-cols-3 gap-2" id="sessionFeesContainer">
                    {/* JavaScript로 동적으로 생성될 필드들 */}
                </div>
                <p className="text-xs text-gray-500 mt-2">각 회차별로 다른 수업료를 설정할 수 있습니다. 비워두면 기본 수업료가 적용됩니다.</p>
            </div>
            
            <div><label className="block text-sm font-medium text-slate-700">적용 지점</label>
                <select name="branchId" defaultValue={presetToEdit?.branchId || (currentUser?.role === 'manager' && currentUser.assignedBranchIds && currentUser.assignedBranchIds.length > 0 ? currentUser.assignedBranchIds[0] : '')} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm">
                    <option value="">모든 지점</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
            </div>
            <div className="p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-700">
                    <strong>고정 강사료 설정:</strong> 값을 입력하면 강사 요율에 상관없이 해당 금액을 지급합니다. 
                    예: 오티의 경우 20,000원 입력
                </p>
            </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={handleClosePresetModal} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">취소</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">저장</button>
        </div>
    </form>
</Modal>

    <Modal isOpen={isBranchModalOpen} onClose={() => { setBranchModalOpen(false); setBranchToEdit(null); }} title={branchToEdit ? "지점 수정" : "신규 지점 추가"}>
        <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const data: Omit<Branch, 'id'> = {
                name: formData.get('name') as string,
                createdAt: branchToEdit?.createdAt || new Date().toISOString()
            };
            handleSaveBranch(data);
        }}>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700">지점명</label>
                    <input 
                        type="text" 
                        name="name" 
                        defaultValue={branchToEdit?.name} 
                        required 
                        className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"
                        placeholder="예: 강남점, 홍대점"
                    />
                </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={() => { setBranchModalOpen(false); setBranchToEdit(null); }} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">취소</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">저장</button>
            </div>
        </form>
    </Modal>

    <Modal isOpen={isSessionFeeModalOpen} onClose={() => { setSessionFeeModalOpen(false); setSessionToEditFee(null); }} title="수업료 수정">
        <form onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const newFee = Number(formData.get('sessionFee'));
            if (sessionToEditFee) {
                await handleUpdateSessionFee(sessionToEditFee.id, newFee);
            }
        }}>
            <div className="space-y-4">
                {sessionToEditFee && (
                    <>
                        <div className="p-3 bg-slate-100 rounded-md text-sm">
                            <p><strong>수업 일시:</strong> {sessionToEditFee.date} {sessionToEditFee.startTime}</p>
                            <p><strong>현재 수업료:</strong> {(sessionToEditFee.sessionFee || sessionToEditFee.trainerFee).toLocaleString()}원</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">새 수업료</label>
                            <input 
                                type="number" 
                                name="sessionFee" 
                                defaultValue={sessionToEditFee.sessionFee || sessionToEditFee.trainerFee}
                                required 
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"
                                placeholder="수업료를 입력하세요"
                            />
                        </div>
                    </>
                )}
            </div>
            <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={() => { setSessionFeeModalOpen(false); setSessionToEditFee(null); }} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">취소</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">수정</button>
            </div>
        </form>
    </Modal>

     <Modal isOpen={isMemberModalOpen} onClose={handleCloseMemberModal} title={memberToEdit ? "회원 정보 수정" : "신규 회원 등록"} maxWidth="max-w-2xl">
        <form id="member-form" onSubmit={(e) => {
            e.preventDefault();
            const data: Omit<Member, 'id'> = {
                name: memberFormData.name || '',
                contact: memberFormData.contact || '',
                branchId: memberFormData.branchId || '',
                referrerId: memberFormData.referrerId || undefined,
                exerciseGoals: memberFormData.exerciseGoals || [],
                motivation: memberFormData.motivation || '',
                medicalHistory: memberFormData.medicalHistory || '',
                exerciseExperience: memberFormData.exerciseExperience || undefined,
                preferredTime: memberFormData.preferredTime || [],
                occupation: memberFormData.occupation || '',
                memo: memberFormData.memo || '',
            };
            handleSaveMember(data);
        }}>
            <div className="border-b border-slate-200 mb-4"><nav className="-mb-px flex space-x-6">
                <button type="button" onClick={() => handleMemberTabChange('basic')} className={`py-3 px-1 border-b-2 font-medium text-sm ${memberModalTab === 'basic' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>기본 정보</button>
                <button type="button" onClick={() => handleMemberTabChange('detail')} className={`py-3 px-1 border-b-2 font-medium text-sm ${memberModalTab === 'detail' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>상세 정보</button>
            </nav></div>

            {memberModalTab === 'basic' && (<div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-slate-700">이름</label><input type="text" name="name" value={memberFormData.name || ''} onChange={(e) => setMemberFormData({...memberFormData, name: e.target.value})} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/></div>
                    <div><label className="block text-sm font-medium text-slate-700">연락처</label><input type="text" name="contact" value={memberFormData.contact || ''} onChange={(e) => setMemberFormData({...memberFormData, contact: e.target.value})} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-slate-700">소속 지점</label>
                        <select name="branchId" value={memberFormData.branchId || ''} onChange={(e) => setMemberFormData({...memberFormData, branchId: e.target.value})} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm">
                            <option value="">지점을 선택하세요</option>
                            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    <div><label className="block text-sm font-medium text-slate-700">소개 회원 (선택)</label>
                        <select name="referrerId" value={memberFormData.referrerId || ''} onChange={(e) => setMemberFormData({...memberFormData, referrerId: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm">
                            <option value="">없음</option>
                            {members.filter(m => m.id !== memberToEdit?.id).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                </div>
                <div><label className="block text-sm font-medium text-slate-700">메모</label><textarea name="memo" value={memberFormData.memo || ''} onChange={(e) => setMemberFormData({...memberFormData, memo: e.target.value})} rows={4} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/></div>
            </div>)}

            {memberModalTab === 'detail' && (<div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div><label className="block text-sm font-medium text-slate-700">주요 운동 목표</label><div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {exerciseGoalOptions.map(goal => (<label key={goal} className="flex items-center space-x-2 text-sm">
                        <input type="checkbox" name="exerciseGoals" value={goal} checked={memberFormData.exerciseGoals?.includes(goal) || false} onChange={(e) => {
                            const currentGoals = memberFormData.exerciseGoals || [];
                            if (e.target.checked) {
                                setMemberFormData({...memberFormData, exerciseGoals: [...currentGoals, goal]});
                            } else {
                                setMemberFormData({...memberFormData, exerciseGoals: currentGoals.filter(g => g !== goal)});
                            }
                        }} className="rounded"/><span>{goal}</span></label>
                    ))}
                </div></div>
                <div><label className="block text-sm font-medium text-slate-700">운동 동기</label><input type="text" name="motivation" value={memberFormData.motivation || ''} onChange={(e) => setMemberFormData({...memberFormData, motivation: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/></div>
                <div><label className="block text-sm font-medium text-slate-700">특이사항 / 부상 이력</label><textarea name="medicalHistory" value={memberFormData.medicalHistory || ''} onChange={(e) => setMemberFormData({...memberFormData, medicalHistory: e.target.value})} rows={3} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-slate-700">운동 경력</label>
                        <select name="exerciseExperience" value={memberFormData.exerciseExperience || ''} onChange={(e) => setMemberFormData({...memberFormData, exerciseExperience: e.target.value as ExerciseExperience})} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm">
                            <option value="">선택...</option>{exerciseExperienceOptions.map(exp => <option key={exp} value={exp}>{exp}</option>)}
                        </select>
                    </div>
                    <div><label className="block text-sm font-medium text-slate-700">직업</label><input type="text" name="occupation" value={memberFormData.occupation || ''} onChange={(e) => setMemberFormData({...memberFormData, occupation: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/></div>
                </div>
                <div><label className="block text-sm font-medium text-slate-700">선호 운동 시간대</label><div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {preferredTimeOptions.map(time => (<label key={time} className="flex items-center space-x-2 text-sm">
                        <input type="checkbox" name="preferredTime" value={time} checked={memberFormData.preferredTime?.includes(time) || false} onChange={(e) => {
                            const currentTimes = memberFormData.preferredTime || [];
                            if (e.target.checked) {
                                setMemberFormData({...memberFormData, preferredTime: [...currentTimes, time]});
                            } else {
                                setMemberFormData({...memberFormData, preferredTime: currentTimes.filter(t => t !== time)});
                            }
                        }} className="rounded"/><span>{time}</span></label>
                    ))}
                </div></div>
            </div>)}

            <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={handleCloseMemberModal} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">취소</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">저장</button>
            </div>
        </form>
    </Modal>

    {trainerFormState && <Modal isOpen={isTrainerModalOpen} onClose={handleCloseTrainerModal} title={trainerToEdit ? "강사 정보 수정" : "신규 강사 등록"}>
        <form onSubmit={(e) => { e.preventDefault(); handleSaveTrainer(); }}>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700">이름</label>
                    <input type="text" name="name" value={trainerFormState.name} onChange={(e) => handleTrainerFormChange('name', e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">프로필 사진</label>
                    <div className="mt-2 flex items-center gap-4">
                        {trainerFormState.photoUrl && (
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-300">
                                    <img src={trainerFormState.photoUrl} alt="프로필 사진" className="w-full h-full object-cover"/>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => handleTrainerFormChange('photoUrl', '')}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                                >
                                    ×
                                </button>
                            </div>
                        )}
                        <div className="flex-1">
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                            handleTrainerFormChange('photoUrl', event.target?.result as string);
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            <p className="mt-1 text-xs text-slate-500">JPG, PNG 파일만 업로드 가능합니다. (최대 5MB)</p>
                        </div>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">색상</label>
                    <div className="mt-2 grid grid-cols-9 gap-2">
                        {availableColors.map(c => {
                            // 현재 선택된 지점들에서 사용된 색상들 찾기
                            const selectedBranches = Object.keys(trainerFormState.branches).filter(branchId => trainerFormState.branches[branchId].selected);
                            const usedColors = trainers
                                .filter(t => t.id !== trainerToEdit?.id && t.branchIds.some(branchId => selectedBranches.includes(branchId)))
                                .map(t => t.color);
                            const isColorUsed = usedColors.includes(c);
                            
                            return (
                                <button 
                                    type="button" 
                                    key={c} 
                                    onClick={() => handleTrainerFormChange('color', c)} 
                                    disabled={isColorUsed}
                                    className={`w-8 h-8 rounded-full ${c} relative ring-2 ring-offset-2 transition-all ${
                                        trainerFormState.color === c ? 'ring-blue-500' : 
                                        isColorUsed ? 'ring-red-300 opacity-50 cursor-not-allowed' : 
                                        'ring-transparent hover:ring-gray-300'
                                    }`}
                                    title={isColorUsed ? '이미 해당 지점에서 사용 중인 색상입니다' : ''}
                                >
                                    {trainerFormState.color === c && <CheckCircleIcon className="w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" />}
                                    {isColorUsed && <div className="absolute inset-0 bg-black bg-opacity-30 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">×</span>
                                    </div>}
                                </button>
                            );
                        })}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">선택된 지점에서 이미 사용 중인 색상은 선택할 수 없습니다.</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">소속 지점 및 수업료</label>
                    <div className="mt-2 space-y-3 p-3 border rounded-md max-h-48 overflow-y-auto">
                        {branches.map(branch => {
                            const branchState = trainerFormState.branches[branch.id];
                            return (<div key={branch.id} className="flex items-center gap-4 justify-between">
                                <label className="flex items-center space-x-3 text-sm flex-1">
                                    <input type="checkbox" name="branchIds" value={branch.id} 
                                      checked={branchState.selected} 
                                      onChange={(e) => handleTrainerBranchChange(branch.id, 'selected', e.target.checked)}
                                      className="rounded h-4 w-4 text-blue-600 focus:ring-blue-500"/>
                                    <span>{branch.name}</span>
                                </label>
                                {branchState.selected && <div className="flex items-center gap-1">
                                    <input 
                                        type="number" 
                                        value={branchState.rateValue}
                                        onChange={(e) => handleTrainerBranchChange(branch.id, 'rateValue', e.target.value)}
                                        min="0"
                                        className="w-24 px-2 py-1 border border-slate-300 rounded-md text-sm"
                                    />
                                    <select 
                                        value={branchState.rateType}
                                        onChange={(e) => handleTrainerBranchChange(branch.id, 'rateType', e.target.value)}
                                        className="px-2 py-1 border border-slate-300 rounded-md text-sm bg-slate-50">
                                        <option value="percentage">%</option>
                                        <option value="fixed">원</option>
                                    </select>
                                </div>}
                            </div>)
                        })}
                    </div>
                </div>
                <div>
                    <label className="flex items-center space-x-2 text-sm">
                        <input type="checkbox" name="isActive" 
                          checked={trainerFormState.isActive} 
                          onChange={(e) => handleTrainerFormChange('isActive', e.target.checked)}
                          className="rounded h-4 w-4 text-blue-600 focus:ring-blue-500"/>
                        <span>활성 상태</span>
                    </label>
                </div>
            </div>
             <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={handleCloseTrainerModal} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">취소</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">저장</button>
            </div>
        </form>
    </Modal>}
    
    {isBookingModalOpen && bookingData && (() => {
        const program = programs.find(p => p.id === bookingData.programId);
        if (!program) return null;
        const programMembers = members.filter(m => program.memberIds.includes(m.id));
        return (
            <Modal isOpen={isBookingModalOpen} onClose={handleCloseBookingModal} title={`${program.programName} ${bookingData.sessionNumber}회차 예약`}>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleSaveSession({
                        programId: bookingData.programId,
                        sessionNumber: bookingData.sessionNumber,
                        trainerId: formData.get('trainerId') as string,
                        date: formData.get('date') as string,
                        startTime: formData.get('startTime') as string,
                        duration: Number(formData.get('duration')),
                        attendedMemberIds: formData.getAll('attendedMemberIds') as string[],
                    });
                }}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium text-slate-700">날짜</label><input type="date" name="date" defaultValue={sessionToEdit?.date || new Date().toISOString().split('T')[0]} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/></div>
                            <div><label className="block text-sm font-medium text-slate-700">시작 시간</label><input type="time" name="startTime" defaultValue={sessionToEdit?.startTime || '10:00'} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/></div>
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium text-slate-700">강사</label><select name="trainerId" defaultValue={sessionToEdit?.trainerId || program.assignedTrainerId} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm">{trainers.filter(t => t.isActive).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                            <div><label className="block text-sm font-medium text-slate-700">수업 시간 (분)</label><input type="number" name="duration" defaultValue={sessionToEdit?.duration || program.defaultSessionDuration || 50} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/></div>
                        </div>
                        <div><label className="block text-sm font-medium text-slate-700">참석 회원</label><div className="mt-2 space-y-1">
                            {programMembers.map(member => (<label key={member.id} className="flex items-center">
                                <input type="checkbox" name="attendedMemberIds" value={member.id} defaultChecked={sessionToEdit ? sessionToEdit.attendedMemberIds.includes(member.id) : true} className="rounded"/>
                                <span className="ml-2 text-sm text-slate-700">{member.name}</span>
                            </label>))}
                        </div></div>
                    </div>
                    <div className="mt-6 flex justify-between">
                        <div>{sessionToEdit && <button type="button" onClick={() => handleDeleteSession(sessionToEdit.id)} className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm">예약 삭제</button>}</div>
                        <div className="flex gap-2">
                          <button type="button" onClick={handleCloseBookingModal} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">취소</button>
                          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">{sessionToEdit ? '수정' : '예약'}</button>
                        </div>
                    </div>
                </form>
            </Modal>
        )
    })()}

    {isCompletionModalOpen && completionData && (() => {
        const program = programs.find(p => p.id === completionData.programId);
        if (!program) return null;
        const programMembers = members.filter(m => program.memberIds.includes(m.id));
        return (
            <Modal isOpen={isCompletionModalOpen} onClose={handleCloseCompletionModal} title={`${program.programName} ${completionData.sessionNumber}회차 수업`}>
                <form onSubmit={(e) => {
                    e.preventDefault();
                     const formData = new FormData(e.currentTarget);
                     const attended = formData.getAll('attendedMemberIds') as string[];
                     const sessionFee = formData.get('sessionFee') ? Number(formData.get('sessionFee')) : undefined;
                     handleCompleteSession(completionData, attended, sessionFee);
                }}>
                    <div className="space-y-4">
                        <p className="text-slate-700"><span className="font-semibold">{completionData.date} {completionData.startTime}</span> 수업을 완료처리 하시겠습니까?</p>
                        <div><label className="block text-sm font-medium text-slate-700">참석 확인</label><div className="mt-2 space-y-1">
                            {programMembers.map(member => (<label key={member.id} className="flex items-center">
                                <input type="checkbox" name="attendedMemberIds" value={member.id} defaultChecked={completionData.attendedMemberIds.includes(member.id)} className="rounded"/>
                                <span className="ml-2 text-sm text-slate-700">{member.name}</span>
                            </label>))}
                        </div></div>
                        <div className="p-3 bg-slate-100 rounded-md text-sm">
                            <p><strong>강사:</strong> {trainers.find(t=>t.id === completionData.trainerId)?.name}</p>
                            <p><strong>수업료 정산:</strong> {program.unitPrice.toLocaleString()}원 * {(completionData.trainerRate * 100).toFixed(0)}% = {completionData.trainerFee.toLocaleString()}원</p>
                        </div>
                        {currentUser?.role === 'admin' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700">수업료 (관리자 전용)</label>
                                <input 
                                    type="number" 
                                    name="sessionFee" 
                                    defaultValue={completionData.sessionFee || completionData.trainerFee}
                                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"
                                    placeholder="수업료를 입력하세요"
                                />
                                <p className="text-xs text-slate-500 mt-1">기본값: {completionData.trainerFee.toLocaleString()}원</p>
                            </div>
                        )}
                    </div>
                    <div className="mt-6 flex justify-between">
                         <div className="flex gap-2">
                            <button type="button" onClick={() => { setSessionToEdit(completionData); setBookingData({programId: completionData.programId, sessionNumber: completionData.sessionNumber}); handleCloseCompletionModal(); setBookingModalOpen(true); }} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 text-sm">예약 수정</button>
                            {currentUser?.role === 'admin' && completionData.status === SessionStatus.Completed && (
                                <button type="button" onClick={() => handleRevertSession(completionData)} className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm">완료 취소</button>
                            )}
                         </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={handleCloseCompletionModal} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">취소</button>
                          {completionData.status !== SessionStatus.Completed && (
                              <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"><CheckCircleIcon className="w-4 h-4" /> 완료 처리</button>
                          )}
                        </div>
                    </div>
                </form>
            </Modal>
        )
    })()}

      {tooltip && (
        <div
          className="absolute z-[100] px-3 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg shadow-sm pointer-events-none"
          style={{
            left: `${tooltip.rect.left + tooltip.rect.width / 2}px`,
            top: `${tooltip.rect.top}px`,
            transform: 'translateX(-50%) translateY(-100%) translateY(-8px)',
          }}
        >
          {tooltip.content}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900"></div>
        </div>
      )}
    </div>
    </DndContext>
  );
};

export default App;