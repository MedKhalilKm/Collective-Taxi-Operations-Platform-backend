import { z } from "zod";

export const createRouteSchema = z
  .object({
    name: z.string().min(1, "Route name is required"),
    routeNumber: z.coerce.number().int("Route number must be an integer"),
    firstDestination: z.string().min(1, "First destination is required"),
    secondDestination: z.string().min(1, "Second destination is required"),
    fee: z.coerce.number().positive("Fee must be positive"),
    altitude: z.coerce.number(),
    description: z.string().min(1, "Description is required"),
    stationId: z.coerce.number().int().positive("Station ID is required"),
  })
  .refine((data) => data.firstDestination !== data.secondDestination, {
    message: "Second destination must be different from first destination",
    path: ["secondDestination"],
  });

export const updateRouteSchema = z
  .object({
    name: z.string().min(1, "Route name is required").optional(),
    routeNumber: z.coerce.number().int("Route number must be an integer").optional(),
    firstDestination: z.string().min(1, "First destination is required").optional(),
    secondDestination: z.string().min(1, "Second destination is required").optional(),
    fee: z.coerce.number().positive("Fee must be positive").optional(),
    altitude: z.coerce.number().optional(),
    description: z.string().min(1, "Description is required").optional(),
    stationId: z.coerce.number().int().positive("Station ID is required").optional(),
  })
  .refine(
    (data) =>
      !data.firstDestination ||
      !data.secondDestination ||
      data.firstDestination !== data.secondDestination,
    {
      message: "Second destination must be different from first destination",
      path: ["secondDestination"],
    }
  );

export const routeQuerySchema = z.object({
  search: z.string().optional(),
  stationId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreateRouteDtoInput = z.infer<typeof createRouteSchema>;
export type UpdateRouteDtoInput = z.infer<typeof updateRouteSchema>;
export type RouteQueryInput = z.infer<typeof routeQuerySchema>;
