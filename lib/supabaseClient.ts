
import { createClient } from '@supabase/supabase-js';
import { Branch, Member, MemberProgram, ProgramPreset, Session, Trainer, User, AuditLog } from '../types';

// Define a type for the database schema to get type safety
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      audit_logs: {
        Row: {
            id: number
            timestamp: string
            user_name: string | null
            user_id: string | null
            action: string
            entity_type: string
            entity_name: string | null
            details: string
            branch_id: string | null
        }
        Insert: {
            id?: number
            timestamp?: string
            user_name: string | null
            user_id: string | null
            action: string
            entity_type: string
            entity_name: string | null
            details: string
            branch_id: string | null
        }
        Update: {
            id?: number
            timestamp?: string
            user_name?: string | null
            user_id?: string | null
            action?: string
            entity_type?: string
            entity_name?: string | null
            details?: string
            branch_id?: string | null
        }
      }
      branches: {
        Row: { id: string, name: string, created_at: string }
        Insert: { id?: string, name: string, created_at?: string }
        Update: {
            id?: string
            name?: string
            created_at?: string
        }
      }
      members: {
        Row: {
            id: string
            name: string
            contact: string
            branch_id: string | null
            referrer_id: string | null
            exercise_goals: string[] | null
            motivation: string | null
            medical_history: string | null
            exercise_experience: string | null
            preferred_time: string[] | null
            occupation: string | null
            memo: string | null
            created_at: string
        }
        Insert: {
            id?: string
            name: string
            contact: string
            branch_id: string | null
            referrer_id: string | null
            exercise_goals: string[] | null
            motivation: string | null
            medical_history: string | null
            exercise_experience: string | null
            preferred_time: string[] | null
            occupation: string | null
            memo: string | null
            created_at?: string
        }
        Update: {
            id?: string
            name?: string
            contact?: string
            branch_id?: string | null
            referrer_id?: string | null
            exercise_goals?: string[] | null
            motivation?: string | null
            medical_history?: string | null
            exercise_experience?: string | null
            preferred_time?: string[] | null
            occupation?: string | null
            memo?: string | null
            created_at?: string
        }
      }
      program_presets: {
        Row: {
            id: string
            name: string
            total_amount: number
            total_sessions: number
            branch_id: string | null
            default_session_duration: number | null
            fixed_trainer_fee: number | null
            session_fees: any | null
            created_at: string
        }
        Insert: {
            id?: string
            name: string
            total_amount: number
            total_sessions: number
            branch_id: string | null
            default_session_duration?: number | null
            fixed_trainer_fee?: number | null
            session_fees?: any | null
            created_at?: string
        }
        Update: {
            id?: string
            name?: string
            total_amount?: number
            total_sessions?: number
            branch_id?: string | null
            default_session_duration?: number | null
            fixed_trainer_fee?: number | null
            session_fees?: any | null
            created_at?: string
        }
      }
      programs: {
        Row: {
            id: string
            member_ids: string[]
            program_name: string
            registration_type: string
            registration_date: string
            payment_date: string
            total_amount: number
            total_sessions: number
            unit_price: number
            completed_sessions: number
            status: string
            assigned_trainer_id: string | null
            memo: string | null
            default_session_duration: number | null
            branch_id: string
            fixed_trainer_fee: number | null
            session_fees: any | null
            created_at: string
        }
        Insert: {
            id?: string
            member_ids: string[]
            program_name: string
            registration_type: string
            registration_date: string
            payment_date: string
            total_amount: number
            total_sessions: number
            unit_price: number
            completed_sessions?: number
            status: string
            assigned_trainer_id: string | null
            memo: string | null
            default_session_duration: number | null
            branch_id: string
            fixed_trainer_fee?: number | null
            session_fees?: any | null
            created_at?: string
        }
        Update: {
            id?: string
            member_ids?: string[]
            program_name?: string
            registration_type?: string
            registration_date?: string
            payment_date?: string
            total_amount?: number
            total_sessions?: number
            unit_price?: number
            completed_sessions?: number
            status?: string
            assigned_trainer_id?: string | null
            memo?: string | null
            default_session_duration?: number | null
            branch_id?: string
            fixed_trainer_fee?: number | null
            session_fees?: any | null
            created_at?: string
        }
      }
      sessions: {
        Row: {
            id: string
            program_id: string
            session_number: number
            trainer_id: string
            date: string
            start_time: string
            duration: number
            status: string
            session_fee: number | null
            trainer_fee: number
            trainer_rate: number
            attended_member_ids: string[]
            completed_at: string | null
            created_at: string
        }
        Insert: {
            id?: string
            program_id: string
            session_number: number
            trainer_id: string
            date: string
            start_time: string
            duration: number
            status: string
            session_fee?: number | null
            trainer_fee: number
            trainer_rate: number
            attended_member_ids: string[]
            completed_at?: string | null
            created_at?: string
        }
        Update: {
            id?: string
            program_id?: string
            session_number?: number
            trainer_id?: string
            date?: string
            start_time?: string
            duration?: number
            status?: string
            session_fee?: number | null
            trainer_fee?: number
            trainer_rate?: number
            attended_member_ids?: string[]
            completed_at?: string | null
            created_at?: string
        }
      }
      trainers: {
        Row: {
            id: string
            name: string
            branch_rates: Json
            branch_ids: string[]
            is_active: boolean
            color: string
            photo_url: string | null
            created_at: string
        }
        Insert: {
            id?: string
            name: string
            branch_rates: Json
            branch_ids: string[]
            is_active?: boolean
            color: string
            photo_url?: string | null
            created_at?: string
        }
        Update: {
            id?: string
            name?: string
            branch_rates?: Json
            branch_ids?: string[]
            is_active?: boolean
            color?: string
            photo_url?: string | null
            created_at?: string
        }
      }
      users: {
        Row: {
            id: string
            name: string | null
            email: string | null
            role: string
            assigned_branch_ids: string[] | null
            trainer_profile_id: string | null
        }
        Insert: {
            id: string
            name: string | null
            email: string | null
            role?: string
            assigned_branch_ids: string[] | null
            trainer_profile_id: string | null
        }
        Update: {
            id?: string
            name?: string | null
            email?: string | null
            role?: string
            assigned_branch_ids?: string[] | null
            trainer_profile_id?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}


const supabaseUrl = 'https://eurpkgbmeziosjqkhmqv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1cnBrZ2JtZXppb3NqcWtobXF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxODMwODEsImV4cCI6MjA3Mjc1OTA4MX0.0TX158-7MPgkKfhEasIs39cyfWhVGTbsRnLjhEp_ORQ';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key are required.");
}


export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
