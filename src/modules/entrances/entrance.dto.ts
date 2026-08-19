import { Driver, Entrance, Station, Vehicle } from "@prisma/client";

type EntranceWithRelations = Entrance & {
  vehicle: Vehicle;
  station: Station;
  driver: Driver;
};

export interface EntranceResponseDto {
  id: number;
  createdAt: Date;
  status: "ready" | "pending" | "waiting" | "departed";
  vehicleId: number;
  stationId: number;
  driverId: string;
  vehicle: Vehicle;
  station: Station;
  driver: Driver;
}

export class EntranceDto {
  static toResponse(entrance: EntranceWithRelations): EntranceResponseDto {
    return {
      id: entrance.id,
      createdAt: entrance.createdAt,
      status: entrance.status,
      vehicleId: entrance.vehicleId,
      stationId: entrance.stationId,
      driverId: entrance.driverId,
      vehicle: entrance.vehicle,
      station: entrance.station,
      driver: entrance.driver,
    };
  }

  static toResponseList(entrances: EntranceWithRelations[]): EntranceResponseDto[] {
    return entrances.map((entrance) => this.toResponse(entrance));
  }
}
