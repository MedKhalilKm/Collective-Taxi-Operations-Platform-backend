import { z } from "zod";

const roleValues = [
  "SUPER_ADMIN",
  "ADMIN",
  "AGENT",
  "DRIVER",
  "USER",
  "SuperAdmin",
  "Admin",
  "Agent",
  "Driver",
  "Passanger",
] as const;

export const createUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  username: z
    .string()
    .min(2, "Username must be at least 2 characters")
    .max(30, "Username must not exceed 30 characters")
    .regex(/^[a-zA-Z0-9._-]+$/, "Username can only contain letters, numbers, underscores, dots, and hyphens"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNumber: z
    .string()
    .min(6, "Phone number must be at least 6 characters")
    .regex(/^[+0-9\s-]+$/, "Invalid phone number format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must not exceed 128 characters"),
  role: z.enum(roleValues).optional().default("Admin"),
  status: z.enum(["active", "inactive"]).optional().default("active"),
});

export const updateUserSchema = z.object({
  email: z.string().email("Invalid email format").optional(),
  username: z
    .string()
    .min(2, "Username must be at least 2 characters")
    .max(30, "Username must not exceed 30 characters")
    .regex(/^[a-zA-Z0-9._-]+$/, "Username can only contain letters, numbers, underscores, dots, and hyphens")
    .optional(),
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  phoneNumber: z
    .string()
    .min(6, "Phone number must be at least 6 characters")
    .regex(/^[+0-9\s-]+$/, "Invalid phone number format")
    .optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must not exceed 128 characters")
    .optional(),
  role: z.enum(roleValues).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const userQuerySchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreateUserDtoInput = z.infer<typeof createUserSchema>;
export type UpdateUserDtoInput = z.infer<typeof updateUserSchema>;
export type UserQueryInput = z.infer<typeof userQuerySchema>;
