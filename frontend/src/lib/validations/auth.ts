import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  college: z.string().max(255).optional().or(z.literal('')),
  branch: z.string().max(100).optional().or(z.literal('')),
  graduation_year: z
    .number()
    .int()
    .min(2020)
    .max(2035)
    .optional()
    .or(z.nan().transform(() => undefined)),
})

export const profileUpdateSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(255).optional(),
  college: z.string().max(255).optional().or(z.literal('')),
  branch: z.string().max(100).optional().or(z.literal('')),
  graduation_year: z.number().int().min(2020).max(2035).optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>
