import { Route, Vehicle } from "@prisma/client";

type VehicleWithRoute = Vehicle & { route: Route | null };

export interface VehicleResponseDto {
  id: number;
  registrationNumber: number;
  seriesNumber: number;
  carBrand: string;
  capacity: number;
  status: string;
  chassisNumber: string;
  insuranceExpiry: Date;
  registrationDate: Date;
  inspectionExpiry: Date;
  routeId: number | null;
  route: Route | null;
}

export class VehicleDto {
  static toResponse(vehicle: VehicleWithRoute): VehicleResponseDto {
    return {
      id: vehicle.id,
      registrationNumber: vehicle.registrationNumber,
      seriesNumber: vehicle.seriesNumber,
      carBrand: vehicle.carBrand,
      capacity: vehicle.capacity,
      status: vehicle.status,
      chassisNumber: vehicle.chassisNumber,
      insuranceExpiry: vehicle.insuranceExpiry,
      registrationDate: vehicle.registrationDate,
      inspectionExpiry: vehicle.inspectionExpiry,
      routeId: vehicle.routeId,
      route: vehicle.route,
    };
  }

  static toResponseList(vehicles: VehicleWithRoute[]): VehicleResponseDto[] {
    return vehicles.map((vehicle) => this.toResponse(vehicle));
  }
}
