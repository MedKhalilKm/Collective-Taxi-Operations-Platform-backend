import { z } from "zod";

export const createStationSchema = z.object({
  name: z.string().min(1, "Station name is required"),
  governorate: z.string().min(1, "Governorate is required"),
  city: z.string().min(1, "City is required"),
  latitude: z.coerce.number(),
  altitude: z.coerce.number(),
  gpsRadius: z.coerce.number().positive("GPS radius must be positive"),
  routeIds: z.array(z.coerce.number().int().positive("Route ID must be positive")).optional(),
});

export const updateStationSchema = z.object({
  name: z.string().min(1, "Station name is required").optional(),
  governorate: z.string().min(1, "Governorate is required").optional(),
  city: z.string().min(1, "City is required").optional(),
  latitude: z.coerce.number().optional(),
  altitude: z.coerce.number().optional(),
  gpsRadius: z.coerce.number().positive("GPS radius must be positive").optional(),
  routeIds: z.array(z.coerce.number().int().positive("Route ID must be positive")).optional(),
});

export const stationQuerySchema = z.object({
  search: z.string().optional(),
  governorate: z.string().optional(),
  city: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreateStationDtoInput = z.infer<typeof createStationSchema>;
export type UpdateStationDtoInput = z.infer<typeof updateStationSchema>;
export type StationQueryInput = z.infer<typeof stationQuerySchema>;
