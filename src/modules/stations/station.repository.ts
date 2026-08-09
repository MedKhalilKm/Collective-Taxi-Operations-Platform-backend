import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { CreateStationPayload, StationQueryFilters, UpdateStationPayload } from "./station.types";

const stationInclude = {
  routes: true,
} satisfies Prisma.StationInclude;

export class StationRepository {
  async findMany(filters: StationQueryFilters) {
    const { search, governorate, city, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.StationWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { governorate: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }

    if (governorate) {
      where.governorate = { contains: governorate, mode: "insensitive" };
    }

    if (city) {
      where.city = { contains: city, mode: "insensitive" };
    }

    const [stations, total] = await Promise.all([
      prisma.station.findMany({
        where,
        include: stationInclude,
        skip,
        take: limit,
        orderBy: { id: "desc" },
      }),
      prisma.station.count({ where }),
    ]);

    return { stations, total };
  }

  async findById(id: number) {
    return prisma.station.findUnique({
      where: { id },
      include: stationInclude,
    });
  }

  async create(data: CreateStationPayload) {
    const { routeIds, ...stationData } = data;
    return prisma.station.create({
      data: {
        ...stationData,
        routes: routeIds?.length
          ? {
              connect: routeIds.map((routeId) => ({ id: routeId })),
            }
          : undefined,
      },
      include: stationInclude,
    });
  }

  async update(id: number, data: UpdateStationPayload) {
    const { routeIds, ...stationData } = data;
    return prisma.station.update({
      where: { id },
      data: {
        ...stationData,
        ...(routeIds
          ? {
              routes: {
                set: routeIds.map((routeId) => ({ id: routeId })),
              },
            }
          : {}),
      },
      include: stationInclude,
    });
  }

  async delete(id: number) {
    return prisma.station.delete({
      where: { id },
    });
  }
}
