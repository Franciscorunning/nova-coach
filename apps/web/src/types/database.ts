// Auto-generated types matching the Supabase PostgreSQL schema

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type SubscriptionStatus = 'free' | 'premium';
export type TargetPlan = 'galloway' | '15km' | 'semi';
export type SessionStatus = 'pending' | 'completed' | 'skipped' | 'failed';
export type SessionType = 'E1' | 'E2' | 'E3' | 'E4' | 'MUSCU' | 'REPOS';
export type IntensityLevel = 1 | 2 | 3 | 4 | 5;
export type PileCount = 1 | 2 | 3;

// Base database row types - must have index signature to be compatible with Supabase's GenericTable
export type UserProfile = {
  [key: string]: unknown;
  id: string;
  weight: number;
  target_plan: TargetPlan | null;
  current_level: number;
  subscription_status: SubscriptionStatus;
  stripe_customer_id: string | null;
  strava_athlete_id: number | null;
  strava_access_token: string | null;
  strava_refresh_token: string | null;
  preferences: Json;
  created_at: string;
  updated_at: string;
};

export type TrainingPlan = {
  [key: string]: unknown;
  id: number;
  plan_type: string;
  week_number: number;
  session_number: number;
  session_type: SessionType | null;
  title: string;
  duration_minutes: number | null;
  distance_meters: number | null;
  description: string;
  intensity_level: IntensityLevel | null;
  pile_count: PileCount | null;
};

export type UserSessionRow = {
  [key: string]: unknown;
  id: string;
  user_id: string;
  plan_session_id: number | null;
  scheduled_date: string;
  status: SessionStatus;
  completed_at: string | null;
  strava_activity_id: number | null;
  actual_duration_seconds: number | null;
  actual_distance_meters: number | null;
  user_feedback: Json | null;
  created_at: string;
};

// UserSession includes the joined training_plan for display purposes
export type UserSession = UserSessionRow & {
  training_plan?: TrainingPlan;
};

export type NutritionLog = {
  [key: string]: unknown;
  id: string;
  user_id: string;
  date: string;
  pile_count: PileCount;
  meals: Json;
  hydration_reminder: boolean;
  supplements_taken: Json | null;
  created_at: string;
};

export type AdminDashboardStats = {
  [key: string]: unknown;
  id: number;
  date: string;
  total_users: number | null;
  active_users: number | null;
  mrr: number | null;
  completion_rate: number | null;
  top_strava_records: Json | null;
  refreshed_at: string;
};

// User feedback stored as JSON in the database
export type UserFeedback = {
  difficulty: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  felt_good: boolean;
};

export interface Database {
  public: {
    Tables: {
      users_profiles: {
        Row: UserProfile;
        Insert: {
          [key: string]: unknown;
          id: string;
          weight: number;
          target_plan?: TargetPlan | null;
          current_level?: number;
          subscription_status?: SubscriptionStatus;
          stripe_customer_id?: string | null;
          strava_athlete_id?: number | null;
          strava_access_token?: string | null;
          strava_refresh_token?: string | null;
          preferences?: Json;
        };
        Update: Partial<Omit<UserProfile, 'id' | 'created_at'>>;
        Relationships: [];
      };
      training_plans: {
        Row: TrainingPlan;
        Insert: Omit<TrainingPlan, 'id'>;
        Update: Partial<Omit<TrainingPlan, 'id'>>;
        Relationships: [];
      };
      user_sessions: {
        Row: UserSessionRow;
        Insert: {
          [key: string]: unknown;
          id?: string;
          user_id: string;
          plan_session_id?: number | null;
          scheduled_date: string;
          status?: SessionStatus;
          completed_at?: string | null;
          strava_activity_id?: number | null;
          actual_duration_seconds?: number | null;
          actual_distance_meters?: number | null;
          user_feedback?: Json | null;
        };
        Update: Partial<Omit<UserSessionRow, 'id' | 'user_id' | 'created_at'>>;
        Relationships: [];
      };
      nutrition_logs: {
        Row: NutritionLog;
        Insert: Omit<NutritionLog, 'id' | 'created_at'>;
        Update: Partial<Omit<NutritionLog, 'id' | 'user_id' | 'created_at'>>;
        Relationships: [];
      };
      admin_dashboard_stats: {
        Row: AdminDashboardStats;
        Insert: Omit<AdminDashboardStats, 'id'>;
        Update: Partial<Omit<AdminDashboardStats, 'id'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
