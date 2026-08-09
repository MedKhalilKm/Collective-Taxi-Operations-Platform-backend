import { Prisma } from "@prisma/client";
import { PaginatedMeta } from "@/types/api.types";
import { StationDto, StationResponseDto } from "./station.dto";
import { StationRepository } from "./station.repository";
import { CreateStationPayload, StationQueryFilters, UpdateStationPayload } from "./station.types";

export class StationService {
  private stationRepository: StationRepository;

  constructor() {
    this.stationRepository = new StationRepository();
  }

  async getStations(filters: StationQueryFilters): Promise<{ stations: StationResponseDto[]; meta: PaginatedMeta }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;

    const { stations, total } = await this.stationRepository.findMany(filters);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      stations: StationDto.toResponseList(stations),
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async getStationById(id: number): Promise<StationResponseDto> {
    const station = await this.stationRepository.findById(id);

    if (!station) {
      throw new Error("STATION_NOT_FOUND");
    }

    return StationDto.toResponse(station);
  }

  async createStation(payload: CreateStationPayload): Promise<StationResponseDto> {
    try {
      const station = await this.stationRepository.create(payload);
      return StationDto.toResponse(station);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async updateStation(id: number, payload: UpdateStationPayload): Promise<StationResponseDto> {
    try {
      const station = await this.stationRepository.update(id, payload);
      return StationDto.toResponse(station);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async deleteStation(id: number): Promise<void> {
    try {
      await this.stationRepository.delete(id);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  private handlePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw new Error("STATION_OR_ROUTE_NOT_FOUND");
      }

      if (error.code === "P2002") {
        throw new Error("STATION_ALREADY_EXISTS");
      }
    }

    throw error;
  }
}
