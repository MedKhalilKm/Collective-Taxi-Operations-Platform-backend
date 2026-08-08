export interface CreateRoutePayload {
  name: string;
  routeNumber: number;
  firstDestination: string;
  secondDestination: string;
  fee: number;
  altitude: number;
  description: string;
  stationIds?: number[];
}

export interface UpdateRoutePayload {
  name?: string;
  routeNumber?: number;
  firstDestination?: string;
  secondDestination?: string;
  fee?: number;
  altitude?: number;
  description?: string;
  stationIds?: number[];
}

export interface RouteQueryFilters {
  search?: string;
  stationId?: number;
  page?: number;
  limit?: number;
}
