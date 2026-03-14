export interface StravaAthlete {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  city: string;
  state: string;
  country: string;
  sex: 'M' | 'F' | 'Other';
  summit: boolean;
  created_at: string;
  updated_at: string;
  badge_type_id: number;
  weight: number;
  profile_medium: string;
  profile: string;
  friend: boolean;
  follower: boolean;
}

export interface StravaTokens {
  token_type: string;
  expires_at: number;
  expires_in: number;
  refresh_token: string;
  access_token: string;
  athlete: StravaAthlete;
}

export interface StravaActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  type: string;
  sport_type: string;
  start_date: string;
  start_date_local: string;
  timezone: string;
  utc_offset: number;
  location_city: string | null;
  location_state: string | null;
  location_country: string | null;
  average_speed: number;
  max_speed: number;
  average_cadence?: number;
  average_temp?: number;
  average_watts?: number;
  max_watts?: number;
  weighted_average_watts?: number;
  kilojoules?: number;
  device_name?: string;
  embed_token?: string;
  manual: boolean;
  private: boolean;
  flagged: boolean;
  gear_id: string | null;
  from_accepted_tag: boolean;
  upload_id: number | null;
  external_id: string | null;
  trainer: boolean;
  commute: boolean;
  map: {
    id: string;
    summary_polyline: string | null;
    resource_state: number;
  };
  visibility: string;
  perceived_exertion: number | null;
  prefer_perceived_exertion: boolean | null;
  calories: number;
  description: string | null;
  segment_efforts: unknown[];
  splits_metric: unknown[];
  best_efforts: unknown[];
  workout_type: number | null;
  has_heartrate: boolean;
  heartrate_opt_out: boolean;
  display_hide_heartrate_option: boolean;
  average_heartrate?: number;
  max_heartrate?: number;
  athlete: {
    id: number;
    resource_state: number;
  };
}

export interface StravaAuthState {
  id: string;
  user_id: string;
  state: string;
  created_at: Date;
  expires_at: Date;
  used: boolean;
}
