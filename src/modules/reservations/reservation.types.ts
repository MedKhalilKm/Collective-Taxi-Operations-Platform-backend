export interface CreateReservationPayload {
  numberOfSeats: number;
  entranceId: number;
  userId?: string | null;
}

export interface UpdateReservationPayload {
  numberOfSeats?: number;
  entranceId?: number;
  userId?: string | null;
}

export interface ReservationQueryFilters {
  search?: string;
  entranceId?: number;
  userId?: string;
  reservationRef?: string;
  page?: number;
  limit?: number;
  agentStationId?: number;
}
