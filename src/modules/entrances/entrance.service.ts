import { Prisma } from "@prisma/client";
import { PaginatedMeta } from "@/types/api.types";
import { EntranceDto, EntranceResponseDto } from "./entrance.dto";
import { EntranceRepository } from "./entrance.repository";
import { CreateEntrancePayload, EntranceQueryFilters, UpdateEntrancePayload } from "./entrance.types";

export class EntranceService {
  private entranceRepository: EntranceRepository;

  constructor() {
    this.entranceRepository = new EntranceRepository();
  }

  async getEntrances(filters: EntranceQueryFilters): Promise<{ entrances: EntranceResponseDto[]; meta: PaginatedMeta }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;

    const { entrances, total } = await this.entranceRepository.findMany(filters);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      entrances: EntranceDto.toResponseList(entrances),
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async getEntranceById(id: number): Promise<EntranceResponseDto> {
    const entrance = await this.entranceRepository.findById(id);

    if (!entrance) {
      throw new Error("ENTRANCE_NOT_FOUND");
    }

    return EntranceDto.toResponse(entrance);
  }

  async createEntrance(payload: CreateEntrancePayload): Promise<EntranceResponseDto> {
    try {
      const entrance = await this.entranceRepository.create(payload);
      return EntranceDto.toResponse(entrance);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async updateEntrance(id: number, payload: UpdateEntrancePayload): Promise<EntranceResponseDto> {
    try {
      const entrance = await this.entranceRepository.update(id, payload);
      return EntranceDto.toResponse(entrance);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async deleteEntrance(id: number): Promise<void> {
    try {
      await this.entranceRepository.delete(id);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  private handlePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw new Error("ENTRANCE_OR_FOREIGN_KEY_NOT_FOUND");
      }

      if (error.code === "P2003") {
        throw new Error("ENTRANCE_FOREIGN_KEY_NOT_FOUND");
      }
    }

    throw error;
  }
}
