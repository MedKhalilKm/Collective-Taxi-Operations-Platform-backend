export interface CreateEntrancePayload {
  vehicleId: number;
  stationId: number;
  driverId: string;
}

export interface UpdateEntrancePayload {
  vehicleId?: number;
  stationId?: number;
  driverId?: string;
}

export interface EntranceQueryFilters {
  search?: string;
  vehicleId?: number;
  stationId?: number;
  driverId?: string;
  page?: number;
  limit?: number;
}
