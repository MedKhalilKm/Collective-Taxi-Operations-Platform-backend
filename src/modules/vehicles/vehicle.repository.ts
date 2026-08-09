import { prisma } from "@/lib/prisma";
import { Prisma, Vehicle } from "@prisma/client";
import { CreateVehiclePayload, VehicleQueryFilters, UpdateVehiclePayload } from "./vehicle.types";

const vehicleInclude = {
  route: true,
} satisfies Prisma.VehicleInclude;

type VehicleWithRoute = Prisma.VehicleGetPayload<{ include: typeof vehicleInclude }>;

export class VehicleRepository {
  async findMany(filters: VehicleQueryFilters): Promise<{ vehicles: VehicleWithRoute[]; total: number }> {
    const { search, status, routeId, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.VehicleWhereInput = {};

    if (search) {
      const numericSearch = Number(search);
      where.OR = [
        { carBrand: { contains: search, mode: "insensitive" } },
        { chassisNumber: { contains: search, mode: "insensitive" } },
        ...(Number.isNaN(numericSearch)
          ? []
          : [
              { registrationNumber: numericSearch },
              { seriesNumber: numericSearch },
              { routeId: numericSearch },
            ]),
      ];
    }

    if (status) {
      where.status = { contains: status, mode: "insensitive" };
    }

    if (routeId) {
      where.routeId = routeId;
    }

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        include: vehicleInclude,
        skip,
        take: limit,
        orderBy: { id: "desc" },
      }),
      prisma.vehicle.count({ where }),
    ]);

    return { vehicles, total };
  }

  async findById(id: number): Promise<VehicleWithRoute | null> {
    return prisma.vehicle.findUnique({
      where: { id },
      include: vehicleInclude,
    });
  }

  async create(data: CreateVehiclePayload): Promise<VehicleWithRoute> {
    const { routeId, ...vehicleData } = data;
    return prisma.vehicle.create({
      data: {
        ...vehicleData,
        routeId,
      },
      include: vehicleInclude,
    });
  }

  async update(id: number, data: UpdateVehiclePayload): Promise<VehicleWithRoute> {
    const { routeId, ...vehicleData } = data;
    return prisma.vehicle.update({
      where: { id },
      data: {
        ...vehicleData,
        ...(routeId === null ? { routeId: null } : routeId !== undefined ? { routeId } : {}),
      },
      include: vehicleInclude,
    });
  }

  async delete(id: number): Promise<Vehicle> {
    return prisma.vehicle.delete({
      where: { id },
    });
  }
}
