import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StravaWebhookEvent {
  object_type: 'activity' | 'athlete';
  object_id: number;
  aspect_type: 'create' | 'update' | 'delete';
  owner_id: number;
  subscription_id: number;
  event_time: number;
  updates: Record<string, string | boolean>;
}

interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  start_date: string;
  average_heartrate?: number;
  max_heartrate?: number;
  average_speed: number;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Strava webhook verification (GET request)
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    const verifyToken = Deno.env.get('STRAVA_WEBHOOK_VERIFY_TOKEN');

    if (mode === 'subscribe' && token === verifyToken && challenge) {
      return new Response(JSON.stringify({ 'hub.challenge': challenge }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Forbidden', { status: 403, headers: corsHeaders });
  }

  // Process webhook event (POST request)
  if (req.method === 'POST') {
    try {
      const event = (await req.json()) as StravaWebhookEvent;

      // Only process running activity creations
      if (event.object_type !== 'activity' || event.aspect_type !== 'create') {
        return new Response('Event ignored', { status: 200, headers: corsHeaders });
      }

      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase environment variables');
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      // Find the user by their Strava athlete ID
      const { data: profile, error: profileError } = await supabase
        .from('users_profiles')
        .select('id, strava_access_token')
        .eq('strava_athlete_id', event.owner_id)
        .single();

      if (profileError || !profile) {
        console.error('User not found for Strava athlete:', event.owner_id);
        return new Response('User not found', { status: 404, headers: corsHeaders });
      }

      // Fetch activity details from Strava API
      const activityResponse = await fetch(
        `https://www.strava.com/api/v3/activities/${event.object_id}`,
        {
          headers: { Authorization: `Bearer ${profile.strava_access_token}` },
        }
      );

      if (!activityResponse.ok) {
        throw new Error(`Strava API error: ${activityResponse.statusText}`);
      }

      const activity = (await activityResponse.json()) as StravaActivity;

      // Only sync running activities
      const runningTypes = ['Run', 'TrailRun', 'VirtualRun'];
      if (!runningTypes.includes(activity.sport_type)) {
        return new Response('Non-running activity ignored', { status: 200, headers: corsHeaders });
      }

      // Find a matching pending session (same date, mark as completed)
      const activityDate = activity.start_date.split('T')[0];

      const { data: sessions } = await supabase
        .from('user_sessions')
        .select('id')
        .eq('user_id', profile.id)
        .eq('scheduled_date', activityDate)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(1);

      if (sessions && sessions.length > 0) {
        const sessionId = sessions[0].id as string;
        await supabase
          .from('user_sessions')
          .update({
            status: 'completed',
            completed_at: activity.start_date,
            strava_activity_id: activity.id,
            actual_duration_seconds: activity.moving_time,
            actual_distance_meters: activity.distance,
          })
          .eq('id', sessionId);

        console.log(`Session ${sessionId} auto-completed via Strava activity ${activity.id}`);
      }

      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Strava webhook error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  return new Response('Method not allowed', { status: 405, headers: corsHeaders });
});
