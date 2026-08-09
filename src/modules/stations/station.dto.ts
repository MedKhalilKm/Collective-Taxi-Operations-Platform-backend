import { Route, Station } from "@prisma/client";

type StationWithRoutes = Station & { routes: Route[] };

export interface StationResponseDto {
  id: number;
  name: string;
  governorate: string;
  city: string;
  latitude: number;
  altitude: number;
  creationDate: Date;
  gpsRadius: number;
  routeIds: number[];
  routes: Route[];
}

export class StationDto {
  static toResponse(station: StationWithRoutes): StationResponseDto {
    return {
      id: station.id,
      name: station.name,
      governorate: station.governorate,
      city: station.city,
      latitude: station.latitude,
      altitude: station.altitude,
      creationDate: station.creationDate,
      gpsRadius: station.gpsRadius,
      routeIds: station.routes.map((route) => route.id),
      routes: station.routes,
    };
  }

  static toResponseList(stations: StationWithRoutes[]): StationResponseDto[] {
    return stations.map((station) => this.toResponse(station));
  }
}
