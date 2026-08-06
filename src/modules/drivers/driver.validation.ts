import { z } from "zod";

const futureDate = z.coerce.date().refine((date) => date > new Date(), {
  message: "Expiry date must be in the future",
});

export const createDriverSchema = z.object({
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
  status: z.enum(["active", "inactive"]).optional().default("active"),
  cin: z.coerce.number().int().positive("CIN must be a positive number"),
  professionalIdCard: z.string().min(1, "Professional ID card is required"),
  professionalCardExpiry: futureDate,
  drivingLicence: z.coerce.number().int().positive("Driving licence must be a positive number"),
  drivingLicenceExpiry: futureDate,
});

export const updateDriverSchema = z.object({
  cin: z.coerce.number().int().positive("CIN must be a positive number").optional(),
  professionalIdCard: z.string().min(1, "Professional ID card is required").optional(),
  professionalCardExpiry: futureDate.optional(),
  drivingLicence: z.coerce.number().int().positive("Driving licence must be a positive number").optional(),
  drivingLicenceExpiry: futureDate.optional(),
});

export const driverQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreateDriverDtoInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverDtoInput = z.infer<typeof updateDriverSchema>;
export type DriverQueryInput = z.infer<typeof driverQuerySchema>;
