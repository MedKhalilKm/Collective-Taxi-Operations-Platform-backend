import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { CreateRoutePayload, RouteQueryFilters, UpdateRoutePayload } from "./route.types";

const routeInclude = {
  station: true,
} satisfies Prisma.RouteInclude;

export class RouteRepository {
  async findMany(filters: RouteQueryFilters) {
    const { search, stationId, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.RouteWhereInput = {};

    if (search) {
      const numericSearch = Number(search);
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { firstDestination: { contains: search, mode: "insensitive" } },
        { secondDestination: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        ...(Number.isNaN(numericSearch)
          ? []
          : [{ routeNumber: numericSearch }, { stationId: numericSearch }]),
      ];
    }

    if (stationId) {
      where.stationId = stationId;
    }

    const [routes, total] = await Promise.all([
      prisma.route.findMany({
        where,
        include: routeInclude,
        skip,
        take: limit,
        orderBy: { id: "desc" },
      }),
      prisma.route.count({ where }),
    ]);

    return { routes, total };
  }

  async findById(id: number) {
    return prisma.route.findUnique({
      where: { id },
      include: routeInclude,
    });
  }

  async create(data: CreateRoutePayload) {
    return prisma.route.create({
      data,
      include: routeInclude,
    });
  }

  async update(id: number, data: UpdateRoutePayload) {
    return prisma.route.update({
      where: { id },
      data,
      include: routeInclude,
    });
  }

  async delete(id: number) {
    return prisma.route.delete({
      where: { id },
    });
  }
}
