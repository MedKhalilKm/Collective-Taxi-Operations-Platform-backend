export interface CreateEntrancePayload {
  vehicleId: number;
  stationId: number;
  driverId: string;
  status?: "ready" | "pending" | "waiting";
}

export interface UpdateEntrancePayload {
  vehicleId?: number;
  stationId?: number;
  driverId?: string;
  status?: "ready" | "pending" | "waiting";
}

export interface EntranceQueryFilters {
  search?: string;
  vehicleId?: number;
  stationId?: number;
  driverId?: string;
  status?: "ready" | "pending" | "waiting";
  page?: number;
  limit?: number;
}
