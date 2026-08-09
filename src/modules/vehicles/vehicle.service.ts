import { Prisma } from "@prisma/client";
import { PaginatedMeta } from "@/types/api.types";
import { VehicleDto, VehicleResponseDto } from "./vehicle.dto";
import { VehicleRepository } from "./vehicle.repository";
import { CreateVehiclePayload, UpdateVehiclePayload, VehicleQueryFilters } from "./vehicle.types";

export class VehicleService {
  private vehicleRepository: VehicleRepository;

  constructor() {
    this.vehicleRepository = new VehicleRepository();
  }

  async getVehicles(filters: VehicleQueryFilters): Promise<{ vehicles: VehicleResponseDto[]; meta: PaginatedMeta }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;

    const { vehicles, total } = await this.vehicleRepository.findMany(filters);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      vehicles: VehicleDto.toResponseList(vehicles),
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async getVehicleById(id: number): Promise<VehicleResponseDto> {
    const vehicle = await this.vehicleRepository.findById(id);

    if (!vehicle) {
      throw new Error("VEHICLE_NOT_FOUND");
    }

    return VehicleDto.toResponse(vehicle);
  }

  async createVehicle(payload: CreateVehiclePayload): Promise<VehicleResponseDto> {
    try {
      const vehicle = await this.vehicleRepository.create(payload);
      return VehicleDto.toResponse(vehicle);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async updateVehicle(id: number, payload: UpdateVehiclePayload): Promise<VehicleResponseDto> {
    try {
      const vehicle = await this.vehicleRepository.update(id, payload);
      return VehicleDto.toResponse(vehicle);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async deleteVehicle(id: number): Promise<void> {
    try {
      await this.vehicleRepository.delete(id);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  private handlePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw new Error("VEHICLE_OR_ROUTE_NOT_FOUND");
      }

      if (error.code === "P2002") {
        if (error.meta?.target?.toString().includes("registrationNumber")) {
          throw new Error("REGISTRATION_NUMBER_ALREADY_EXISTS");
        }
        if (error.meta?.target?.toString().includes("chassisNumber")) {
          throw new Error("CHASSIS_NUMBER_ALREADY_EXISTS");
        }
        throw new Error("VEHICLE_ALREADY_EXISTS");
      }
    }

    throw error;
  }
}
