import { create } from 'zustand';
import { supabase } from '@/utils/supabase';
import type { UserSession, TrainingPlan, SessionStatus, UserFeedback } from '@/types/database';
import { format } from 'date-fns';

interface SessionsState {
  sessions: UserSession[];
  currentSession: UserSession | null;
  trainingPlans: TrainingPlan[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchSessions: (userId: string) => Promise<void>;
  fetchSession: (sessionId: string) => Promise<void>;
  fetchTrainingPlans: (planType?: string) => Promise<void>;
  assignPlan: (userId: string, planType: string, startDate: Date) => Promise<void>;
  updateSessionStatus: (sessionId: string, status: SessionStatus, feedback?: UserFeedback) => Promise<void>;
  completeSession: (sessionId: string, feedback: UserFeedback, actualDuration?: number, actualDistance?: number) => Promise<void>;
  clearError: () => void;
}

export const useSessionsStore = create<SessionsState>((set) => ({
  sessions: [],
  currentSession: null,
  trainingPlans: [],
  isLoading: false,
  error: null,

  fetchSessions: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      const { data, error } = await supabase
        .from('user_sessions')
        .select(`
          *,
          training_plan:training_plans(*)
        `)
        .eq('user_id', userId)
        .order('scheduled_date', { ascending: true });
      if (error) throw error;
      set({ sessions: data as UserSession[] });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch sessions' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSession: async (sessionId: string) => {
    try {
      set({ isLoading: true, error: null });
      const { data, error } = await supabase
        .from('user_sessions')
        .select(`
          *,
          training_plan:training_plans(*)
        `)
        .eq('id', sessionId)
        .single();
      if (error) throw error;
      set({ currentSession: data as UserSession });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch session' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTrainingPlans: async (planType?: string) => {
    try {
      set({ isLoading: true, error: null });
      let query = supabase.from('training_plans').select('*').order('week_number').order('session_number');
      if (planType) {
        query = query.eq('plan_type', planType);
      }
      const { data, error } = await query;
      if (error) throw error;
      set({ trainingPlans: data });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch training plans' });
    } finally {
      set({ isLoading: false });
    }
  },

  assignPlan: async (userId: string, planType: string, startDate: Date) => {
    try {
      set({ isLoading: true, error: null });

      // Fetch all sessions for the plan
      const { data: plans, error: planError } = await supabase
        .from('training_plans')
        .select('*')
        .eq('plan_type', planType)
        .order('week_number')
        .order('session_number');
      if (planError) throw planError;

      // Create user sessions with scheduled dates (3 sessions/week)
      const sessionsToInsert = plans.map((plan, index) => {
        const weekOffset = Math.floor(index / 3);
        const dayOffset = (index % 3) * 2; // Mon, Wed, Fri pattern
        const scheduledDate = new Date(startDate);
        scheduledDate.setDate(scheduledDate.getDate() + weekOffset * 7 + dayOffset);

        return {
          user_id: userId,
          plan_session_id: plan.id,
          scheduled_date: format(scheduledDate, 'yyyy-MM-dd'),
          status: 'pending' as SessionStatus,
        };
      });

      const { error } = await supabase.from('user_sessions').upsert(sessionsToInsert, {
        onConflict: 'user_id,plan_session_id,scheduled_date',
      });
      if (error) throw error;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to assign plan' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateSessionStatus: async (sessionId: string, status: SessionStatus, feedback?: UserFeedback) => {
    try {
      set({ isLoading: true, error: null });
      const { data, error } = await supabase
        .from('user_sessions')
        .update({
          status,
          ...(feedback && { user_feedback: feedback }),
          ...(status === 'completed' && { completed_at: new Date().toISOString() }),
        })
        .eq('id', sessionId)
        .select()
        .single();
      if (error) throw error;

      set((state) => ({
        sessions: state.sessions.map((s) => (s.id === sessionId ? { ...s, ...data } : s)),
        currentSession: state.currentSession?.id === sessionId ? { ...state.currentSession, ...data } : state.currentSession,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update session' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  completeSession: async (sessionId: string, feedback: UserFeedback, actualDuration?: number, actualDistance?: number) => {
    try {
      set({ isLoading: true, error: null });
      const { data, error } = await supabase
        .from('user_sessions')
        .update({
          status: 'completed',
          user_feedback: feedback,
          completed_at: new Date().toISOString(),
          ...(actualDuration && { actual_duration_seconds: actualDuration }),
          ...(actualDistance && { actual_distance_meters: actualDistance }),
        })
        .eq('id', sessionId)
        .select()
        .single();
      if (error) throw error;

      set((state) => ({
        sessions: state.sessions.map((s) => (s.id === sessionId ? { ...s, ...data } : s)),
        currentSession: state.currentSession?.id === sessionId ? { ...state.currentSession, ...data } : state.currentSession,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to complete session' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
