import { Route, Station } from "@prisma/client";

type RouteWithStations = Route & { stations: Station[] };

export interface RouteResponseDto {
  id: number;
  name: string;
  routeNumber: number;
  firstDestination: string;
  secondDestination: string;
  fee: number;
  altitude: number | null;
  description: string;
  stationIds: number[];
  stations: Station[];
}

export class RouteDto {
  static toResponse(route: RouteWithStations): RouteResponseDto {
    return {
      id: route.id,
      name: route.name,
      routeNumber: route.routeNumber,
      firstDestination: route.firstDestination,
      secondDestination: route.secondDestination,
      fee: route.fee,
      altitude: route.altitude,
      description: route.description,
      stationIds: route.stations.map((station) => station.id),
      stations: route.stations,
    };
  }

  static toResponseList(routes: RouteWithStations[]): RouteResponseDto[] {
    return routes.map((route) => this.toResponse(route));
  }
}
