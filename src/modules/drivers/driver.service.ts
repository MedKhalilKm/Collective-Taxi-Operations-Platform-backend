import { Prisma } from "@prisma/client";
import { PaginatedMeta } from "@/types/api.types";
import { DriverDto, DriverResponseDto } from "./driver.dto";
import { DriverRepository } from "./driver.repository";
import { CreateDriverPayload, DriverQueryFilters, UpdateDriverPayload } from "./driver.types";

export class DriverService {
  private driverRepository: DriverRepository;

  constructor() {
    this.driverRepository = new DriverRepository();
  }

  async getDrivers(filters: DriverQueryFilters): Promise<{ drivers: DriverResponseDto[]; meta: PaginatedMeta }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;

    const { drivers, total } = await this.driverRepository.findMany(filters);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      drivers: DriverDto.toResponseList(drivers),
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async getDriverById(id: string): Promise<DriverResponseDto> {
    const driver = await this.driverRepository.findById(id);

    if (!driver) {
      throw new Error("DRIVER_NOT_FOUND");
    }

    return DriverDto.toResponse(driver);
  }

  async getDriverByProfessionalIdCard(professionalIdCard: string): Promise<DriverResponseDto> {
    const driver = await this.driverRepository.findByProfessionalIdCard(professionalIdCard);

    if (!driver) {
      throw new Error("DRIVER_NOT_FOUND");
    }

    return DriverDto.toResponse(driver);
  }

  async getDriverByDrivingLicence(drivingLicence: number): Promise<DriverResponseDto> {
    const driver = await this.driverRepository.findByDrivingLicence(drivingLicence);

    if (!driver) {
      throw new Error("DRIVER_NOT_FOUND");
    }

    return DriverDto.toResponse(driver);
  }

  async createDriver(payload: CreateDriverPayload): Promise<DriverResponseDto> {
    try {
      const driver = await this.driverRepository.create(payload);
      return DriverDto.toResponse(driver);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async updateDriver(id: string, payload: UpdateDriverPayload): Promise<DriverResponseDto> {
    try {
      const driver = await this.driverRepository.update(id, payload);
      return DriverDto.toResponse(driver);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  private handlePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw new Error("DRIVER_OR_USER_NOT_FOUND");
      }

      if (error.code === "P2002") {
        const target = Array.isArray(error.meta?.target) ? error.meta.target.join(",") : "";

        if (target.includes("cin")) {
          throw new Error("CIN_ALREADY_EXISTS");
        }

        if (target.includes("professionalIdCard")) {
          throw new Error("PROFESSIONAL_ID_CARD_ALREADY_EXISTS");
        }

        throw new Error("DRIVER_ALREADY_EXISTS");
      }
    }

    throw error;
  }
}
