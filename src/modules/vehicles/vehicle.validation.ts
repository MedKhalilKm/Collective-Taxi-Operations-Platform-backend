import { z } from "zod";

export const createVehicleSchema = z.object({
  registrationNumber: z.coerce.number().int().positive("Registration number must be positive"),
  seriesNumber: z.coerce.number().int().positive("Series number must be positive"),
  carBrand: z.string().min(1, "Car brand is required"),
  capacity: z.coerce.number().int().positive("Capacity must be positive").optional().default(8),
  status: z.string().min(1, "Status is required").optional().default("active"),
  chassisNumber: z.string().min(1, "Chassis number is required"),
  insuranceExpiry: z.coerce.date(),
  registrationDate: z.coerce.date(),
  inspectionExpiry: z.coerce.date(),
  routeId: z.coerce.number().int().positive("Route ID must be positive").optional(),
});

export const updateVehicleSchema = z.object({
  registrationNumber: z.coerce.number().int().positive("Registration number must be positive").optional(),
  seriesNumber: z.coerce.number().int().positive("Series number must be positive").optional(),
  carBrand: z.string().min(1, "Car brand is required").optional(),
  capacity: z.coerce.number().int().positive("Capacity must be positive").optional(),
  status: z.string().min(1, "Status is required").optional(),
  chassisNumber: z.string().min(1, "Chassis number is required").optional(),
  insuranceExpiry: z.coerce.date().optional(),
  registrationDate: z.coerce.date().optional(),
  inspectionExpiry: z.coerce.date().optional(),
  routeId: z.coerce.number().int().positive("Route ID must be positive").nullable().optional(),
});

export const vehicleQuerySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  routeId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreateVehicleDtoInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleDtoInput = z.infer<typeof updateVehicleSchema>;
export type VehicleQueryInput = z.infer<typeof vehicleQuerySchema>;
