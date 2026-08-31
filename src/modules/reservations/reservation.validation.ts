import { z } from "zod";

export const createReservationSchema = z.object({
  numberOfSeats: z.coerce.number().int().positive("Number of seats must be positive"),
  entranceId: z.coerce.number().int().positive("Entrance ID must be positive"),
  userId: z.string().min(1, "User ID is required").optional().nullable(),
});

export const updateReservationSchema = z.object({
  numberOfSeats: z.coerce.number().int().positive("Number of seats must be positive").optional(),
  entranceId: z.coerce.number().int().positive("Entrance ID must be positive").optional(),
  userId: z.string().min(1, "User ID is required").optional().nullable(),
});

export const cancelReservationSeatsSchema = z
  .object({
    seatRefIds: z.array(z.coerce.number().int().positive("Seat ref ID must be positive")).optional(),
    reservationRefs: z.array(z.string().min(1, "Reservation ref is required")).optional(),
  })
  .refine(
    (data) => Boolean(data.seatRefIds?.length || data.reservationRefs?.length),
    "At least one seat ref ID or reservation ref is required"
  );

export const reservationQuerySchema = z.object({
  search: z.string().optional(),
  entranceId: z.coerce.number().int().positive().optional(),
  userId: z.string().optional(),
  reservationRef: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreateReservationDtoInput = z.infer<typeof createReservationSchema>;
export type UpdateReservationDtoInput = z.infer<typeof updateReservationSchema>;
export type CancelReservationSeatsInput = z.infer<typeof cancelReservationSeatsSchema>;
export type ReservationQueryInput = z.infer<typeof reservationQuerySchema>;
