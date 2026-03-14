import { z } from 'zod';

// Login form schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Register form schema
export const registerSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    weight: z.number().min(30, 'Weight must be at least 30kg').max(300, 'Weight seems too high'),
    target_plan: z.enum(['galloway', '15km', 'semi']),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Session feedback schema
export const sessionFeedbackSchema = z.object({
  difficulty: z.number().min(1).max(5),
  notes: z.string().max(500).optional(),
  felt_good: z.boolean(),
  actual_duration_seconds: z.number().min(0).optional(),
  actual_distance_meters: z.number().min(0).optional(),
});

// Nutrition log schema
export const nutritionLogSchema = z.object({
  date: z.string(),
  pile_count: z.number().min(1).max(3),
  meals: z.array(
    z.object({
      meal: z.string(),
      portions: z.record(z.string(), z.number()),
    })
  ),
  hydration_reminder: z.boolean().default(false),
});

// Profile update schema
export const profileUpdateSchema = z.object({
  weight: z.number().min(30).max(300).optional(),
  target_plan: z.enum(['galloway', '15km', 'semi']).optional(),
  preferences: z.record(z.string(), z.unknown()).optional(),
});

// Type inference from Zod schemas
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type SessionFeedbackData = z.infer<typeof sessionFeedbackSchema>;
export type NutritionLogData = z.infer<typeof nutritionLogSchema>;
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;
