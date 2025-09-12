import { supabase } from './supabaseClient';
import { 
  Branch, 
  Member, 
  Trainer, 
  MemberProgram, 
  Session, 
  ProgramPreset, 
  AuditLog, 
  User,
  SessionStatus,
  ProgramStatus
} from '../types';

export class DataManager {
  // Generate unique ID (Supabase는 자동으로 UUID 생성)
  private static generateId(): string {
    return crypto.randomUUID();
  }

  // ==================== BRANCHES ====================
  static async getBranches(): Promise<Branch[]> {
    try {
      console.log('DataManager.getBranches() 시작');
      console.log('Supabase 클라이언트:', supabase);
      
      console.log('Supabase REST API 호출 시작...');
      
      // 직접 fetch API를 사용하여 Supabase REST API 호출
      const response = await fetch('https://eurpkgbmeziosjqkhmqv.supabase.co/rest/v1/branches?select=*', {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1cnBrZ2JtZXppb3NqcWtobXF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxODMwODEsImV4cCI6MjA3Mjc1OTA4MX0.0TX158-7MPgkKfhEasIs39cyfWhVGTbsRnLjhEp_ORQ',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1cnBrZ2JtZXppb3NqcWtobXF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxODMwODEsImV4cCI6MjA3Mjc1OTA4MX0.0TX158-7MPgkKfhEasIs39cyfWhVGTbsRnLjhEp_ORQ',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Fetch 응답 상태:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetch로 가져온 데이터:', data);
      
      const error = null; // fetch API는 성공 시 error가 없음

      console.log('Supabase 쿼리 결과:', { data, error });

      if (error) {
        console.error('지점 조회 실패:', error);
        return [];
      }

      console.log('지점 데이터 반환:', data);
      return data;
    } catch (error) {
      console.error('지점 조회 중 오류:', error);
      // 오류 발생 시 기본 지점 데이터 반환
      const fallbackData = [
        { id: '2cbc08d0-3a1c-47fc-91c0-bf63e417c651', name: '한남동', created_at: new Date().toISOString() },
        { id: '9b93efa9-4a80-4748-aaeb-5ee26dd8a6f0', name: '장교동', created_at: new Date().toISOString() },
        { id: 'a24192ca-6d7c-4b81-aca7-4f20f71389c5', name: '소공동', created_at: new Date().toISOString() }
      ];
      console.log('오류로 인한 기본 지점 데이터 반환:', fallbackData);
      return fallbackData;
    }
  }

  static async createBranch(data: Omit<Branch, 'id'>): Promise<Branch | null> {
    try {
      const { data: newBranch, error } = await supabase
        .from('branches')
        .insert({
          name: data.name,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('지점 생성 실패:', error);
        return null;
      }

    return newBranch;
    } catch (error) {
      console.error('지점 생성 중 오류:', error);
      return null;
    }
  }

  static async updateBranch(id: string, updates: Partial<Branch>): Promise<Branch | null> {
    try {
      const { data, error } = await supabase
        .from('branches')
        .update({
          name: updates.name
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('지점 업데이트 실패:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('지점 업데이트 중 오류:', error);
      return null;
    }
  }

  static async deleteBranch(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('branches')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('지점 삭제 실패:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('지점 삭제 중 오류:', error);
      return false;
    }
  }

  // ==================== MEMBERS ====================
  static async getMembers(): Promise<Member[]> {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('회원 조회 실패:', error);
        return [];
      }

      return data?.map(member => ({
        id: member.id,
        name: member.name,
        contact: member.contact,
        branchId: member.branch_id,
        referrerId: member.referrer_id,
        assignedTrainerId: member.assigned_trainer_id,
        exerciseGoals: member.exercise_goals,
        motivation: member.motivation,
        medicalHistory: member.medical_history,
        exerciseExperience: member.exercise_experience,
        preferredTime: member.preferred_time,
        occupation: member.occupation,
        memo: member.memo,
        createdAt: member.created_at
      })) || [];
    } catch (error) {
      console.error('회원 조회 중 오류:', error);
      return [];
    }
  }

  static async createMember(memberData: Omit<Member, 'id'>): Promise<Member | null> {
    try {
      console.log('=== DataService.createMember 시작 ===');
      console.log('받은 memberData:', memberData);
      console.log('assignedTrainerId 값:', memberData.assignedTrainerId);
      console.log('assignedTrainerId 타입:', typeof memberData.assignedTrainerId);
      
      const insertData = {
        name: memberData.name,
        contact: memberData.contact,
        branch_id: memberData.branchId,
        referrer_id: memberData.referrerId,
        assigned_trainer_id: memberData.assignedTrainerId,
        exercise_goals: memberData.exerciseGoals,
        motivation: memberData.motivation,
        medical_history: memberData.medicalHistory,
        exercise_experience: memberData.exerciseExperience,
        preferred_time: memberData.preferredTime,
        occupation: memberData.occupation,
        memo: memberData.memo,
        created_at: new Date().toISOString()
      };
      
      console.log('Supabase에 전송할 데이터:', insertData);
      
      const { data: newMember, error } = await supabase
        .from('members')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('회원 생성 실패:', error);
        return null;
      }

      return {
        id: newMember.id,
        name: newMember.name,
        contact: newMember.contact,
        branchId: newMember.branch_id,
        referrerId: newMember.referrer_id,
        assignedTrainerId: newMember.assigned_trainer_id,
        exerciseGoals: newMember.exercise_goals,
        motivation: newMember.motivation,
        medicalHistory: newMember.medical_history,
        exerciseExperience: newMember.exercise_experience,
        preferredTime: newMember.preferred_time,
        occupation: newMember.occupation,
        memo: newMember.memo,
        createdAt: newMember.created_at
      };
    } catch (error) {
      console.error('회원 생성 중 오류:', error);
      return null;
    }
  }

  static async updateMember(memberId: string, updates: Partial<Member>): Promise<Member | null> {
    try {
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.contact !== undefined) updateData.contact = updates.contact;
      if (updates.branchId !== undefined) updateData.branch_id = updates.branchId;
      if (updates.referrerId !== undefined) updateData.referrer_id = updates.referrerId;
      if (updates.assignedTrainerId !== undefined) updateData.assigned_trainer_id = updates.assignedTrainerId;
      if (updates.exerciseGoals !== undefined) updateData.exercise_goals = updates.exerciseGoals;
      if (updates.motivation !== undefined) updateData.motivation = updates.motivation;
      if (updates.medicalHistory !== undefined) updateData.medical_history = updates.medicalHistory;
      if (updates.exerciseExperience !== undefined) updateData.exercise_experience = updates.exerciseExperience;
      if (updates.preferredTime !== undefined) updateData.preferred_time = updates.preferredTime;
      if (updates.occupation !== undefined) updateData.occupation = updates.occupation;
      if (updates.memo !== undefined) updateData.memo = updates.memo;

      const { data, error } = await supabase
        .from('members')
        .update(updateData)
        .eq('id', memberId)
        .select()
        .single();

      if (error) {
        console.error('회원 업데이트 실패:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        contact: data.contact,
        branchId: data.branch_id,
        referrerId: data.referrer_id,
        assignedTrainerId: data.assigned_trainer_id,
        exerciseGoals: data.exercise_goals,
        motivation: data.motivation,
        medicalHistory: data.medical_history,
        exerciseExperience: data.exercise_experience,
        preferredTime: data.preferred_time,
        occupation: data.occupation,
        memo: data.memo,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('회원 업데이트 중 오류:', error);
      return null;
    }
  }

  static async deleteMember(memberId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', memberId);

      if (error) {
        console.error('회원 삭제 실패:', error);
        return false;
      }
    
    return true;
    } catch (error) {
      console.error('회원 삭제 중 오류:', error);
      return false;
    }
  }

  // ==================== TRAINERS ====================
  static async getTrainers(): Promise<Trainer[]> {
    try {
      const { data, error } = await supabase
        .from('trainers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('트레이너 조회 실패:', error);
        return [];
      }

      return data?.map(trainer => ({
        id: trainer.id,
        name: trainer.name,
        branchRates: trainer.branch_rates,
        branchIds: trainer.branch_ids,
        isActive: trainer.is_active,
        color: trainer.color,
        photoUrl: trainer.photo_url,
        createdAt: trainer.created_at
      })) || [];
    } catch (error) {
      console.error('트레이너 조회 중 오류:', error);
      return [];
    }
  }

  static async createTrainer(trainerData: Omit<Trainer, 'id'>): Promise<Trainer | null> {
    try {
      const { data: newTrainer, error } = await supabase
        .from('trainers')
        .insert({
          name: trainerData.name,
          branch_rates: trainerData.branchRates,
          branch_ids: trainerData.branchIds,
          is_active: trainerData.isActive,
          color: trainerData.color,
          photo_url: trainerData.photoUrl,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('트레이너 생성 실패:', error);
        return null;
      }

      return {
        id: newTrainer.id,
        name: newTrainer.name,
        branchRates: newTrainer.branch_rates,
        branchIds: newTrainer.branch_ids,
        isActive: newTrainer.is_active,
        color: newTrainer.color,
        photoUrl: newTrainer.photo_url,
        createdAt: newTrainer.created_at
      };
    } catch (error) {
      console.error('트레이너 생성 중 오류:', error);
      return null;
    }
  }

  static async updateTrainer(trainerId: string, updates: Partial<Trainer>): Promise<Trainer | null> {
    try {
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.branchRates !== undefined) updateData.branch_rates = updates.branchRates;
      if (updates.branchIds !== undefined) updateData.branch_ids = updates.branchIds;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.color !== undefined) updateData.color = updates.color;
      if (updates.photoUrl !== undefined) updateData.photo_url = updates.photoUrl;

      const { data, error } = await supabase
        .from('trainers')
        .update(updateData)
        .eq('id', trainerId)
        .select()
        .single();

      if (error) {
        console.error('트레이너 업데이트 실패:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        branchRates: data.branch_rates,
        branchIds: data.branch_ids,
        isActive: data.is_active,
        color: data.color,
        photoUrl: data.photo_url,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('트레이너 업데이트 중 오류:', error);
      return null;
    }
  }

  static async deleteTrainer(trainerId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('trainers')
        .delete()
        .eq('id', trainerId);

      if (error) {
        console.error('트레이너 삭제 실패:', error);
        return false;
      }

    return true;
    } catch (error) {
      console.error('트레이너 삭제 중 오류:', error);
      return false;
    }
  }

  // ==================== PROGRAMS ====================
  static async getPrograms(): Promise<MemberProgram[]> {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('프로그램 조회 실패:', error);
        return [];
      }

      return data?.map(program => ({
        id: program.id,
        memberIds: program.member_ids,
        programName: program.program_name,
        registrationType: program.registration_type,
        registrationDate: program.registration_date,
        paymentDate: program.payment_date,
        totalAmount: program.total_amount,
        totalSessions: program.total_sessions,
        unitPrice: program.unit_price,
        completedSessions: program.completed_sessions,
        status: program.status as ProgramStatus,
        assignedTrainerId: program.assigned_trainer_id,
        memo: program.memo,
        defaultSessionDuration: program.default_session_duration,
        branchId: program.branch_id,
        fixedTrainerFee: program.fixed_trainer_fee,
        sessionFees: program.session_fees,
        createdAt: program.created_at
      })) || [];
    } catch (error) {
      console.error('프로그램 조회 중 오류:', error);
      return [];
    }
  }

  static async createProgram(programData: Omit<MemberProgram, 'id'>): Promise<MemberProgram | null> {
    try {
      const { data: newProgram, error } = await supabase
        .from('programs')
        .insert({
          member_ids: programData.memberIds,
          program_name: programData.programName,
          registration_type: programData.registrationType,
          registration_date: programData.registrationDate,
          payment_date: programData.paymentDate,
          total_amount: programData.totalAmount,
          total_sessions: programData.totalSessions,
          unit_price: programData.unitPrice,
          completed_sessions: programData.completedSessions || 0,
          status: programData.status,
          assigned_trainer_id: programData.assignedTrainerId,
          memo: programData.memo,
          default_session_duration: programData.defaultSessionDuration,
          branch_id: programData.branchId,
          fixed_trainer_fee: programData.fixedTrainerFee,
          session_fees: programData.sessionFees,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('프로그램 생성 실패:', error);
        return null;
      }

      return {
        id: newProgram.id,
        memberIds: newProgram.member_ids,
        programName: newProgram.program_name,
        registrationType: newProgram.registration_type,
        registrationDate: newProgram.registration_date,
        paymentDate: newProgram.payment_date,
        totalAmount: newProgram.total_amount,
        totalSessions: newProgram.total_sessions,
        unitPrice: newProgram.unit_price,
        completedSessions: newProgram.completed_sessions,
        status: newProgram.status as ProgramStatus,
        assignedTrainerId: newProgram.assigned_trainer_id,
        memo: newProgram.memo,
        defaultSessionDuration: newProgram.default_session_duration,
        branchId: newProgram.branch_id,
        fixedTrainerFee: newProgram.fixed_trainer_fee,
        sessionFees: newProgram.session_fees,
        createdAt: newProgram.created_at
      };
    } catch (error) {
      console.error('프로그램 생성 중 오류:', error);
      return null;
    }
  }

  static async updateProgram(programId: string, updates: Partial<MemberProgram>): Promise<MemberProgram | null> {
    try {
      console.log('DataManager.updateProgram 호출:', { programId, updates });
      const updateData: any = {};
      
      if (updates.memberIds !== undefined) updateData.member_ids = updates.memberIds;
      if (updates.programName !== undefined) updateData.program_name = updates.programName;
      if (updates.registrationType !== undefined) updateData.registration_type = updates.registrationType;
      if (updates.registrationDate !== undefined) updateData.registration_date = updates.registrationDate;
      if (updates.paymentDate !== undefined) updateData.payment_date = updates.paymentDate;
      if (updates.totalAmount !== undefined) updateData.total_amount = updates.totalAmount;
      if (updates.totalSessions !== undefined) updateData.total_sessions = updates.totalSessions;
      if (updates.unitPrice !== undefined) updateData.unit_price = updates.unitPrice;
      if (updates.completedSessions !== undefined) updateData.completed_sessions = updates.completedSessions;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.assignedTrainerId !== undefined) {
        // null 또는 undefined를 null로 변환하여 Supabase에서 처리할 수 있도록 함
        updateData.assigned_trainer_id = updates.assignedTrainerId || null;
      }
      if (updates.memo !== undefined) updateData.memo = updates.memo;
      if (updates.defaultSessionDuration !== undefined) updateData.default_session_duration = updates.defaultSessionDuration;
      if (updates.branchId !== undefined) updateData.branch_id = updates.branchId;
      if (updates.fixedTrainerFee !== undefined) updateData.fixed_trainer_fee = updates.fixedTrainerFee;
      if (updates.sessionFees !== undefined) updateData.session_fees = updates.sessionFees;

      console.log('Supabase 업데이트 데이터:', updateData);

      console.log('Supabase 업데이트 실행 중...');
      const { data, error } = await supabase
        .from('programs')
        .update(updateData)
        .eq('id', programId)
        .select()
        .single();

      console.log('Supabase 업데이트 응답:', { data, error });

      if (error) {
        console.error('프로그램 업데이트 실패:', error);
        console.error('오류 상세:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return null;
      }

      return {
        id: data.id,
        memberIds: data.member_ids,
        programName: data.program_name,
        registrationType: data.registration_type,
        registrationDate: data.registration_date,
        paymentDate: data.payment_date,
        totalAmount: data.total_amount,
        totalSessions: data.total_sessions,
        unitPrice: data.unit_price,
        completedSessions: data.completed_sessions,
        status: data.status as ProgramStatus,
        assignedTrainerId: data.assigned_trainer_id,
        memo: data.memo,
        defaultSessionDuration: data.default_session_duration,
        branchId: data.branch_id,
        fixedTrainerFee: data.fixed_trainer_fee,
        sessionFees: data.session_fees,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('프로그램 업데이트 중 오류:', error);
      return null;
    }
  }

  static async deleteProgram(programId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('programs')
        .delete()
        .eq('id', programId);

      if (error) {
        console.error('프로그램 삭제 실패:', error);
        return false;
      }
    
    return true;
    } catch (error) {
      console.error('프로그램 삭제 중 오류:', error);
      return false;
    }
  }

  // ==================== SESSIONS ====================
  static async getSessions(): Promise<Session[]> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.error('세션 조회 실패:', error);
        return [];
      }

      return data?.map(session => ({
        id: session.id,
        programId: session.program_id,
        sessionNumber: session.session_number,
        trainerId: session.trainer_id,
        date: session.date,
        startTime: session.start_time,
        duration: session.duration,
        status: session.status as SessionStatus,
        trainerFee: session.trainer_fee,
        trainerRate: session.trainer_rate,
        attendedMemberIds: session.attended_member_ids,
        createdAt: session.created_at
      })) || [];
    } catch (error) {
      console.error('세션 조회 중 오류:', error);
      return [];
    }
  }

  static async createSession(sessionData: Omit<Session, 'id'>): Promise<Session | null> {
    try {
      const { data: newSession, error } = await supabase
        .from('sessions')
        .insert({
          program_id: sessionData.programId,
          session_number: sessionData.sessionNumber,
          trainer_id: sessionData.trainerId,
          date: sessionData.date,
          start_time: sessionData.startTime,
          duration: sessionData.duration,
          status: sessionData.status,
          trainer_fee: sessionData.trainerFee,
          trainer_rate: sessionData.trainerRate,
          attended_member_ids: sessionData.attendedMemberIds,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('세션 생성 실패:', error);
        return null;
      }

      return {
        id: newSession.id,
        programId: newSession.program_id,
        sessionNumber: newSession.session_number,
        trainerId: newSession.trainer_id,
        date: newSession.date,
        startTime: newSession.start_time,
        duration: newSession.duration,
        status: newSession.status as SessionStatus,
        trainerFee: newSession.trainer_fee,
        trainerRate: newSession.trainer_rate,
        attendedMemberIds: newSession.attended_member_ids,
        createdAt: newSession.created_at
      };
    } catch (error) {
      console.error('세션 생성 중 오류:', error);
      return null;
    }
  }

  static async updateSession(sessionId: string, updates: Partial<Session>): Promise<Session | null> {
    try {
      console.log('DataManager.updateSession 호출:', { sessionId, updates });
      const updateData: any = {};
      
      if (updates.programId !== undefined) updateData.program_id = updates.programId;
      if (updates.sessionNumber !== undefined) updateData.session_number = updates.sessionNumber;
      if (updates.trainerId !== undefined) updateData.trainer_id = updates.trainerId;
      if (updates.date !== undefined) updateData.date = updates.date;
      if (updates.startTime !== undefined) updateData.start_time = updates.startTime;
      if (updates.duration !== undefined) updateData.duration = updates.duration;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.sessionFee !== undefined) updateData.session_fee = updates.sessionFee;
      if (updates.trainerFee !== undefined) updateData.trainer_fee = updates.trainerFee;
      if (updates.trainerRate !== undefined) updateData.trainer_rate = updates.trainerRate;
      if (updates.attendedMemberIds !== undefined) updateData.attended_member_ids = updates.attendedMemberIds;
      if (updates.completedAt !== undefined) updateData.completed_at = updates.completedAt;

      console.log('Supabase 업데이트 데이터:', updateData);
      console.log('업데이트할 세션 ID:', sessionId);

      // 먼저 해당 세션이 존재하는지 확인
      const { data: existingSession, error: checkError } = await supabase
        .from('sessions')
        .select('id, status')
        .eq('id', sessionId)
        .single();

      console.log('기존 세션 확인 결과:', { existingSession, checkError });

      if (checkError) {
        console.error('세션 존재 확인 실패:', checkError);
        return null;
      }

      if (!existingSession) {
        console.error('세션을 찾을 수 없습니다:', sessionId);
        return null;
      }

      const { data, error } = await supabase
        .from('sessions')
        .update(updateData)
        .eq('id', sessionId)
        .select()
        .single();

      console.log('Supabase 업데이트 응답:', { data, error });

      if (error) {
        console.error('세션 업데이트 실패:', error);
        console.error('오류 상세:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return null;
      }

      return {
        id: data.id,
        programId: data.program_id,
        sessionNumber: data.session_number,
        trainerId: data.trainer_id,
        date: data.date,
        startTime: data.start_time,
        duration: data.duration,
        status: data.status as SessionStatus,
        sessionFee: data.session_fee,
        trainerFee: data.trainer_fee,
        trainerRate: data.trainer_rate,
        attendedMemberIds: data.attended_member_ids,
        completedAt: data.completed_at,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('세션 업데이트 중 오류:', error);
      return null;
    }
  }

  static async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId);

      if (error) {
        console.error('세션 삭제 실패:', error);
        return false;
      }

    return true;
    } catch (error) {
      console.error('세션 삭제 중 오류:', error);
      return false;
    }
  }

  // ==================== PROGRAM PRESETS ====================
  static async getProgramPresets(): Promise<ProgramPreset[]> {
    try {
      const { data, error } = await supabase
        .from('program_presets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('프로그램 프리셋 조회 실패:', error);
        return [];
      }

      return data?.map(preset => ({
        id: preset.id,
        name: preset.name,
        totalAmount: preset.total_amount,
        totalSessions: preset.total_sessions,
        branchId: preset.branch_id,
        defaultSessionDuration: preset.default_session_duration,
        fixedTrainerFee: preset.fixed_trainer_fee,
        sessionFees: preset.session_fees,
        createdAt: preset.created_at
      })) || [];
    } catch (error) {
      console.error('프로그램 프리셋 조회 중 오류:', error);
      return [];
    }
  }

  static async createProgramPreset(presetData: Omit<ProgramPreset, 'id'>): Promise<ProgramPreset | null> {
    try {
      const { data: newPreset, error } = await supabase
        .from('program_presets')
        .insert({
          name: presetData.name,
          total_amount: presetData.totalAmount,
          total_sessions: presetData.totalSessions,
          branch_id: presetData.branchId,
          default_session_duration: presetData.defaultSessionDuration,
          fixed_trainer_fee: presetData.fixedTrainerFee,
          session_fees: presetData.sessionFees,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('프로그램 프리셋 생성 실패:', error);
        return null;
      }

      return {
        id: newPreset.id,
        name: newPreset.name,
        totalAmount: newPreset.total_amount,
        totalSessions: newPreset.total_sessions,
        branchId: newPreset.branch_id,
        defaultSessionDuration: newPreset.default_session_duration,
        fixedTrainerFee: newPreset.fixed_trainer_fee,
        sessionFees: newPreset.session_fees
      };
    } catch (error) {
      console.error('프로그램 프리셋 생성 중 오류:', error);
      return null;
    }
  }

  static async updateProgramPreset(presetId: string, updates: Partial<ProgramPreset>): Promise<ProgramPreset | null> {
    try {
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.totalAmount !== undefined) updateData.total_amount = updates.totalAmount;
      if (updates.totalSessions !== undefined) updateData.total_sessions = updates.totalSessions;
      if (updates.branchId !== undefined) updateData.branch_id = updates.branchId;
      if (updates.defaultSessionDuration !== undefined) updateData.default_session_duration = updates.defaultSessionDuration;
      if (updates.fixedTrainerFee !== undefined) updateData.fixed_trainer_fee = updates.fixedTrainerFee;
      if (updates.sessionFees !== undefined) updateData.session_fees = updates.sessionFees;

      const { data, error } = await supabase
        .from('program_presets')
        .update(updateData)
        .eq('id', presetId)
        .select()
        .single();

      if (error) {
        console.error('프로그램 프리셋 업데이트 실패:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        totalAmount: data.total_amount,
        totalSessions: data.total_sessions,
        branchId: data.branch_id,
        defaultSessionDuration: data.default_session_duration,
        fixedTrainerFee: data.fixed_trainer_fee,
        sessionFees: data.session_fees
      };
    } catch (error) {
      console.error('프로그램 프리셋 업데이트 중 오류:', error);
      return null;
    }
  }

  static async deleteProgramPreset(presetId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('program_presets')
        .delete()
        .eq('id', presetId);

      if (error) {
        console.error('프로그램 프리셋 삭제 실패:', error);
        return false;
      }

    return true;
    } catch (error) {
      console.error('프로그램 프리셋 삭제 중 오류:', error);
      return false;
    }
  }

  // ==================== AUDIT LOGS ====================
  static async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('감사 로그 조회 실패:', error);
        return [];
      }

      return data?.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        userName: log.user_name,
        userId: log.user_id,
        action: log.action,
        entityType: log.entity_type,
        entityName: log.entity_name,
        details: log.details,
        branchId: log.branch_id
      })) || [];
    } catch (error) {
      console.error('감사 로그 조회 중 오류:', error);
      return [];
    }
  }

  static async addAuditLog(logData: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog | null> {
    try {
      const { data: newLog, error } = await supabase
        .from('audit_logs')
        .insert({
          user_name: logData.userName,
          user_id: logData.userId,
          action: logData.action,
          entity_type: logData.entityType,
          entity_name: logData.entityName,
          details: logData.details,
          branch_id: logData.branchId,
          timestamp: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('감사 로그 생성 실패:', error);
        return null;
      }

      return {
        id: newLog.id,
        timestamp: newLog.timestamp,
        userName: newLog.user_name,
        userId: newLog.user_id,
        action: newLog.action,
        entityType: newLog.entity_type,
        entityName: newLog.entity_name,
        details: newLog.details,
        branchId: newLog.branch_id
      };
    } catch (error) {
      console.error('감사 로그 생성 중 오류:', error);
      return null;
    }
  }

  // ==================== USERS ====================
  static async getUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('사용자 조회 실패:', error);
        return [];
      }

      return data?.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as any,
        assignedBranchIds: user.assigned_branch_ids,
        trainerProfileId: user.trainer_profile_id
      })) || [];
    } catch (error) {
      console.error('사용자 조회 중 오류:', error);
      return [];
    }
  }

  static async createUser(userData: Omit<User, 'id'>): Promise<User | null> {
    try {
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          name: userData.name,
          email: userData.email,
          role: userData.role,
          assigned_branch_ids: userData.assignedBranchIds,
          trainer_profile_id: userData.trainerProfileId
        })
        .select()
        .single();

      if (error) {
        console.error('사용자 생성 실패:', error);
        return null;
      }

      return {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role as any,
        assignedBranchIds: newUser.assigned_branch_ids,
        trainerProfileId: newUser.trainer_profile_id
      };
    } catch (error) {
      console.error('사용자 생성 중 오류:', error);
      return null;
    }
  }

  static async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    try {
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.role !== undefined) updateData.role = updates.role;
      if (updates.assignedBranchIds !== undefined) updateData.assigned_branch_ids = updates.assignedBranchIds;
      if (updates.trainerProfileId !== undefined) updateData.trainer_profile_id = updates.trainerProfileId;

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('사용자 업데이트 실패:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role as any,
        assignedBranchIds: data.assigned_branch_ids,
        trainerProfileId: data.trainer_profile_id
      };
    } catch (error) {
      console.error('사용자 업데이트 중 오류:', error);
      return null;
    }
  }

  static async deleteUser(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('사용자 삭제 실패:', error);
        return false;
      }

    return true;
    } catch (error) {
      console.error('사용자 삭제 중 오류:', error);
      return false;
    }
  }
}