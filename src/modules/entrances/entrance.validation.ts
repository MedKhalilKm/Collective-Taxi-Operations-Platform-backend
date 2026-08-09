import { z } from "zod";

export const createEntranceSchema = z.object({
  vehicleId: z.coerce.number().int().positive("Vehicle ID must be positive"),
  stationId: z.coerce.number().int().positive("Station ID must be positive"),
  driverId: z.string().min(1, "Driver ID is required"),
});

export const updateEntranceSchema = z.object({
  vehicleId: z.coerce.number().int().positive("Vehicle ID must be positive").optional(),
  stationId: z.coerce.number().int().positive("Station ID must be positive").optional(),
  driverId: z.string().min(1, "Driver ID is required").optional(),
});

export const entranceQuerySchema = z.object({
  search: z.string().optional(),
  vehicleId: z.coerce.number().int().positive().optional(),
  stationId: z.coerce.number().int().positive().optional(),
  driverId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreateEntranceDtoInput = z.infer<typeof createEntranceSchema>;
export type UpdateEntranceDtoInput = z.infer<typeof updateEntranceSchema>;
export type EntranceQueryInput = z.infer<typeof entranceQuerySchema>;
