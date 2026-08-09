export interface CreateStationPayload {
  name: string;
  governorate: string;
  city: string;
  latitude: number;
  longitude?: number;
  altitude?: number;
  gpsRadius: number;
  routeIds?: number[];
}

export interface UpdateStationPayload {
  name?: string;
  governorate?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  gpsRadius?: number;
  routeIds?: number[];
}

export interface StationQueryFilters {
  search?: string;
  governorate?: string;
  city?: string;
  page?: number;
  limit?: number;
}
