import { z } from "zod";
import { normalizeRole } from "@/middleware/role.middleware";

const roleSchema = z.preprocess(
  (value) => normalizeRole(value),
  z.enum(["Passanger", "Agent", "Admin", "SuperAdmin", "Driver"])
);
const statusSchema = z.preprocess(
  (value) => typeof value === "string" ? value.trim().toLowerCase() : value,
  z.enum(["active", "inactive"])
);

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
  role: roleSchema.optional().default("Admin"),
  status: statusSchema.optional().default("active"),
  stationId: z.coerce.number().int().positive("Station ID must be a positive number").optional().nullable(),
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
  role: roleSchema.optional(),
  status: statusSchema.optional(),
  stationId: z.coerce.number().int().positive("Station ID must be a positive number").optional().nullable(),
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
