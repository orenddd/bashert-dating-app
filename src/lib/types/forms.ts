import { z } from 'zod'

export const RegisterStep1Schema = z.object({
  first_name: z.string().min(2, 'שם פרטי חייב להכיל לפחות 2 תווים'),
  last_name: z.string().min(2, 'שם משפחה חייב להכיל לפחות 2 תווים'),
  email: z.string().email('כתובת אימייל לא תקינה'),
  date_of_birth: z.string().refine((dob) => {
    const age = new Date().getFullYear() - new Date(dob).getFullYear()
    return age >= 18 && age <= 80
  }, 'גיל חייב להיות בין 18 ל-80'),
  gender: z.enum(['male', 'female', 'other']),
  seeking: z.enum(['male', 'female', 'both']),
})

export const RegisterStep2Schema = z.object({
  religious_level: z.enum(['hiloni', 'masorti', 'dati_light', 'dati', 'haredi']),
  kosher_level: z.enum(['none', 'kosher_home', 'kosher_out', 'strict']),
  shomer_shabbat: z.boolean(),
  community_background: z.enum(['ashkenazi', 'sephardic', 'mizrahi', 'yemenite', 'mixed', 'other']),
  hebrew_fluency: z.enum(['none', 'basic', 'conversational', 'fluent', 'native']),
})

export const RegisterStep3Schema = z.object({
  password: z.string().min(8, 'הסיסמה חייבת להכיל לפחות 8 תווים'),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: 'הסיסמאות אינן תואמות',
  path: ['confirm_password'],
})

export const LoginSchema = z.object({
  email: z.string().email('כתובת אימייל לא תקינה'),
  password: z.string().min(1, 'נא להזין סיסמה'),
})

export const ProfileEditSchema = z.object({
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  bio: z.string().max(500),
  occupation: z.string(),
  education: z.string(),
  city: z.string(),
  state: z.string(),
  height_cm: z.number().min(140).max(220).nullable(),
  religious_level: z.enum(['hiloni', 'masorti', 'dati_light', 'dati', 'haredi']),
  kosher_level: z.enum(['none', 'kosher_home', 'kosher_out', 'strict']),
  shomer_shabbat: z.boolean(),
  synagogue_attendance: z.enum(['never', 'holidays', 'monthly', 'weekly', 'daily']),
  community_background: z.enum(['ashkenazi', 'sephardic', 'mizrahi', 'yemenite', 'mixed', 'other']),
  hebrew_fluency: z.enum(['none', 'basic', 'conversational', 'fluent', 'native']),
  aliyah_plan: z.enum(['no', 'considering', 'planning', 'already_made']),
  children_status: z.enum(['no_children', 'has_children', 'wants_children', 'does_not_want', 'open']),
  wants_children: z.boolean().nullable(),
})

export const SearchFiltersSchema = z.object({
  age_min: z.number().min(18).max(80).default(25),
  age_max: z.number().min(18).max(80).default(45),
  distance_km: z.number().min(5).max(500).default(80),
  religious_levels: z.array(z.enum(['hiloni', 'masorti', 'dati_light', 'dati', 'haredi'])).default([]),
  community_backgrounds: z.array(z.enum(['ashkenazi', 'sephardic', 'mizrahi', 'yemenite', 'mixed', 'other'])).default([]),
  hebrew_fluency_min: z.enum(['none', 'basic', 'conversational', 'fluent', 'native']).default('none'),
  shomer_shabbat_only: z.boolean().default(false),
  kosher_only: z.boolean().default(false),
  aliyah_plans: z.array(z.enum(['no', 'considering', 'planning', 'already_made'])).default([]),
  has_photos_only: z.boolean().default(true),
  verified_only: z.boolean().default(false),
})

export type SearchFilters = z.infer<typeof SearchFiltersSchema>
export type RegisterStep1Data = z.infer<typeof RegisterStep1Schema>
export type RegisterStep2Data = z.infer<typeof RegisterStep2Schema>
export type RegisterStep3Data = z.infer<typeof RegisterStep3Schema>
export type LoginData = z.infer<typeof LoginSchema>
export type ProfileEditData = z.infer<typeof ProfileEditSchema>
