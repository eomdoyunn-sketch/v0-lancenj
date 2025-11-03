


import React, { useState, useEffect, useCallback } from 'react';
import { MemberProgram, Trainer, Session, SessionStatus, View, ProgramStatus, Member, ProgramPreset, ExerciseGoal, ExerciseExperience, PreferredTime, AuditLog, User, UserRole, Branch, RateType, BranchRate } from './types';
import { formatLocalYYYYMMDD } from './lib/utils';
import { ProgramTable } from './components/Calendar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { MemberManagement } from './components/MemberManagement';
import { LogManagement } from './components/LogManagement';
import { supabase } from './lib/supabaseClient';
import { ManagementView } from './components/Management';
import { Modal } from './components/Modal';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { CheckCircleIcon, DumbbellIcon } from './components/Icons';
import { TrainerDetailModal } from './components/TrainerDetailModal';
import { MemberDetailModal, HistoryItem } from './components/MemberDetailModal';
import { Auth } from './components/Auth';
import { AuthService } from './lib/authService';
import { DataManager } from './lib/dataService';
import { useFeatureFlagContext, useResponsiveFeatures } from './hooks/useFeatureFlag';
import { FeatureFlagDebug } from './components/FeatureFlag';
import { usePermissions } from './hooks/usePermissions';
import { PermissionGuard } from './components/PermissionGuard';

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
  registrationDate: formatLocalYYYYMMDD(new Date()),
  paymentDate: formatLocalYYYYMMDD(new Date()),
  totalAmount: '',
  totalSessions: '',
  status: '유효' as ProgramStatus,
  assignedTrainerId: '', // 하위 호환성을 위해 유지
  assignedTrainerIds: [] as string[], // 담당 강사 ID 배열 (여러 명 선택 가능)
  sessionTrainers: {} as { [sessionNumber: number]: string }, // 회차별 강사 선택
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
  // Feature Flag 시스템 초기화
  const { setUserContext, setDeviceContext, context } = useFeatureFlagContext();
  const { isResponsiveEnabled, areAllEnabled } = useResponsiveFeatures(context);
  
  // 권한 관리
  const permissions = usePermissions();
  
  const [programs, setPrograms] = useState<MemberProgram[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [programPresets, setProgramPresets] = useState<ProgramPreset[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [allBranches, setAllBranches] = useState<Branch[]>([]);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('programs');
  
  const [isLoading, setIsLoading] = useState(true);
  
  const [programFilter, setProgramFilter] = useState({status: '유효' as ProgramStatus, search: '', trainerId: '', branchId: ''});
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
  const [selectedTrainerSessions, setSelectedTrainerSessions] = useState<Session[]>([]);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);

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
        console.log('=== 데이터 로딩 시작 ===');
        console.log('현재 사용자:', currentUser);
        
        // Load all data from Supabase
        const [branchesData, allMembers, allTrainers, allPrograms, sessionsData, allPresets, allUsers, allLogs] = await Promise.all([
            DataManager.getBranches(),
            DataManager.getMembers(),
            DataManager.getTrainers(),
            DataManager.getPrograms(),
            DataManager.getSessions(),
            DataManager.getProgramPresets(),
            DataManager.getUsers(),
            DataManager.getAuditLogs()
        ]);

        console.log('=== 로드된 데이터 ===');
        console.log('지점 데이터:', branchesData);
        console.log('회원 데이터:', allMembers);
        console.log('강사 데이터:', allTrainers);
        console.log('프로그램 데이터:', allPrograms);
        console.log('세션 데이터:', sessionsData);
        console.log('프리셋 데이터:', allPresets);
        console.log('사용자 데이터:', allUsers);
        console.log('로그 데이터:', allLogs);

        // 모든 지점 데이터를 상태로 설정
        setAllBranches(branchesData);
        setAllSessions(sessionsData);
        
        // 디버깅을 위해 전역 변수로 노출
        (window as any).sessions = sessionsData;
        (window as any).allSessions = sessionsData;
        

        if (currentUser.role === 'manager' && currentUser.assignedBranchIds && currentUser.assignedBranchIds.length > 0) {
            const managerBranches = currentUser.assignedBranchIds;

            // Only show branches that the manager is assigned to
            const filteredBranches = branchesData.filter(b => managerBranches.includes(b.id));
            setBranches(filteredBranches);

            // Filter other data by manager's branches
            const filteredMembers = allMembers.filter(m => m.branchId && managerBranches.includes(m.branchId));
            const filteredPrograms = allPrograms.filter(p => managerBranches.includes(p.branchId));
            const filteredSessions = sessionsData.filter(s => {
                const program = allPrograms.find(p => p.id === s.programId);
                return program && managerBranches.includes(program.branchId);
            });
            const filteredPresets = allPresets.filter(p => p.branchId && managerBranches.includes(p.branchId));
            const filteredLogs = allLogs.filter(l => l.branchId && managerBranches.includes(l.branchId));

            console.log('=== 매니저 필터링된 데이터 ===');
            console.log('필터링된 회원:', filteredMembers);
            console.log('필터링된 프로그램:', filteredPrograms);
            console.log('필터링된 세션:', filteredSessions);
            
            setMembers(filteredMembers);
            setPrograms(filteredPrograms);
            setSessions(filteredSessions);
            setProgramPresets(filteredPresets);
            setAuditLogs(filteredLogs);
        } else if (currentUser.role === 'trainer' && currentUser.trainerProfileId) {
            // Trainer sees only their own data
            const trainerProfile = allTrainers.find(t => t.id === currentUser.trainerProfileId);
            if (trainerProfile) {
                const trainerBranches = trainerProfile.branchIds;

                // Only show branches that the trainer is assigned to
                const filteredBranches = branchesData.filter(b => trainerBranches.includes(b.id));
                setBranches(filteredBranches);

                // Show all trainers in the same branch (for schedule view)
                const filteredTrainers = allTrainers.filter(t => 
                    t.isActive && t.branchIds.some(branchId => trainerBranches.includes(branchId))
                );
                setTrainers(filteredTrainers);
                console.log('App.tsx - 지점 전체 강사들:', filteredTrainers.map(t => ({ name: t.name, color: t.color, id: t.id })));

                // Filter programs by trainer assignment (assignedTrainerIds 배열 확인)
                const filteredPrograms = allPrograms.filter(p => {
                    const trainerIds = p.assignedTrainerIds || (p.assignedTrainerId ? [p.assignedTrainerId] : []);
                    return trainerIds.includes(currentUser.trainerProfileId || '');
                });

                // Filter members by assigned trainer (only members assigned to this trainer)
                const filteredMembers = allMembers.filter(m => 
                    m.assignedTrainerId === currentUser.trainerProfileId
                );

                // Filter sessions: own sessions + sessions from programs where this trainer is assigned
                // (여러 강사가 담당한 프로그램의 세션도 함께 볼 수 있어야 함)
                const trainerProgramIds = filteredPrograms.map(p => p.id);
                const filteredSessions = sessionsData.filter(s => 
                    s.trainerId === currentUser.trainerProfileId || 
                    trainerProgramIds.includes(s.programId)
                );
                console.log('App.tsx - 본인 세션들:', filteredSessions.length);

                // Filter presets by trainer's branches
                const filteredPresets = allPresets.filter(p => 
                    p.branchId && trainerBranches.includes(p.branchId)
                );

                // Filter logs by trainer's programs
                const programIds = filteredPrograms.map(p => p.id);
                const filteredLogs = allLogs.filter(l => 
                    l.branchId && trainerBranches.includes(l.branchId)
                );

                console.log('=== 트레이너 필터링된 데이터 ===');
                console.log('필터링된 회원:', filteredMembers);
                console.log('필터링된 프로그램:', filteredPrograms);
                console.log('필터링된 세션:', filteredSessions);
                
                setMembers(filteredMembers);
                setPrograms(filteredPrograms);
                setSessions(filteredSessions);
                setProgramPresets(filteredPresets);
                setAuditLogs(filteredLogs);
            }
        } else {
            // Admin sees all data
            console.log('=== 관리자 - 모든 데이터 사용 ===');
            console.log('전체 회원:', allMembers);
            console.log('전체 프로그램:', allPrograms);
            console.log('전체 세션:', sessionsData);
            
            setBranches(branchesData);
            setMembers(allMembers);
            setPrograms(allPrograms);
            setSessions(sessionsData);
            setProgramPresets(allPresets);
            setAuditLogs(allLogs);
        }

        // Filter trainers by role
        if (currentUser.role === 'manager' && currentUser.assignedBranchIds && currentUser.assignedBranchIds.length > 0) {
            const managerBranches = currentUser.assignedBranchIds;
            const filteredTrainersForManager = allTrainers.filter(t => t.branchIds.some(branchId => managerBranches.includes(branchId)));
            setTrainers(filteredTrainersForManager);
        } else if (currentUser.role === 'trainer' && currentUser.trainerProfileId) {
            // Trainer sees only their own profile and other trainers in their branches
            const trainerProfile = allTrainers.find(t => t.id === currentUser.trainerProfileId);
            if (trainerProfile) {
                const trainerBranches = trainerProfile.branchIds;
                const filteredTrainersForTrainer = allTrainers.filter(t => 
                    t.id === currentUser.trainerProfileId || 
                    t.branchIds.some(branchId => trainerBranches.includes(branchId))
                );
                setTrainers(filteredTrainersForTrainer);
            }
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
    // Initialize auth service (비동기로 변경)
    const initializeAuth = async () => {
      try {
        console.log('AuthService 초기화 시작...');
        await AuthService.initialize();
        console.log('AuthService 초기화 완료');
      } catch (error) {
        console.error('AuthService 초기화 실패:', error);
      }
    };
    
    // Load branches data even before login (needed for signup form)
    const loadBranches = async () => {
      try {
        console.log('지점 데이터 로딩 시작...');
        const allBranchesData = await DataManager.getBranches();
        console.log('지점 데이터 로딩 성공:', allBranchesData);
        setAllBranches(allBranchesData);
        setBranches(allBranchesData);
        console.log('지점 데이터 상태 설정 완료');
      } catch (error) {
        console.error('지점 데이터 로딩 실패:', error);
        // 오류 발생 시 기본 지점 데이터 사용
        const fallbackBranches = [
          { id: 'branch-1', name: '강남점', created_at: new Date().toISOString() },
          { id: 'branch-2', name: '홍대점', created_at: new Date().toISOString() },
          { id: 'branch-3', name: '건대점', created_at: new Date().toISOString() }
        ];
        console.log('기본 지점 데이터 사용:', fallbackBranches);
        setAllBranches(fallbackBranches);
        setBranches(fallbackBranches);
      }
    };
    
    // AuthService의 세션 상태 변화 콜백 설정
    AuthService.setAuthStateChangeCallback((user) => {
      console.log('Auth state changed in App:', user);
      setCurrentUser(user);
    });
    
    // 초기화 완료
    const initializeApp = async () => {
      try {
        console.log('앱 초기화 시작...');
        
        // AuthService 초기화 (세션 복원 포함)
        await initializeAuth();
        
        // 지점 데이터 로딩
        await loadBranches();
        console.log('지점 데이터 로딩 완료');
        
        // 초기 사용자 상태 확인 (AuthService 초기화 후)
        const initialUser = AuthService.getCurrentUser();
        console.log('초기 사용자:', initialUser);
        if (initialUser) {
          setCurrentUser(initialUser);
        }
        console.log('앱 초기화 완료');
      } catch (error) {
        console.error('앱 초기화 실패:', error);
      } finally {
        console.log('로딩 상태 해제');
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);


  useEffect(() => {
    if (currentUser) {
      fetchInitialData();
      
      // Set default branch filters for managers and trainers
      if (currentUser.role === 'manager' && currentUser.assignedBranchIds && currentUser.assignedBranchIds.length > 0) {
        const defaultBranch = currentUser.assignedBranchIds[0];
        setProgramFilter(prev => ({ ...prev, branchId: defaultBranch }));
        setMemberFilter(prev => ({ ...prev, branchId: defaultBranch }));
        setDashboardFilter(prev => ({ ...prev, branchId: defaultBranch }));
      } else if (currentUser.role === 'trainer' && currentUser.trainerProfileId) {
        // 트레이너의 경우 trainerProfile에서 지점 정보 가져오기
        const trainerProfile = trainers.find(t => t.id === currentUser.trainerProfileId);
        if (trainerProfile && trainerProfile.branchIds.length > 0) {
          const defaultBranch = trainerProfile.branchIds[0];
          setProgramFilter(prev => ({ ...prev, branchId: defaultBranch }));
          setMemberFilter(prev => ({ ...prev, branchId: defaultBranch }));
          setDashboardFilter(prev => ({ ...prev, branchId: defaultBranch }));
        }
      }

      
      // 모든 사용자가 기본 뷰에 접근할 수 있도록 허용
      // 권한 검증은 각 컴포넌트 내부에서 처리
      if (!currentView || currentView === '') {
        setCurrentView('programs');
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
    
    // 모든 사용자가 기본 뷰에 접근할 수 있도록 허용
    // 권한 검증은 각 컴포넌트 내부에서 처리
    setCurrentView(view);
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
    setAllBranches([]);
    setAllSessions([]);
    setIsLoading(false);
    
    // 로그아웃 후 지점 데이터 다시 로드
    const loadBranches = async () => {
      try {
        const allBranchesData = await DataManager.getBranches();
        setAllBranches(allBranchesData);
        setBranches(allBranchesData);
      } catch (error) {
        console.error('지점 데이터 로딩 실패:', error);
      }
    };
    loadBranches();
  };
  
  const handleOpenProgramModal = (program: MemberProgram | null) => {
    setProgramToEdit(program);
    if (program) {
        // 기존 데이터에서 assignedTrainerIds 추출 (하위 호환성: assignedTrainerId가 있으면 배열로 변환)
        const trainerIds = program.assignedTrainerIds || (program.assignedTrainerId ? [program.assignedTrainerId] : []);
        
        setProgramFormData({
            ...program,
            totalAmount: String(program.totalAmount),
            totalSessions: String(program.totalSessions),
            assignedTrainerId: program.assignedTrainerId || '', // 하위 호환성
            assignedTrainerIds: trainerIds,
            sessionTrainers: program.sessionTrainers || {},
            memo: program.memo || '',
            defaultSessionDuration: String(program.defaultSessionDuration || 50),
        });
    } else {
        const defaultBranchId = (currentUser?.role === 'manager' && currentUser.assignedBranchIds && currentUser.assignedBranchIds.length > 0) 
            ? currentUser.assignedBranchIds[0] 
            : (branches.length > 0 ? branches[0].id : '');
        
        // 트레이너의 경우 본인이 기본 담당 강사로 설정 (하지만 여러 명 선택 가능)
        const defaultTrainerId = (currentUser?.role === 'trainer' && currentUser.trainerProfileId) 
            ? currentUser.trainerProfileId 
            : '';
        
        setProgramFormData({
            ...initialProgramFormData,
            branchId: defaultBranchId,
            assignedTrainerId: defaultTrainerId, // 하위 호환성 (첫 번째 강사)
            assignedTrainerIds: defaultTrainerId ? [defaultTrainerId] : [], // 여러 명 선택 가능하지만 기본값은 본인만
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
        
        // 선택된 지점의 강사만 유지 (다른 지점의 강사는 제거)
        const selectedBranchId = value;
        if (selectedBranchId) {
            const validTrainerIds = trainers
                .filter(t => t.isActive && t.branchIds.includes(selectedBranchId))
                .map(t => t.id);
            
            // 선택된 강사 중에서 선택된 지점에 속한 강사만 유지
            newFormData.assignedTrainerIds = programFormData.assignedTrainerIds.filter(id => validTrainerIds.includes(id));
            newFormData.assignedTrainerId = newFormData.assignedTrainerIds.length > 0 ? newFormData.assignedTrainerIds[0] : '';
        } else {
            newFormData.assignedTrainerId = '';
            newFormData.assignedTrainerIds = [];
        }
        
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

      // 권한 체크: 기존 프로그램 수정 시
      if (programToEdit && currentUser?.role !== 'admin') {
        if (currentUser?.role === 'manager') {
          // 매니저인 경우, 프로그램이 자신의 지점에 속해있는지 확인
          if (!currentUser?.assignedBranchIds?.includes(programToEdit.branchId)) {
            alert('해당 지점의 프로그램만 수정할 수 있습니다.');
            return;
          }
        } else if (currentUser?.role === 'trainer') {
          // 트레이너인 경우, 본인이 담당하는 프로그램만 수정 가능 (assignedTrainerIds 배열 확인)
          const trainerIds = programToEdit.assignedTrainerIds || (programToEdit.assignedTrainerId ? [programToEdit.assignedTrainerId] : []);
          if (!trainerIds.includes(currentUser.trainerProfileId || '')) {
            alert('본인이 담당하는 프로그램만 수정할 수 있습니다.');
            return;
          }
        }
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
          assignedTrainerId: programFormData.assignedTrainerId || undefined, // 하위 호환성
          assignedTrainerIds: programFormData.assignedTrainerIds.length > 0 ? programFormData.assignedTrainerIds : undefined,
          sessionTrainers: programFormData.sessionTrainers, // 회차별 강사 정보
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
        // 담당 강사가 변경되었는지 확인
        const trainerChanged = programToEdit.assignedTrainerId !== programData.assignedTrainerId;
        const oldTrainerId = programToEdit.assignedTrainerId;
        const newTrainerId = programData.assignedTrainerId;
        
        result = await DataManager.updateProgram(programToEdit.id, programData);
        if (result) {
          setPrograms(programs.map(p => p.id === result.id ? result : p));
          
          // 담당 강사가 변경된 경우, 관련 세션들도 업데이트
          if (trainerChanged && newTrainerId) {
            console.log('담당 강사 변경됨:', oldTrainerId, '->', newTrainerId);
            
            // 해당 프로그램의 모든 세션을 찾아서 업데이트
            const programSessions = sessions.filter(s => s.programId === programToEdit.id);
            console.log('업데이트할 세션들:', programSessions.length);
            
            for (const session of programSessions) {
              // 완료되지 않은 세션만 새로운 강사에게 할당
              if (session.status !== 'completed') {
                console.log('세션 업데이트:', session.id, '새 강사:', newTrainerId);
                await DataManager.updateSession(session.id, { trainerId: newTrainerId });
              } else {
                console.log('완료된 세션 유지:', session.id, '기존 강사:', session.trainerId);
              }
            }
            
            // 세션 목록 새로고침
            await fetchInitialData();
          }
          
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
    if (!programToDelete) return;

    // 권한 체크: admin이거나 해당 지점의 매니저인지 확인
    if (currentUser?.role !== 'admin') {
      // 매니저인 경우, 프로그램이 자신의 지점에 속해있는지 확인
      if (!currentUser?.assignedBranchIds?.includes(programToDelete.branchId)) {
        alert('해당 지점의 프로그램만 삭제할 수 있습니다.');
        return;
      }
    }

    if (window.confirm(`${programToDelete.programName} 프로그램을 삭제하시겠습니까?`)) {
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
    
    // 매니저와 트레이너의 경우 소속 지점을 기본값으로 설정
    const defaultData: Partial<Member> = member || {};
    if (!member && currentUser?.role === 'manager' && currentUser.assignedBranchIds && currentUser.assignedBranchIds.length > 0) {
      defaultData.branchId = currentUser.assignedBranchIds[0];
    } else if (!member && currentUser?.role === 'trainer' && currentUser.trainerProfileId) {
      // 트레이너의 경우 trainerProfile에서 지점 정보 가져오기
      const trainerProfile = trainers.find(t => t.id === currentUser.trainerProfileId);
      if (trainerProfile && trainerProfile.branchIds.length > 0) {
        defaultData.branchId = trainerProfile.branchIds[0];
        defaultData.assignedTrainerId = currentUser.trainerProfileId; // 담당 강사를 본인으로 설정
        console.log('트레이너 회원 추가 - 기본값 설정:', defaultData);
        console.log('currentUser.trainerProfileId:', currentUser.trainerProfileId);
      }
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
    console.log('=== 회원 저장 시작 ===');
    console.log('memberData:', memberData);
    console.log('memberToEdit:', memberToEdit);
    console.log('currentUser:', currentUser);
    console.log('memberData.assignedTrainerId:', memberData.assignedTrainerId);
    console.log('memberData.assignedTrainerId 타입:', typeof memberData.assignedTrainerId);
    
    // 트레이너의 경우 assignedTrainerId가 없으면 강제로 설정
    if (!memberToEdit && currentUser?.role === 'trainer' && currentUser.trainerProfileId && !memberData.assignedTrainerId) {
      memberData.assignedTrainerId = currentUser.trainerProfileId;
      console.log('트레이너 assignedTrainerId 강제 설정:', memberData.assignedTrainerId);
    }
    
    // 권한 체크: 기존 회원 수정 시
    if (memberToEdit && currentUser?.role !== 'admin') {
      // 매니저인 경우, 회원이 자신의 지점에 속해있는지 확인
      if (!currentUser?.assignedBranchIds?.includes(memberToEdit.branchId)) {
        alert('해당 지점의 회원만 수정할 수 있습니다.');
        return;
      }
    }

    try {
      if (memberToEdit) {
        console.log('기존 회원 수정 중...');
        const updatedMember = await DataManager.updateMember(memberToEdit.id, memberData);
        console.log('수정 결과:', updatedMember);
        if (updatedMember) {
          setMembers(members.map(m => m.id === updatedMember.id ? updatedMember : m));
          await addAuditLog('수정', '사용자', updatedMember.name, `회원 정보를 수정했습니다.`, updatedMember.branchId);
        }
      } else {
        console.log('신규 회원 생성 중...');
        const newMember = await DataManager.createMember(memberData);
        console.log('생성 결과:', newMember);
        if (newMember) {
          // 회원 목록을 다시 불러와서 최신 데이터로 업데이트
          await fetchInitialData();
          await addAuditLog('생성', '사용자', newMember.name, `신규 회원을 등록했습니다.`, newMember.branchId);
          console.log('회원 목록 업데이트 완료');
        } else {
          console.error('회원 생성 실패');
        }
      }
    } catch (error) {
      console.error('회원 저장 중 오류:', error);
    }
    
    handleCloseMemberModal();
    console.log('=== 회원 저장 완료 ===');
  };

  const handleDeleteMember = async (memberId: string) => {
    const memberToDelete = members.find(m => m.id === memberId);
    if (!memberToDelete) return;

    // 권한 체크: admin이거나 해당 지점의 매니저인지 확인
    if (currentUser?.role !== 'admin') {
      // 매니저인 경우, 회원이 자신의 지점에 속해있는지 확인
      if (!currentUser?.assignedBranchIds?.includes(memberToDelete.branchId)) {
        alert('해당 지점의 회원만 삭제할 수 있습니다.');
        return;
      }
    }

    if (window.confirm(`${memberToDelete.name} 회원을 삭제하시겠습니까? 모든 관련 프로그램이 함께 삭제됩니다.`)) {
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
    setTrainerModalOpen(true);
    const initialState: TrainerFormState = {
        id: trainer?.id,
        name: trainer?.name || '',
        isActive: trainer?.isActive ?? true,
        color: trainer?.color || availableColors[0],
        photoUrl: trainer?.photoUrl || '',
        branches: {},
    };

    branches.forEach(branch => {
        let isSelected = false;
        
        if (trainer) {
            // 기존 강사 수정 시: 기존 선택된 지점들
            isSelected = trainer.branchIds.includes(branch.id);
        } else {
            // 신규 강사 등록 시: 매니저의 경우 자신의 지점 자동 선택
            if (currentUser?.role === 'manager' && currentUser.assignedBranchIds?.includes(branch.id)) {
                isSelected = true;
            }
        }
        
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
      
      // 강사가 본인 정보를 수정할 때 지점 선택 변경 방지
      if (currentUser?.role === 'trainer' && trainerToEdit?.id === currentUser.trainerProfileId && field === 'selected') {
          console.log('강사는 본인의 지점을 변경할 수 없습니다.');
          return;
      }
      
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

  // 강사 수업료 변경 시 관련 세션들의 수업료를 즉시 업데이트하는 함수
  const updateSessionsWithNewTrainerRates = async (trainerId: string, updatedTrainer: Trainer) => {
    try {
      console.log('강사 수업료 변경으로 인한 세션 업데이트 시작:', trainerId);
      console.log('업데이트된 강사 정보:', updatedTrainer);
      
      // 해당 강사와 관련된 모든 세션 찾기
      const relatedSessions = sessions.filter(session => session.trainerId === trainerId);
      console.log('관련 세션 수:', relatedSessions.length);
      
      for (const session of relatedSessions) {
        const program = programs.find(p => p.id === session.programId);
        if (!program) {
          console.log(`프로그램을 찾을 수 없음: ${session.programId}`);
          continue;
        }
        
        // 프로그램의 지점 ID 찾기
        const programBranchId = program.branchId;
        const trainerBranchRate = updatedTrainer.branchRates[programBranchId];
        
        console.log(`세션 ${session.id} - 프로그램 지점: ${programBranchId}, 강사 지점 요율:`, trainerBranchRate);
        
        if (!trainerBranchRate) {
          console.log(`강사가 해당 지점에 배정되지 않음: ${programBranchId}`);
          continue;
        }
        
        // 새로운 수업료 계산
        let newTrainerFee: number;
        let newTrainerRate: number;
        
        if (trainerBranchRate.type === 'percentage') {
          newTrainerFee = program.unitPrice * trainerBranchRate.value;
          newTrainerRate = trainerBranchRate.value;
        } else {
          newTrainerFee = trainerBranchRate.value;
          newTrainerRate = -1; // 고정 금액
        }
        
        console.log(`세션 ${session.id} 수업료 계산:`, {
          기존: { trainerFee: session.trainerFee, trainerRate: session.trainerRate },
          새로운: { trainerFee: newTrainerFee, trainerRate: newTrainerRate },
          프로그램단가: program.unitPrice,
          강사요율: trainerBranchRate
        });
        
        // 세션의 수업료가 변경된 경우에만 업데이트
        if (Math.abs(session.trainerFee - newTrainerFee) > 0.01 || session.trainerRate !== newTrainerRate) {
          console.log(`세션 ${session.id} 수업료 업데이트: ${session.trainerFee} -> ${newTrainerFee}, rate: ${session.trainerRate} -> ${newTrainerRate}`);
          
          const updatedSession = await DataManager.updateSession(session.id, {
            trainerFee: newTrainerFee,
            trainerRate: newTrainerRate
          });
          
          if (updatedSession) {
            setSessions(prevSessions => 
              prevSessions.map(s => s.id === updatedSession.id ? updatedSession : s)
            );
            console.log(`세션 ${session.id} 업데이트 완료:`, updatedSession);
          } else {
            console.error(`세션 ${session.id} 업데이트 실패`);
          }
        } else {
          console.log(`세션 ${session.id}는 변경사항 없음`);
        }
      }
      
      console.log('세션 수업료 업데이트 완료');
    } catch (error) {
      console.error('세션 수업료 업데이트 중 오류:', error);
    }
  };

  const handleSaveTrainer = async () => {
    if (!trainerFormState) return;

    // 권한 체크: 기존 강사 수정 시
    if (trainerToEdit && currentUser?.role !== 'admin') {
      // 트레이너인 경우, 본인 정보만 수정 가능
      if (currentUser?.role === 'trainer' && currentUser.trainerProfileId) {
        if (trainerToEdit.id !== currentUser.trainerProfileId) {
          alert('본인 정보만 수정할 수 있습니다.');
          return;
        }
      } else if (currentUser?.role === 'manager') {
        // 매니저인 경우, 강사가 자신의 지점에 속해있는지 확인
        const hasPermission = trainerToEdit.branchIds.some(branchId => 
          currentUser?.assignedBranchIds?.includes(branchId)
        );
        
        if (!hasPermission) {
          alert('해당 지점의 강사만 수정할 수 있습니다.');
          return;
        }
      }
    }

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
          
          // 강사가 본인 정보를 수정한 경우 currentUser도 업데이트
          if (currentUser?.role === 'trainer' && currentUser.trainerProfileId === trainerToEdit.id) {
            setCurrentUser({
              ...currentUser,
              assignedBranchIds: updatedTrainer.branchIds
            });
            console.log('강사 지점 정보 업데이트:', updatedTrainer.branchIds);
          }
          
          // 강사 수업료 변경 시 관련 세션들의 수업료 즉시 업데이트
          await updateSessionsWithNewTrainerRates(trainerToEdit.id, updatedTrainer);
          
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
    if (!trainerToDelete) return;

    // 권한 체크: admin이거나 해당 지점의 매니저인지 확인
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'unassigned') {
      // 매니저인 경우, 강사가 자신의 지점에 속해있는지 확인
      const hasPermission = trainerToDelete.branchIds.some(branchId => 
        currentUser?.assignedBranchIds?.includes(branchId)
      );
      
      if (!hasPermission) {
        console.log('권한 체크 실패:', {
          currentUser: currentUser,
          trainerToDelete: trainerToDelete,
          hasPermission: hasPermission
        });
        alert('해당 지점의 강사만 삭제할 수 있습니다.');
        return;
      }
    }

    // 해당 강사가 배정된 프로그램이 있는지 확인 (assignedTrainerIds 배열 포함)
    const assignedPrograms = programs.filter(p => {
      const trainerIds = p.assignedTrainerIds || (p.assignedTrainerId ? [p.assignedTrainerId] : []);
      return trainerIds.includes(trainerId);
    });
    
    if (assignedPrograms.length > 0) {
      const programNames = assignedPrograms.map(p => p.programName).join(', ');
      if (!window.confirm(`${trainerToDelete.name} 강사는 ${programNames} 프로그램에 배정되어 있습니다.\n강사를 삭제하면 해당 프로그램들의 담당 강사 목록에서 제거됩니다.\n정말 삭제하시겠습니까?`)) {
        return;
      }
    }

    if (window.confirm(`${trainerToDelete.name} 강사를 삭제하시겠습니까?`)) {
        const success = await DataManager.deleteTrainer(trainerId);
        if (success) {
          setTrainers(trainers.filter(t => t.id !== trainerId));
          // 관련 프로그램들의 담당 강사 목록에서 제거
          if (assignedPrograms.length > 0) {
            for (const program of assignedPrograms) {
              const trainerIds = program.assignedTrainerIds || (program.assignedTrainerId ? [program.assignedTrainerId] : []);
              const updatedTrainerIds = trainerIds.filter(id => id !== trainerId);
              const newFirstTrainerId = updatedTrainerIds.length > 0 ? updatedTrainerIds[0] : undefined;
              
              await DataManager.updateProgram(program.id, { 
                assignedTrainerIds: updatedTrainerIds.length > 0 ? updatedTrainerIds : undefined,
                assignedTrainerId: newFirstTrainerId // 하위 호환성
              });
            }
            setPrograms(programs.map(p => {
              const trainerIds = p.assignedTrainerIds || (p.assignedTrainerId ? [p.assignedTrainerId] : []);
              if (trainerIds.includes(trainerId)) {
                const updatedTrainerIds = trainerIds.filter(id => id !== trainerId);
                return { 
                  ...p, 
                  assignedTrainerIds: updatedTrainerIds.length > 0 ? updatedTrainerIds : undefined,
                  assignedTrainerId: updatedTrainerIds.length > 0 ? updatedTrainerIds[0] : undefined
                };
              }
              return p;
            }));
          }
          await addAuditLog('삭제', '강사', trainerToDelete.name, '강사 정보를 삭제했습니다.', trainerToDelete.branchIds[0]);
          // 데이터 새로고침
          fetchInitialData();
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

  // 특정 사용자들의 지점을 업데이트하는 함수
  const handleUpdateUsersBranch = async (userNames: string[], branchId: string) => {
    try {
      const branch = branches.find(b => b.id === branchId);
      if (!branch) {
        alert('지점을 찾을 수 없습니다.');
        return;
      }

      const usersToUpdate = users.filter(user => userNames.includes(user.name));
      if (usersToUpdate.length === 0) {
        alert('해당 이름의 사용자를 찾을 수 없습니다.');
        return;
      }

      for (const user of usersToUpdate) {
        const updates: Partial<User> = {
          assignedBranchIds: [branchId]
        };
        
        const updatedUser = await handleUpdateUserPermissions(user.id, updates);
        if (updatedUser) {
          await addAuditLog('수정', '사용자', user.name, `${user.name} 사용자를 ${branch.name} 지점으로 배정했습니다.`, branchId);
        }
      }

      alert(`${userNames.join(', ')} 사용자들을 ${branch.name} 지점으로 배정했습니다.`);
    } catch (error) {
      console.error('사용자 지점 업데이트 중 오류:', error);
      alert('사용자 지점 업데이트 중 오류가 발생했습니다.');
    }
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

  const handleUpdateUserRole = async (userId: string, newRole: UserRole, branchId?: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const updates: Partial<User> = {
      role: newRole
    };

    // 트레이너로 변경 시 자동으로 첫 번째 지점에 배정
    if (newRole === 'trainer' && branchId) {
      // 트레이너 프로필 생성 또는 기존 프로필 연결
      const existingTrainer = trainers.find(t => t.name === user.name);
      if (existingTrainer) {
        updates.trainerProfileId = existingTrainer.id;
      } else {
        // 새 트레이너 프로필 생성
        const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)].replace('bg-', '');
        
        const newTrainer = await DataManager.createTrainer({
          name: user.name || 'Unknown',
          branchIds: [branchId],
          branchRates: { [branchId]: { type: 'percentage' as RateType, value: 0 } },
          color: randomColor,
          isActive: true
        });
        
        if (newTrainer) {
          updates.trainerProfileId = newTrainer.id;
          setTrainers(prev => [...prev, newTrainer]);
        }
      }
    } else if (newRole === 'manager' && branchId) {
      updates.assignedBranchIds = [branchId];
      updates.trainerProfileId = null; // 매니저로 변경 시 트레이너 프로필 제거
    } else if (newRole === 'unassigned') {
      updates.assignedBranchIds = [];
      updates.trainerProfileId = null;
    }

    const updatedUser = await handleUpdateUserPermissions(userId, updates);
    if (updatedUser) {
      const roleNames = {
        admin: '관리자',
        manager: '매니저',
        trainer: '트레이너',
        unassigned: '미배정'
      };
      
      const logDetails = `${updatedUser.name} 사용자의 역할을 ${roleNames[newRole]}로 변경했습니다.`;
      await addAuditLog('수정', '사용자', updatedUser.name, logDetails);
    }
  };
    
  const handleSessionClick = (programId: string, sessionNumber: number, session: Session | null) => {
    if (session) {
      // 기존 세션을 클릭한 경우 sessionToEdit 설정
      setSessionToEdit(session);
      
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
    setSessionToEdit(session);
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

    if (sessionToEdit) {
      // 기존 세션 수정 시
      const fullSessionData = { 
        ...sessionData,
        trainerRate: trainerRateForDb, 
        trainerFee: trainerFee, 
        status: sessionToEdit.status // 기존 상태 유지
      };
      
      const updatedSession = await DataManager.updateSession(sessionToEdit.id, fullSessionData);
      if (updatedSession) {
        // 로컬 상태 즉시 업데이트
        setSessions(sessions.map(s => s.id === sessionToEdit.id ? updatedSession : s));
        setAllSessions(allSessions.map(s => s.id === sessionToEdit.id ? updatedSession : s));
        
        console.log('세션 수정 완료:', sessionToEdit.id);
        
        // 백그라운드에서 데이터 새로고침
        fetchInitialData().catch(error => {
          console.error('백그라운드 데이터 새로고침 실패:', error);
        });
      }
    } else {
      // 새 세션 생성 시 - 각 참석 회원별로 개별 세션 생성
      const attendedMemberIds = sessionData.attendedMemberIds;
      const newSessions = [];
      
      for (const memberId of attendedMemberIds) {
        const memberSessionData = {
          ...sessionData,
          attendedMemberIds: [memberId], // 각 회원별로 개별 세션
          trainerRate: trainerRateForDb, 
          trainerFee: trainerFee, 
          status: SessionStatus.Booked
        };
        
        const newSession = await DataManager.createSession(memberSessionData);
        if (newSession) {
          newSessions.push(newSession);
        } else {
          console.error(`Failed to create session for member ${memberId}`);
        }
      }
      
      // 로컬 상태 즉시 업데이트
      if (newSessions.length > 0) {
        setSessions([...sessions, ...newSessions]);
        setAllSessions([...allSessions, ...newSessions]);
        console.log('새 세션 생성 완료:', newSessions.length, '개');
      }
      
      // 백그라운드에서 데이터 새로고침
      fetchInitialData().catch(error => {
        console.error('백그라운드 데이터 새로고침 실패:', error);
      });
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
        // 로컬 상태 즉시 업데이트
        setSessions(sessions.map(s => s.id === sessionToRevert.id ? updatedSession : s));
        setAllSessions(allSessions.map(s => s.id === sessionToRevert.id ? updatedSession : s));
        
        await addAuditLog('수정', '프로그램', `세션 ${sessionToRevert.sessionNumber}회차`, `'${sessionToRevert.date} ${sessionToRevert.startTime}' 수업 완료를 취소했습니다.`);
        
        console.log('세션 완료 취소 완료:', sessionToRevert.id);
      } else {
        alert('세션 완료 취소에 실패했습니다.');
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
        // 데이터 새로고침
        await fetchInitialData();
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
  
  // 수업 시간이 지났는지 확인하는 함수
  const isSessionTimePassed = (session: Session): boolean => {
    const now = new Date();
    const sessionDateTime = new Date(`${session.date}T${session.startTime}`);
    return now >= sessionDateTime;
  };

  const handleCompleteSession = async (sessionToComplete: Session, attendedMemberIds: string[], sessionFee?: number) => {
    try {
      console.log('수업 완료 처리 시작:', { 
        sessionId: sessionToComplete.id, 
        sessionNumber: sessionToComplete.sessionNumber,
        attendedMemberIds, 
        sessionFee,
        currentStatus: sessionToComplete.status,
        currentTrainerFee: sessionToComplete.trainerFee
      });

      // Supabase 연결 테스트
      console.log('Supabase 연결 테스트 시작...');
      try {
        const { data: testData, error: testError } = await supabase
          .from('sessions')
          .select('id')
          .limit(1);
        
        if (testError) {
          console.error('Supabase 연결 오류:', testError);
          alert(`데이터베이스 연결 오류: ${testError.message}`);
          return;
        }
        console.log('Supabase 연결 정상:', testData);
      } catch (connectionError) {
        console.error('Supabase 연결 실패:', connectionError);
        alert(`데이터베이스 연결 실패: ${connectionError.message}`);
        return;
      }
      
      const program = programs.find(p => p.id === sessionToComplete.programId);
      if (!program) {
        console.error('프로그램을 찾을 수 없습니다:', sessionToComplete.programId);
        alert('프로그램을 찾을 수 없습니다.');
        return;
      }

      console.log('찾은 프로그램:', program);

      // 수업 시간이 지나지 않았으면 완료 처리 불가
      if (!isSessionTimePassed(sessionToComplete)) {
        console.log('수업 시간이 지나지 않음:', sessionToComplete.date, sessionToComplete.startTime);
        alert('수업 예약 시간이 지나지 않아 완료 처리할 수 없습니다.');
        return;
      }

      const updatedSessionData = { 
        status: SessionStatus.Completed, 
        attendedMemberIds: attendedMemberIds,
        completedAt: new Date().toISOString(),
        // sessionFee는 데이터베이스에 컬럼이 없으므로 제거
        trainerFee: sessionToComplete.trainerFee  // 강사 수업료는 기존 값 유지
      };
      
      console.log('세션 업데이트 데이터:', updatedSessionData);
      console.log('DataManager.updateSession 호출 전');
      
      const updatedSession = await DataManager.updateSession(sessionToComplete.id, updatedSessionData);
      console.log('세션 업데이트 결과:', updatedSession);
      
      if (!updatedSession) {
        console.error('세션 업데이트 실패 - DataManager.updateSession이 null을 반환했습니다.');
        alert('수업 완료 처리에 실패했습니다.');
        return;
      }
      
      const wasAlreadyCompleted = sessionToComplete.status === SessionStatus.Completed;
      console.log('이미 완료된 세션인가?', wasAlreadyCompleted);
      
      console.log('세션 상태 업데이트 완료');
      console.log('업데이트된 세션:', updatedSession);

      let updatedProgram: MemberProgram | null = null;
      if (!wasAlreadyCompleted) {
          console.log('프로그램 완료 세션 수 업데이트 시작');
          const newCompletedCount = sessions.filter(s => s.programId === program.id && s.status === SessionStatus.Completed).length + 1;
          const programUpdates = {
              completedSessions: newCompletedCount,
              status: newCompletedCount >= program.totalSessions ? '만료' as ProgramStatus : program.status,
          };
          console.log('프로그램 업데이트 데이터:', programUpdates);
          
          updatedProgram = await DataManager.updateProgram(program.id, programUpdates);
          console.log('프로그램 업데이트 결과:', updatedProgram);
          
          if (!updatedProgram) {
            console.error('프로그램 업데이트 실패');
          }
      }
      
      // 로컬 상태 즉시 업데이트
      setSessions(sessions.map(s => s.id === sessionToComplete.id ? updatedSession : s));
      setAllSessions(allSessions.map(s => s.id === sessionToComplete.id ? updatedSession : s));
      
      // 프로그램 상태도 즉시 업데이트
      if (!wasAlreadyCompleted && updatedProgram) {
        setPrograms(programs.map(p => p.id === program.id ? updatedProgram : p));
      }
      
      // 감사 로그 추가
      console.log('감사 로그 추가 시작');
      await addAuditLog('수정', '프로그램', `세션 ${sessionToComplete.sessionNumber}회차`, `'${sessionToComplete.date} ${sessionToComplete.startTime}' 수업을 완료 처리했습니다.`);
      console.log('감사 로그 추가 완료');
      
      alert('수업이 성공적으로 완료 처리되었습니다.');
      handleCloseCompletionModal();
      
      // 백그라운드에서 데이터 새로고침 (사용자 경험 개선)
      console.log('백그라운드 데이터 새로고침 시작...');
      fetchInitialData().then(() => {
        console.log('백그라운드 데이터 새로고침 완료');
      }).catch(error => {
        console.error('백그라운드 데이터 새로고침 실패:', error);
      });
    } catch (error) {
      console.error('수업 완료 처리 중 오류:', error);
      console.error('오류 스택:', error.stack);
      alert(`수업 완료 처리 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    const sessionToDelete = sessions.find(s => s.id === sessionId);
    if (!sessionToDelete) return;

    if (window.confirm(`'${sessionToDelete.date} ${sessionToDelete.startTime}' 수업을 삭제하시겠습니까?`)) {
      const success = await DataManager.deleteSession(sessionId);
      if (success) {
        // 로컬 상태 즉시 업데이트
        setSessions(sessions.filter(s => s.id !== sessionId));
        setAllSessions(allSessions.filter(s => s.id !== sessionId));
        
        // 감사 로그 추가
        await addAuditLog('삭제', '프로그램', `세션 ${sessionToDelete.sessionNumber}회차`, `'${sessionToDelete.date} ${sessionToDelete.startTime}' 수업을 삭제했습니다.`);
        
        // 모달 닫기
        handleCloseBookingModal();
        handleCloseCompletionModal();
        setSessionToEdit(null);
        
        console.log('세션 삭제 완료:', sessionId);
      } else {
        alert('세션 삭제에 실패했습니다.');
      }
    }
  };

  const handleRestoreTrainer = async (trainerId: string) => {
    const trainerToRestore = trainers.find(t => t.id === trainerId);
    if (!trainerToRestore) return;

    if (window.confirm(`${trainerToRestore.name} 강사를 복원하시겠습니까?`)) {
      const success = await DataManager.restoreTrainer(trainerId);
      if (success) {
        setTrainers(trainers.map(t => t.id === trainerId ? { ...t, isActive: true } : t));
        await addAuditLog('수정', '강사', trainerToRestore.name, `강사 정보를 복원했습니다.`, trainerToRestore.branchIds[0]);
        alert('강사가 성공적으로 복원되었습니다.');
        // 데이터 새로고침
        fetchInitialData();
      } else {
        alert('강사 복원에 실패했습니다.');
      }
    }
  };

  const handleUpdateTrainerBranches = async (trainerId: string, newBranchIds: string[]) => {
    const trainer = trainers.find(t => t.id === trainerId);
    if (!trainer) return;

    try {
      const success = await DataManager.updateTrainer(trainerId, { branchIds: newBranchIds });
      if (success) {
        setTrainers(trainers.map(t => t.id === trainerId ? { ...t, branchIds: newBranchIds } : t));
        await addAuditLog('수정', '강사', trainer.name, `강사 소속 지점을 변경했습니다.`, newBranchIds[0] || trainer.branchIds[0]);
        alert('강사 소속 지점이 성공적으로 변경되었습니다.');
        // 데이터 새로고침
        fetchInitialData();
      } else {
        alert('강사 소속 지점 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('강사 소속 지점 변경 중 오류:', error);
      alert('강사 소속 지점 변경 중 오류가 발생했습니다.');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    console.log('드래그 이벤트 발생:', { activeId: active.id, overId: over?.id });
    
    if (!over) {
      console.log('드롭 대상이 없음');
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();
    
    console.log('드래그 처리 시작:', { activeId, overId });

    // Case 4: Dragging a trainer from program to trainer list (unassign) - 먼저 처리
    console.log('Case 4 체크:', { 
        startsWithProgram: activeId.startsWith('program-'), 
        includesTrainer: activeId.includes('-trainer-'),
        activeId,
        overId 
    });
    
    if (activeId.startsWith('program-') && activeId.includes('-trainer-')) {
        console.log('=== 프로그램에서 강사 드래그 감지 ===');
        console.log('activeId:', activeId);
        console.log('overId:', overId);
        
        // ID 패턴: program-{programId}-trainer-{trainerId}
        // 더 간단한 방법으로 파싱
        const programTrainerMatch = activeId.match(/^program-(.+)-trainer-(.+)$/);
        
        if (programTrainerMatch) {
            const programId = programTrainerMatch[1];
            const trainerId = programTrainerMatch[2];
            
            console.log('정규식 파싱 결과:', { programId, trainerId });
            
            const draggedTrainer = trainers.find(t => t.id === trainerId);
            const targetProgram = programs.find(p => p.id === programId);
            
            console.log('찾은 객체들:', { 
                draggedTrainer: draggedTrainer ? { id: draggedTrainer.id, name: draggedTrainer.name } : '없음', 
                targetProgram: targetProgram ? { id: targetProgram.id, name: targetProgram.programName } : '없음',
                overId,
                isActiveDroppable: overId === 'active-droppable',
                isInactiveDroppable: overId === 'inactive-droppable'
            });
            
            if (draggedTrainer && targetProgram && (overId === 'active-droppable' || overId === 'inactive-droppable')) {
                console.log('=== 강사 해제 실행 시작 ===');
                console.log('프로그램:', targetProgram.programName);
                console.log('강사:', draggedTrainer.name);
                console.log('현재 assignedTrainerId:', targetProgram.assignedTrainerId);
                
                try {
                    // 해당 프로그램에서 강사를 해제
                    console.log('DataManager.updateProgram 호출 중...');
                    // 프로그램에서 강사 제거 (assignedTrainerIds 배열에서 제거)
                    const currentTrainerIds = targetProgram.assignedTrainerIds || (targetProgram.assignedTrainerId ? [targetProgram.assignedTrainerId] : []);
                    const updatedTrainerIds = currentTrainerIds.filter(id => id !== draggedTrainer.id);
                    const newFirstTrainerId = updatedTrainerIds.length > 0 ? updatedTrainerIds[0] : null;
                    
                    const updatedProgram = await DataManager.updateProgram(targetProgram.id, { 
                      assignedTrainerIds: updatedTrainerIds.length > 0 ? updatedTrainerIds : undefined,
                      assignedTrainerId: newFirstTrainerId // 하위 호환성
                    });
                    console.log('DataManager.updateProgram 결과:', updatedProgram);
                    
                    if (updatedProgram) {
                      console.log('상태 업데이트 중...');
                      setPrograms(programs.map(p => p.id === updatedProgram.id ? updatedProgram : p));
                      console.log('상태 업데이트 완료');
                      
                      console.log('감사 로그 추가 중...');
                      await addAuditLog('수정', '프로그램', updatedProgram.programName, `${updatedProgram.programName}에서 ${draggedTrainer.name} 강사를 해제했습니다.`, updatedProgram.branchId);
                      console.log('감사 로그 추가 완료');
                      
                      console.log('=== 강사 해제 완료 ===');
                    } else {
                      console.error('강사 해제 실패: DataManager.updateProgram이 null 반환');
                    }
                } catch (error) {
                    console.error('강사 해제 중 오류:', error);
                }
            } else {
                console.log('조건 불일치로 해제하지 않음');
                console.log('조건 체크:', {
                    hasDraggedTrainer: !!draggedTrainer,
                    hasTargetProgram: !!targetProgram,
                    isCorrectOverId: overId === 'active-droppable' || overId === 'inactive-droppable'
                });
            }
        } else {
            console.log('정규식 매칭 실패:', activeId);
        }
        return; // 이 케이스가 처리되었으므로 다른 로직 실행하지 않음
    }

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

    // Case 3: Dragging a trainer from sidebar onto a program row
    const trainer = trainers.find(t => t.id === activeId);
    const program = programs.find(p => p.id === overId);

    if (trainer && program) {
        // 강사를 프로그램에 배정
        if (!trainer.isActive) {
            alert('비활성 상태의 강사는 배정할 수 없습니다.');
            return;
        }
        // 프로그램에 강사 추가 (assignedTrainerIds 배열에 추가)
        const currentTrainerIds = program.assignedTrainerIds || (program.assignedTrainerId ? [program.assignedTrainerId] : []);
        const updatedTrainerIds = currentTrainerIds.includes(trainer.id) 
          ? currentTrainerIds 
          : [...currentTrainerIds, trainer.id];
        
        const updatedProgram = await DataManager.updateProgram(program.id, { 
          assignedTrainerIds: updatedTrainerIds,
          assignedTrainerId: updatedTrainerIds[0] // 하위 호환성
        });
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
    // 로그인하지 않은 상태에서는 모든 지점을 표시
    // 지점 데이터가 로드될 때까지 기다림
    if (allBranches.length === 0) {
      return (
        <div className="h-screen w-screen flex flex-col justify-center items-center bg-slate-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">지점 정보를 불러오는 중...</p>
          </div>
        </div>
      );
    }
    
    return <Auth allBranches={allBranches} onLogin={handleLogin} />;
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
    
    const matches = (
      p.status === programFilter.status &&
      (programFilter.search === '' || p.programName.toLowerCase().includes(searchLower) || memberName.includes(searchLower)) &&
      (programFilter.trainerId === '' || 
        p.assignedTrainerId === programFilter.trainerId || 
        (p.assignedTrainerIds && p.assignedTrainerIds.includes(programFilter.trainerId))) &&
      (programFilter.branchId === '' || p.branchId === programFilter.branchId)
    );
    
    return matches;
  });

  console.log('=== 프로그램 필터링 결과 ===');
  console.log('원본 프로그램 수:', programs.length);
  console.log('필터링된 프로그램 수:', filteredPrograms.length);
  console.log('현재 필터:', programFilter);
  console.log('필터링된 프로그램들:', filteredPrograms);
  
  const filteredMembers = members.filter(m => memberFilter.branchId === '' || m.branchId === memberFilter.branchId);
  
  const filteredTrainersForDisplay = trainers.filter(t => {
    // 매니저의 경우 소속 지점의 강사만 표시
    if (currentUser?.role === 'manager' && currentUser.assignedBranchIds) {
      return t.branchIds.some(branchId => currentUser.assignedBranchIds!.includes(branchId));
    }
    // 트레이너의 경우 본인만 표시
    if (currentUser?.role === 'trainer' && currentUser.trainerProfileId) {
      return t.id === currentUser.trainerProfileId;
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
    <div className="h-screen flex flex-col overflow-hidden">
      <Header currentView={currentView} setCurrentView={setViewWithPermissions} currentUser={currentUser} branches={branches} onLogout={handleLogout} onOpenSettings={() => setSettingsModalOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex overflow-hidden">
          {currentView === 'programs' && <ProgramTable programs={filteredPrograms} members={members} sessions={sessions} allSessions={allSessions} trainers={trainers} onAddProgram={() => handleOpenProgramModal(null)} onEditProgram={handleOpenProgramModal} onReRegisterProgram={(p) => handleOpenProgramModal({...p, id: ``, registrationType: '재등록', completedSessions: 0, status: '유효'})} onDeleteProgram={handleDeleteProgram} onSessionClick={handleSessionClick} filter={programFilter} setFilter={handleSetProgramFilter} allBranches={branches} onShowTooltip={(content, rect) => setTooltip({ content, rect })} onHideTooltip={() => setTooltip(null)} currentUser={currentUser} />}
          {currentView === 'dashboard' && <Dashboard trainers={filteredTrainersForDisplay} sessions={sessions} allSessions={allSessions} programs={programs} members={members} startDate={filterStartDate} endDate={filterEndDate} setStartDate={setFilterStartDate} setEndDate={setFilterEndDate} onTrainerClick={(trainerId) => { 
            const t = trainers.find(t=>t.id===trainerId); 
            if(t) {
              // 해당 강사의 모든 완료된 세션을 전달 (모달에서 독립적으로 필터링)
              const trainerSessions = sessions.filter(s => s.trainerId === trainerId && s.status === 'completed');
              setSelectedTrainerSessions(trainerSessions);
              setSelectedTrainerForDetail(t); 
              setTrainerDetailModalOpen(true);
            }
          }} onSessionEventClick={handleCalendarSessionClick} allBranches={branches} filter={dashboardFilter} setFilter={setDashboardFilter} currentUser={currentUser} />}
          {/* FIX: Changed setFilter to setMemberFilter to pass the correct state updater function. */}
          {currentView === 'members' && <MemberManagement members={filteredMembers} programs={programs} sessions={sessions} onAddMember={() => handleOpenMemberModal(null)} onEditMember={handleOpenMemberModal} onDeleteMember={handleDeleteMember} onMemberClick={handleMemberClick} allBranches={branches} filter={memberFilter} setFilter={setMemberFilter} currentUser={currentUser} />}
          {currentView === 'logs' && <LogManagement logs={auditLogs} branches={branches} currentUser={currentUser} />}
          {currentView === 'management' && <ManagementView currentUser={currentUser} users={users} trainers={trainers} allBranches={branches} presets={programPresets} onAddUser={(context) => handleOpenUserModal(null, context)} onDeleteUser={handleDeleteUser} onUpdateManagerBranches={handleUpdateManagerBranches} onUpdateUserRole={handleUpdateUserRole} onUpdateUsersBranch={handleUpdateUsersBranch} onAddPreset={() => handleOpenPresetModal(null)} onEditPreset={handleOpenPresetModal} onDeletePreset={handleDeletePreset} onAddBranch={() => handleOpenBranchModal(null)} onEditBranch={handleOpenBranchModal} onDeleteBranch={handleDeleteBranch} onAddTrainer={() => handleOpenTrainerModal(null)} onEditTrainer={handleOpenTrainerModal} onDeleteTrainer={handleDeleteTrainer} onRestoreTrainer={handleRestoreTrainer} onUpdateTrainerBranches={handleUpdateTrainerBranches} />}
        </main>
      </div>
      
       {isTrainerDetailModalOpen && (
        <TrainerDetailModal
          isOpen={isTrainerDetailModalOpen}
          onClose={() => setTrainerDetailModalOpen(false)}
          trainer={selectedTrainerForDetail}
          sessions={selectedTrainerSessions}
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
          allSessions={allSessions}
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
              <label className="block text-sm font-medium text-slate-700">회원 선택 (여러 명 선택 가능)</label>
              <div className="mt-2 space-y-2 max-h-32 overflow-y-auto border border-slate-300 rounded-md p-2">
                {members.filter(member => {
                  // 지점 필터링: 선택된 지점의 회원만 표시
                  if (programFormData.branchId && member.branchId !== programFormData.branchId) {
                    return false;
                  }
                  
                  // 트레이너의 경우 본인이 담당하는 회원만 표시
                  if (currentUser?.role === 'trainer' && currentUser.trainerProfileId) {
                    return member.assignedTrainerId === currentUser.trainerProfileId;
                  }
                  
                  // 프로그램에서 담당 강사가 선택된 경우, 선택된 강사 중 하나라도 해당 강사의 회원인 경우 표시
                  if (programFormData.assignedTrainerIds.length > 0) {
                    return programFormData.assignedTrainerIds.includes(member.assignedTrainerId || '');
                  }
                  
                  // 하위 호환성: assignedTrainerId가 있으면 해당 강사의 회원만 표시
                  if (programFormData.assignedTrainerId) {
                    return member.assignedTrainerId === programFormData.assignedTrainerId;
                  }
                  
                  // 관리자/매니저는 선택된 지점의 모든 회원 표시 (지점이 선택된 경우)
                  return true;
                }).map(member => (
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

            {/* 회차별 강사 및 수업료 설정 */}
            {Number(programFormData.totalSessions) > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700">회차별 강사 및 수업료 설정</label>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  {Array.from({ length: Number(programFormData.totalSessions) }, (_, i) => i + 1).map(sessionNum => (
                    <div key={sessionNum} className="border border-slate-200 rounded-lg p-3">
                      <label className="block text-sm font-medium text-slate-700 mb-2">{sessionNum}회차</label>
                      
                      {/* 강사 선택 */}
                      <div className="mb-2">
                        <label className="block text-xs text-slate-600 mb-1">담당 강사</label>
                        <select
                          value={programFormData.sessionTrainers?.[sessionNum] || ''}
                          onChange={(e) => {
                            const trainerId = e.target.value;
                            setProgramFormData(prev => ({
                              ...prev,
                              sessionTrainers: {
                                ...prev.sessionTrainers,
                                [sessionNum]: trainerId
                              }
                            }));
                          }}
                          className="w-full px-2 py-1 text-sm border border-slate-300 rounded-md shadow-sm"
                        >
                          <option value="">강사 선택</option>
                          {filteredTrainersForModal.map(trainer => (
                            <option key={trainer.id} value={trainer.id}>{trainer.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      {/* 수업료 입력 */}
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">수업료 (원)</label>
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
                          placeholder="수업료 입력"
                          className="w-full px-2 py-1 text-sm border border-slate-300 rounded-md shadow-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  각 회차별로 담당 강사와 수업료를 설정할 수 있습니다. 
                  강사가 선택되지 않은 회차는 기본 담당 강사가 담당합니다.
                </p>
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

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">담당 강사 (여러 명 선택 가능)</label>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border border-slate-300 rounded-md p-2">
                  {filteredTrainersForModal.map(trainer => (
                    <label key={trainer.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={programFormData.assignedTrainerIds.includes(trainer.id)}
                        onChange={(e) => {
                          const trainerId = trainer.id;
                          setProgramFormData(prev => {
                            const newTrainerIds = prev.assignedTrainerIds.includes(trainerId)
                              ? prev.assignedTrainerIds.filter(id => id !== trainerId)
                              : [...prev.assignedTrainerIds, trainerId];
                            
                            // 하위 호환성: 첫 번째 강사를 assignedTrainerId에 저장
                            const firstTrainerId = newTrainerIds.length > 0 ? newTrainerIds[0] : '';
                            
                            return { 
                              ...prev,
                              assignedTrainerIds: newTrainerIds,
                              assignedTrainerId: firstTrainerId,
                            };
                          });
                        }}
                        className="mr-2"
                      />
                      <span>{trainer.name}</span>
                    </label>
                  ))}
                  {filteredTrainersForModal.length === 0 && (
                    <p className="text-sm text-slate-500">선택 가능한 강사가 없습니다. 지점을 먼저 선택해주세요.</p>
                  )}
                </div>
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
              <div>
                <label className="block text-sm font-medium text-slate-700">상태</label>
                <select
                  value={programFormData.status}
                  onChange={(e) => setProgramFormData(prev => ({ ...prev, status: e.target.value as ProgramStatus }))}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"
                >
                  <option value="유효">유효</option>
                  <option value="정지">정지</option>
                  <option value="만료">만료</option>
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
                    {/* 관리자만 모든 지점 옵션 표시 */}
                    {currentUser?.role === 'admin' && <option value="">모든 지점</option>}
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
                {currentUser?.role !== 'trainer' && (
                    <div><label className="block text-sm font-medium text-slate-700">담당 강사</label>
                        <select name="assignedTrainerId" value={memberFormData.assignedTrainerId || ''} onChange={(e) => setMemberFormData({...memberFormData, assignedTrainerId: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm">
                            <option value="">담당 강사를 선택하세요</option>
                            {trainers.filter(t => t.isActive).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                )}
                {currentUser?.role === 'trainer' && (
                    <div><label className="block text-sm font-medium text-slate-700">담당 강사</label>
                        <div className="mt-1 block w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-md text-slate-600">
                            {trainers.find(t => t.id === currentUser.trainerProfileId)?.name || '본인'}
                        </div>
                    </div>
                )}
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
                    {currentUser?.role === 'trainer' && trainerToEdit?.id === currentUser.trainerProfileId && (
                      <p className="mt-1 text-xs text-slate-500">강사는 본인의 지점을 변경할 수 없습니다.</p>
                    )}
                    <div className="mt-2 space-y-3 p-3 border rounded-md max-h-48 overflow-y-auto">
                        {branches.map(branch => {
                            const branchState = trainerFormState.branches[branch.id];
                            return (<div key={branch.id} className="flex items-center gap-4 justify-between">
                                <label className="flex items-center space-x-3 text-sm flex-1">
                                    <input type="checkbox" name="branchIds" value={branch.id} 
                                      checked={branchState.selected} 
                                      onChange={(e) => handleTrainerBranchChange(branch.id, 'selected', e.target.checked)}
                                      disabled={currentUser?.role === 'trainer' && trainerToEdit?.id === currentUser.trainerProfileId}
                                      className={`rounded h-4 w-4 text-blue-600 focus:ring-blue-500 ${
                                        currentUser?.role === 'trainer' && trainerToEdit?.id === currentUser.trainerProfileId 
                                          ? 'opacity-50 cursor-not-allowed' 
                                          : ''
                                      }`}/>
                                    <span className={currentUser?.role === 'trainer' && trainerToEdit?.id === currentUser.trainerProfileId ? 'text-slate-500' : ''}>
                                      {branch.name}
                                      {currentUser?.role === 'trainer' && trainerToEdit?.id === currentUser.trainerProfileId && branchState.selected && (
                                        <span className="ml-2 text-xs text-slate-400">(고정)</span>
                                      )}
                                    </span>
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
                            <div><label className="block text-sm font-medium text-slate-700">날짜</label><input type="date" name="date" defaultValue={sessionToEdit?.date || formatLocalYYYYMMDD(new Date())} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/></div>
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
                        {!isSessionTimePassed(completionData) && (
                            <div className="p-3 bg-yellow-100 border border-yellow-300 rounded-md">
                                <p className="text-yellow-800 text-sm">
                                    <strong>주의:</strong> 수업 예약 시간이 아직 지나지 않았습니다. 
                                    수업이 시작된 후에만 완료 처리할 수 있습니다.
                                </p>
                            </div>
                        )}
                        <div><label className="block text-sm font-medium text-slate-700">참석 확인</label><div className="mt-2 space-y-1">
                            {programMembers.map(member => (<label key={member.id} className="flex items-center">
                                <input type="checkbox" name="attendedMemberIds" value={member.id} defaultChecked={completionData.attendedMemberIds.includes(member.id)} className="rounded"/>
                                <span className="ml-2 text-sm text-slate-700">{member.name}</span>
                            </label>))}
                        </div></div>
                        <div className="p-3 bg-slate-100 rounded-md text-sm">
                            <p><strong>강사:</strong> {trainers.find(t=>t.id === completionData.trainerId)?.name}</p>
                            <p><strong>수업료 정산:</strong> {
                                completionData.trainerRate === -1 
                                    ? `고정 금액: ${completionData.trainerFee.toLocaleString()}원`
                                    : `${program.unitPrice.toLocaleString()}원 * ${(completionData.trainerRate * 100).toFixed(0)}% = ${completionData.trainerFee.toLocaleString()}원`
                            }</p>
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
                              <button 
                                type="submit" 
                                disabled={!isSessionTimePassed(completionData)}
                                className={`px-4 py-2 flex items-center gap-2 ${
                                  isSessionTimePassed(completionData) 
                                    ? 'bg-green-600 text-white hover:bg-green-700' 
                                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                } rounded-md`}
                                title={!isSessionTimePassed(completionData) ? '수업 예약 시간이 지나야 완료 처리할 수 있습니다.' : ''}
                              >
                                <CheckCircleIcon className="w-4 h-4" /> 완료 처리
                              </button>
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
      
      {/* 설정 모달 - 강사인 경우 강사 정보 수정 모달로 직접 연결 */}
      {isSettingsModalOpen && currentUser?.role === 'trainer' && currentUser.trainerProfileId && (
        (() => {
          const trainer = trainers.find(t => t.id === currentUser.trainerProfileId);
          if (trainer) {
            // 강사인 경우 설정 모달을 닫고 강사 정보 수정 모달을 직접 열기
            setSettingsModalOpen(false);
            handleOpenTrainerModal(trainer);
            return null;
          }
          return null;
        })()
      )}

      {/* 설정 모달 - 관리자/매니저인 경우에만 표시 */}
      {isSettingsModalOpen && currentUser?.role !== 'trainer' && (
        <Modal isOpen={isSettingsModalOpen} onClose={() => setSettingsModalOpen(false)} title="설정">
          <div className="space-y-6">
            {/* 사용자 정보 */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-slate-800 mb-3">사용자 정보</h3>
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-slate-600">이름</label>
                  <p className="text-lg font-semibold text-slate-800">{currentUser?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">역할</label>
                  <p className="text-sm text-slate-700">
                    {currentUser?.role === 'admin' ? '관리자' : 
                     currentUser?.role === 'manager' ? '매니저' : 
                     currentUser?.role === 'trainer' ? '강사' : '사용자'}
                  </p>
                </div>
                {currentUser?.assignedBranchIds && currentUser.assignedBranchIds.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-slate-600">소속 지점</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {currentUser.assignedBranchIds.map(branchId => {
                        const branch = branches.find(b => b.id === branchId);
                        return branch ? (
                          <span key={branchId} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {branch.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 강사 프로필 설정 (강사인 경우) */}
            {currentUser?.role === 'trainer' && currentUser.trainerProfileId && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-800 mb-3">강사 프로필 설정</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600">강사명</label>
                    <p className="text-lg font-semibold text-slate-800">
                      {trainers.find(t => t.id === currentUser.trainerProfileId)?.name}
                    </p>
                  </div>
                  
                  {/* 프로필 이미지 */}
                  <div>
                    <label className="text-sm font-medium text-slate-600">프로필 이미지</label>
                    <div className="mt-2 flex items-center gap-4">
                      {trainers.find(t => t.id === currentUser.trainerProfileId)?.photoUrl ? (
                        <img 
                          src={trainers.find(t => t.id === currentUser.trainerProfileId)?.photoUrl} 
                          alt="프로필" 
                          className="w-16 h-16 rounded-full object-cover border-2 border-slate-300"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center">
                          <span className="text-slate-500 text-sm">이미지 없음</span>
                        </div>
                      )}
                      <div>
                        <button 
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/jpeg,image/png';
                            input.onchange = async (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) {
                                // 파일 크기 체크 (5MB)
                                if (file.size > 5 * 1024 * 1024) {
                                  alert('파일 크기는 5MB를 초과할 수 없습니다.');
                                  return;
                                }
                                
                                // 파일 업로드 로직 (실제 구현 필요)
                                console.log('이미지 업로드:', file.name);
                                alert('이미지 업로드 기능은 구현 중입니다.');
                              }
                            };
                            input.click();
                          }}
                          className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                        >
                          이미지 변경
                        </button>
                        <p className="text-xs text-slate-500 mt-1">JPG, PNG 파일만 업로드 가능 (최대 5MB)</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-600">강사 색상</label>
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-3">
                        <div 
                          className="w-8 h-8 rounded-full border-2 border-slate-300" 
                          style={{ backgroundColor: trainers.find(t => t.id === currentUser.trainerProfileId)?.color }}
                        ></div>
                        <span className="text-sm text-slate-600">
                          {trainers.find(t => t.id === currentUser.trainerProfileId)?.color}
                        </span>
                      </div>
                      
                      {/* 색상 선택 그리드 */}
                      <div className="grid grid-cols-10 gap-2">
                        {availableColors.map(color => {
                          const isUsed = trainers.some(t => t.id !== currentUser.trainerProfileId && t.color === color);
                          const isSelected = trainers.find(t => t.id === currentUser.trainerProfileId)?.color === color;
                          
                          return (
                            <button
                              key={color}
                              type="button"
                              onClick={async () => {
                                if (isUsed) {
                                  alert('이미 사용 중인 색상입니다.');
                                  return;
                                }
                                
                                const trainer = trainers.find(t => t.id === currentUser.trainerProfileId);
                                if (trainer) {
                                  const success = await DataManager.updateTrainer(trainer.id, { color });
                                  if (success) {
                                    const updatedTrainer = { ...trainer, color };
                                    setTrainers(trainers.map(t => t.id === trainer.id ? updatedTrainer : t));
                                    
                                    // 강사 정보 업데이트 시 currentUser도 동기화
                                    if (currentUser?.role === 'trainer' && currentUser.trainerProfileId === trainer.id) {
                                      setCurrentUser({
                                        ...currentUser,
                                        assignedBranchIds: updatedTrainer.branchIds
                                      });
                                    }
                                    
                                    alert('색상이 변경되었습니다.');
                                  } else {
                                    alert('색상 변경에 실패했습니다.');
                                  }
                                }
                              }}
                              disabled={isUsed}
                              className={`w-8 h-8 rounded-full ${color} relative ring-2 ring-offset-2 transition-all ${
                                isSelected ? 'ring-blue-500' : 
                                isUsed ? 'ring-red-300 opacity-50 cursor-not-allowed' : 
                                'ring-transparent hover:ring-gray-300'
                              }`}
                              title={isUsed ? '이미 사용 중인 색상입니다' : ''}
                            >
                              {isSelected && <CheckCircleIcon className="w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" />}
                              {isUsed && <div className="absolute inset-0 bg-black bg-opacity-30 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">×</span>
                              </div>}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-slate-500 mt-2">사용 중인 색상은 선택할 수 없습니다.</p>
                    </div>
                  </div>
                  
                  {/* 소속 지점 및 수업료 */}
                  <div>
                    <label className="text-sm font-medium text-slate-600">소속 지점 및 수업료</label>
                    <div className="mt-2 space-y-3">
                      {branches.map(branch => {
                        const trainer = trainers.find(t => t.id === currentUser.trainerProfileId);
                        const isAssigned = trainer?.branchIds.includes(branch.id);
                        const branchRate = trainer?.branchRates[branch.id];
                        
                        if (!isAssigned) return null;
                        
                        return (
                          <div key={branch.id} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="font-medium text-slate-800">{branch.name}</span>
                                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">소속 지점</span>
                              </div>
                            </div>
                            
                            {/* 수업료 설정 */}
                            <div className="mt-3">
                              <label className="block text-sm font-medium text-slate-600 mb-2">수업료 설정</label>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="radio" 
                                    name={`rateType_${branch.id}`}
                                    value="percentage"
                                    checked={branchRate?.type === 'percentage'}
                                    onChange={async (e) => {
                                      if (e.target.checked) {
                                        const newRate = { type: 'percentage', value: 0.5 }; // 기본 50%
                                        const success = await DataManager.updateTrainer(trainer.id, {
                                          branchRates: { ...trainer.branchRates, [branch.id]: newRate }
                                        });
                                        if (success) {
                                          setTrainers(trainers.map(t => t.id === trainer.id ? {
                                            ...t,
                                            branchRates: { ...t.branchRates, [branch.id]: newRate }
                                          } : t));
                                        }
                                      }
                                    }}
                                    className="w-4 h-4 text-blue-600"
                                  />
                                  <span className="text-sm text-slate-600">비율 (%)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="radio" 
                                    name={`rateType_${branch.id}`}
                                    value="fixed"
                                    checked={branchRate?.type === 'fixed'}
                                    onChange={async (e) => {
                                      if (e.target.checked) {
                                        const newRate = { type: 'fixed', value: 25000 }; // 기본 25,000원
                                        const success = await DataManager.updateTrainer(trainer.id, {
                                          branchRates: { ...trainer.branchRates, [branch.id]: newRate }
                                        });
                                        if (success) {
                                          setTrainers(trainers.map(t => t.id === trainer.id ? {
                                            ...t,
                                            branchRates: { ...t.branchRates, [branch.id]: newRate }
                                          } : t));
                                        }
                                      }
                                    }}
                                    className="w-4 h-4 text-blue-600"
                                  />
                                  <span className="text-sm text-slate-600">고정금액 (원)</span>
                                </div>
                              </div>
                              
                              {/* 수업료 값 입력 */}
                              <div className="mt-2">
                                <input 
                                  type="number" 
                                  value={branchRate?.type === 'percentage' ? branchRate.value * 100 : branchRate?.value || 0}
                                  onChange={async (e) => {
                                    const value = Number(e.target.value);
                                    if (branchRate?.type === 'percentage') {
                                      const newRate = { type: 'percentage', value: value / 100 };
                                      const success = await DataManager.updateTrainer(trainer.id, {
                                        branchRates: { ...trainer.branchRates, [branch.id]: newRate }
                                      });
                                      if (success) {
                                        const updatedTrainer = {
                                          ...trainer,
                                          branchRates: { ...trainer.branchRates, [branch.id]: newRate }
                                        };
                                        setTrainers(trainers.map(t => t.id === trainer.id ? updatedTrainer : t));
                                        
                                        // 강사 정보 업데이트 시 currentUser도 동기화
                                        if (currentUser?.role === 'trainer' && currentUser.trainerProfileId === trainer.id) {
                                          setCurrentUser({
                                            ...currentUser,
                                            assignedBranchIds: updatedTrainer.branchIds
                                          });
                                        }
                                      }
                                    } else {
                                      const newRate = { type: 'fixed', value: value };
                                      const success = await DataManager.updateTrainer(trainer.id, {
                                        branchRates: { ...trainer.branchRates, [branch.id]: newRate }
                                      });
                                      if (success) {
                                        const updatedTrainer = {
                                          ...trainer,
                                          branchRates: { ...trainer.branchRates, [branch.id]: newRate }
                                        };
                                        setTrainers(trainers.map(t => t.id === trainer.id ? updatedTrainer : t));
                                        
                                        // 강사 정보 업데이트 시 currentUser도 동기화
                                        if (currentUser?.role === 'trainer' && currentUser.trainerProfileId === trainer.id) {
                                          setCurrentUser({
                                            ...currentUser,
                                            assignedBranchIds: updatedTrainer.branchIds
                                          });
                                        }
                                      }
                                    }
                                  }}
                                  min="0"
                                  className="w-32 px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <span className="ml-2 text-sm text-slate-600">
                                  {branchRate?.type === 'percentage' ? '%' : '원'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-600">상태</label>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      trainers.find(t => t.id === currentUser.trainerProfileId)?.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {trainers.find(t => t.id === currentUser.trainerProfileId)?.isActive ? '활성' : '비활성'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 액션 버튼들 */}
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setSettingsModalOpen(false);
                  // 강사인 경우 강사 전용 모달 열기
                  if (currentUser?.role === 'trainer' && currentUser.trainerProfileId) {
                    const trainer = trainers.find(t => t.id === currentUser.trainerProfileId);
                    if (trainer) {
                      handleOpenTrainerModal(trainer);
                    }
                  } else {
                    handleOpenUserModal(currentUser);
                  }
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                프로필 수정
              </button>
              <button 
                onClick={() => setSettingsModalOpen(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Feature Flag Debug (개발 환경에서만 표시) */}
      <FeatureFlagDebug context={context} />
    </div>
    </DndContext>
  );
};

export default App;