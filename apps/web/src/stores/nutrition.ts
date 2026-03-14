import { create } from 'zustand';
import { supabase } from '@/utils/supabase';
import type { NutritionLog } from '@/types/database';
import { format } from 'date-fns';

interface NutritionState {
  logs: NutritionLog[];
  todayLog: NutritionLog | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchLogs: (userId: string, startDate?: string, endDate?: string) => Promise<void>;
  fetchTodayLog: (userId: string) => Promise<void>;
  createLog: (log: Omit<NutritionLog, 'id' | 'created_at'>) => Promise<void>;
  updateLog: (id: string, updates: Partial<NutritionLog>) => Promise<void>;
  clearError: () => void;
}

export const useNutritionStore = create<NutritionState>((set) => ({
  logs: [],
  todayLog: null,
  isLoading: false,
  error: null,

  fetchLogs: async (userId: string, startDate?: string, endDate?: string) => {
    try {
      set({ isLoading: true, error: null });
      let query = supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (startDate) query = query.gte('date', startDate);
      if (endDate) query = query.lte('date', endDate);

      const { data, error } = await query;
      if (error) throw error;
      set({ logs: data as NutritionLog[] });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch nutrition logs' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTodayLog: async (userId: string) => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();
      if (error) throw error;
      set({ todayLog: data as NutritionLog | null });
    } catch (error) {
      console.error('Failed to fetch today log:', error);
    }
  },

  createLog: async (log: Omit<NutritionLog, 'id' | 'created_at'>) => {
    try {
      set({ isLoading: true, error: null });
      const { data, error } = await supabase
        .from('nutrition_logs')
        .insert(log)
        .select()
        .single();
      if (error) throw error;
      const created = data as NutritionLog;
      set((state) => ({
        logs: [created, ...state.logs],
        todayLog: created,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create nutrition log' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateLog: async (id: string, updates: Partial<NutritionLog>) => {
    try {
      set({ isLoading: true, error: null });
      const { data, error } = await supabase
        .from('nutrition_logs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      const updated = data as NutritionLog;
      set((state) => ({
        logs: state.logs.map((l) => (l.id === id ? { ...l, ...updated } : l)),
        todayLog: state.todayLog?.id === id ? { ...state.todayLog, ...updated } : state.todayLog,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update nutrition log' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
