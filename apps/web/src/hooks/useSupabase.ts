import { supabase } from '@/utils/supabase';

/**
 * Hook that returns the typed Supabase client.
 * Use this for direct Supabase operations not covered by stores.
 */
export function useSupabase() {
  return supabase;
}
