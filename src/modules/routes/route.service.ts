import { Prisma } from "@prisma/client";
import { PaginatedMeta } from "@/types/api.types";
import { RouteDto, RouteResponseDto } from "./route.dto";
import { RouteRepository } from "./route.repository";
import { CreateRoutePayload, RouteQueryFilters, UpdateRoutePayload } from "./route.types";

export class RouteService {
  private routeRepository: RouteRepository;

  constructor() {
    this.routeRepository = new RouteRepository();
  }

  async getRoutes(filters: RouteQueryFilters): Promise<{ routes: RouteResponseDto[]; meta: PaginatedMeta }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;

    const { routes, total } = await this.routeRepository.findMany(filters);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      routes: RouteDto.toResponseList(routes),
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async getRouteById(id: number): Promise<RouteResponseDto> {
    const route = await this.routeRepository.findById(id);

    if (!route) {
      throw new Error("ROUTE_NOT_FOUND");
    }

    return RouteDto.toResponse(route);
  }

  async createRoute(payload: CreateRoutePayload): Promise<RouteResponseDto> {
    try {
      const route = await this.routeRepository.create(payload);
      return RouteDto.toResponse(route);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async updateRoute(id: number, payload: UpdateRoutePayload): Promise<RouteResponseDto> {
    try {
      const route = await this.routeRepository.update(id, payload);
      return RouteDto.toResponse(route);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async deleteRoute(id: number): Promise<void> {
    try {
      await this.routeRepository.delete(id);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  private handlePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw new Error("ROUTE_OR_STATION_NOT_FOUND");
      }

      if (error.code === "P2002") {
        throw new Error("ROUTE_ALREADY_EXISTS");
      }
    }

    throw error;
  }
}
