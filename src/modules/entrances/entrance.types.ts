export interface CreateEntrancePayload {
  vehicleId: number;
  stationId: number;
  driverId: string;
  status?: "ready" | "pending" | "waiting" | "departed";
}

export interface UpdateEntrancePayload {
  vehicleId?: number;
  stationId?: number;
  driverId?: string;
  status?: "ready" | "pending" | "waiting" | "departed";
}

export interface EntranceQueryFilters {
  search?: string;
  vehicleId?: number;
  stationId?: number;
  driverId?: string;
  status?: "ready" | "pending" | "waiting" | "departed";
  page?: number;
  limit?: number;
}
