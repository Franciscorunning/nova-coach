# NOVA COACH - API Reference

## Overview

NOVA COACH uses Supabase as its backend. All API calls go through the Supabase JavaScript client which handles authentication, real-time subscriptions, and REST endpoints automatically.

## Authentication

All requests to protected endpoints require a valid JWT token, which is automatically included by the Supabase client after login.

```
Authorization: Bearer <jwt_token>
```

## Endpoints

### User Profiles

#### GET /users_profiles
Returns the authenticated user's profile.

**Response:**
```json
{
  "id": "uuid",
  "weight": 70.5,
  "target_plan": "galloway",
  "current_level": 1,
  "subscription_status": "free",
  "strava_athlete_id": null,
  "preferences": {},
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### PATCH /users_profiles
Updates the authenticated user's profile.

**Request Body:**
```json
{
  "weight": 71.0,
  "target_plan": "15km"
}
```

---

### Training Plans

#### GET /training_plans
Returns all available training plans. Public endpoint.

**Query Parameters:**
- `plan_type=eq.galloway` - Filter by plan type
- `week_number=eq.1` - Filter by week
- `order=week_number.asc,session_number.asc`

**Response:**
```json
[
  {
    "id": 1,
    "plan_type": "galloway",
    "week_number": 1,
    "session_number": 1,
    "session_type": "E1",
    "title": "Walk/Run Introduction",
    "duration_minutes": 30,
    "distance_meters": 3000,
    "description": "...",
    "intensity_level": 1,
    "pile_count": 1
  }
]
```

---

### User Sessions

#### GET /user_sessions
Returns the authenticated user's sessions.

**Query Parameters:**
- `order=scheduled_date.asc`
- `status=eq.pending`
- `select=*,training_plan:training_plans(*)`

#### POST /user_sessions
Creates new sessions (bulk insert for plan assignment).

#### PATCH /user_sessions?id=eq.{id}
Updates a session (mark as complete, skip, etc.)

**Request Body:**
```json
{
  "status": "completed",
  "completed_at": "2024-01-15T10:00:00Z",
  "actual_duration_seconds": 1800,
  "actual_distance_meters": 5200.5,
  "user_feedback": {
    "difficulty": 3,
    "notes": "Felt great!",
    "felt_good": true
  }
}
```

---

### Nutrition Logs

#### GET /nutrition_logs
Returns the user's nutrition logs.

#### POST /nutrition_logs
Creates a new nutrition log.

**Request Body:**
```json
{
  "date": "2024-01-15",
  "pile_count": 2,
  "meals": [
    {"meal": "breakfast", "portions": {"carbs": 60, "protein": 20}}
  ],
  "hydration_reminder": true
}
```

---

## Edge Functions

### POST /functions/v1/strava-sync
Strava webhook endpoint. Used by Strava to notify of new activities.

### POST /functions/v1/stripe-webhook
Stripe webhook endpoint. Processes subscription lifecycle events.

## Error Responses

All errors follow this format:
```json
{
  "code": "PGRST116",
  "message": "The result contains 0 rows",
  "details": null,
  "hint": null
}
```

Common error codes:
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (RLS policy violation)
- `404` - Not found
- `409` - Conflict (duplicate unique constraint)
- `422` - Unprocessable entity (validation failed)
