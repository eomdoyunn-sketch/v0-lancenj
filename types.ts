
export interface Branch {
  id: string;
  name: string;
  createdAt?: string;
}

export type ProgramStatus = '유효' | '정지' | '만료';

export type ExerciseGoal = '체중 감량' | '근력 증가' | '체형 교정' | '재활 및 통증 완화' | '대회 준비' | '스트레스 해소' | '기초 체력 증진';
export type ExerciseExperience = '입문' | '초급' | '중급' | '고급';
export type PreferredTime = '오전' | '오후' | '저녁' | '주말';
export type MemberStatus = '활성' | '휴면 예상' | '비활성';

export interface Member {
  id: string;
  name: string;
  contact: string;
  branchId: string;
  referrerId?: string;
  exerciseGoals?: ExerciseGoal[];
  motivation?: string;
  medicalHistory?: string;
  exerciseExperience?: ExerciseExperience;
  preferredTime?: PreferredTime[];
  occupation?: string;
  memo?: string;
}

export interface MemberProgram {
  id: string;
  // In Supabase, this would be a join table: program_members (program_id, member_id)
  memberIds: string[];
  programName: string;
  registrationType: '신규' | '재등록';
  registrationDate: string; // YYYY-MM-DD
  paymentDate: string; // YYYY-MM-DD
  totalAmount: number;
  totalSessions: number;
  unitPrice: number;
  completedSessions: number;
  status: ProgramStatus;
  assignedTrainerId?: string;
  memo?: string;
  defaultSessionDuration?: number; // in minutes
  branchId: string;
}

export type RateType = 'percentage' | 'fixed';

export interface BranchRate {
  type: RateType;
  value: number;
}

export interface Trainer {
  id:string;
  name: string;
  // Key is branchId
  branchRates: { [branchId: string]: BranchRate };
  branchIds: string[];
  isActive: boolean;
  color: string;
  photoUrl?: string; // 강사 프로필 사진 URL
}

export enum SessionStatus {
  Booked = 'booked',
  Completed = 'completed',
}

export interface Session {
  id: string;
  programId: string;
  sessionNumber: number;
  trainerId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  duration: number; // in minutes
  status: SessionStatus;
  sessionFee?: number; // 수업료 (완료된 세션에만)
  completedAt?: string; // 완료 시간
  trainerFee: number;
  trainerRate: number; // The rate used for this session, e.g., 0.5. -1 indicates a fixed rate.
  attendedMemberIds: string[];
}

export interface ProgramPreset {
  id: string;
  name: string;
  totalAmount: number;
  totalSessions: number;
  // An undefined branchId signifies it's available for all branches
  branchId?: string | null;
}

export interface AuditLog {
  id: string;
  timestamp: string; // ISO string
  user: string;
  action: '생성' | '수정' | '삭제';
  entityType: '프로그램' | '강사' | '사용자' | '프리셋' | '지점';
  entityName: string;
  details: string;
  branchId?: string;
}


export type View = 'programs' | 'dashboard' | 'members' | 'logs' | 'management';

export type UserRole = 'unassigned' | 'trainer' | 'manager' | 'admin';

export interface User {
  id: string;
// FIX: Changed name and email to be nullable to match database schema.
  name: string | null;
  email: string | null;
  role: UserRole;
  assignedBranchIds?: string[];
  trainerProfileId?: string;
}