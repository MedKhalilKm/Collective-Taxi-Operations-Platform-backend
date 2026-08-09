import { prisma } from "@/lib/prisma";
import { Entrance, Prisma } from "@prisma/client";
import { CreateEntrancePayload, EntranceQueryFilters, UpdateEntrancePayload } from "./entrance.types";

const entranceInclude = {
  vehicle: true,
  station: true,
  driver: true,
} satisfies Prisma.EntranceInclude;

type EntranceWithRelations = Prisma.EntranceGetPayload<{ include: typeof entranceInclude }>;

export class EntranceRepository {
  async findMany(filters: EntranceQueryFilters): Promise<{ entrances: EntranceWithRelations[]; total: number }> {
    const { search, vehicleId, stationId, driverId, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.EntranceWhereInput = {};

    if (search) {
      const numericSearch = Number(search);
      where.OR = [
        { driver: { user: { name: { contains: search, mode: "insensitive" } } } },
        { driver: { user: { email: { contains: search, mode: "insensitive" } } } },
        { vehicle: { carBrand: { contains: search, mode: "insensitive" } } },
        { station: { name: { contains: search, mode: "insensitive" } } },
        ...(Number.isNaN(numericSearch)
          ? []
          : [{ vehicleId: numericSearch }, { stationId: numericSearch }, { id: numericSearch }]),
      ];
    }

    if (vehicleId) {
      where.vehicleId = vehicleId;
    }

    if (stationId) {
      where.stationId = stationId;
    }

    if (driverId) {
      where.driverId = driverId;
    }

    const [entrances, total] = await Promise.all([
      prisma.entrance.findMany({
        where,
        include: entranceInclude,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.entrance.count({ where }),
    ]);

    return { entrances, total };
  }

  async findById(id: number): Promise<EntranceWithRelations | null> {
    return prisma.entrance.findUnique({
      where: { id },
      include: entranceInclude,
    });
  }

  async create(data: CreateEntrancePayload): Promise<EntranceWithRelations> {
    return prisma.entrance.create({
      data,
      include: entranceInclude,
    });
  }

  async update(id: number, data: UpdateEntrancePayload): Promise<EntranceWithRelations> {
    return prisma.entrance.update({
      where: { id },
      data,
      include: entranceInclude,
    });
  }

  async delete(id: number): Promise<Entrance> {
    return prisma.entrance.delete({
      where: { id },
    });
  }
}
