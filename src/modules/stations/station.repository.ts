import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { CreateStationPayload, StationQueryFilters, UpdateStationPayload } from "./station.types";

const stationInclude = {
  routes: true,
} satisfies Prisma.StationInclude;

type StationWithRoutes = Prisma.StationGetPayload<{ include: typeof stationInclude }>;

export class StationRepository {
  async findMany(filters: StationQueryFilters): Promise<{ stations: StationWithRoutes[]; total: number }> {
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

  async findById(id: number): Promise<StationWithRoutes | null> {
    return prisma.station.findUnique({
      where: { id },
      include: stationInclude,
    });
  }

  async create(data: CreateStationPayload): Promise<StationWithRoutes> {
    const { routeIds, altitude, longitude, ...stationData } = data;
    return prisma.station.create({
      data: {
        ...stationData,
        longitude: longitude ?? altitude ?? 0,
        routes: routeIds?.length
          ? {
              connect: routeIds.map((routeId) => ({ id: routeId })),
            }
          : undefined,
      },
      include: stationInclude,
    });
  }

  async update(id: number, data: UpdateStationPayload): Promise<StationWithRoutes> {
    const { routeIds, altitude, longitude, ...stationData } = data;
    return prisma.station.update({
      where: { id },
      data: {
        ...stationData,
        ...(longitude !== undefined || altitude !== undefined
          ? { longitude: longitude ?? altitude ?? 0 }
          : {}),
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
