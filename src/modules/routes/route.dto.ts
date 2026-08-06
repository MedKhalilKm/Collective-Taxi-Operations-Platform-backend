import { Route, Station } from "@prisma/client";

type RouteWithStation = Route & { station: Station };

export interface RouteResponseDto {
  id: number;
  name: string;
  routeNumber: number;
  firstDestination: string;
  secondDestination: string;
  fee: number;
  altitude: number;
  description: string;
  stationId: number;
  station: Station;
}

export class RouteDto {
  static toResponse(route: RouteWithStation): RouteResponseDto {
    return {
      id: route.id,
      name: route.name,
      routeNumber: route.routeNumber,
      firstDestination: route.firstDestination,
      secondDestination: route.secondDestination,
      fee: route.fee,
      altitude: route.altitude,
      description: route.description,
      stationId: route.stationId,
      station: route.station,
    };
  }

  static toResponseList(routes: RouteWithStation[]): RouteResponseDto[] {
    return routes.map((route) => this.toResponse(route));
  }
}
