import { prisma } from "@/lib/prisma";
import { Prisma, Role } from "@prisma/client";
import { CreateDriverPayload, DriverQueryFilters, UpdateDriverPayload } from "./driver.types";
import { hashPassword } from "@/lib/auth";
import { randomUUID } from "crypto";

const driverInclude = {
  user: true,
} satisfies Prisma.DriverInclude;

export class DriverRepository {
  async findMany(filters: DriverQueryFilters) {
    const { search, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.DriverWhereInput = {};

    if (search) {
      const numericSearch = Number(search);
      const numericFilters = Number.isNaN(numericSearch)
        ? []
        : [
            { cin: numericSearch },
            { drivingLicence: numericSearch },
          ];

      where.OR = [
        { professionalIdCard: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { user: { username: { contains: search, mode: "insensitive" } } },
        ...numericFilters,
      ];
    }

    const [drivers, total] = await Promise.all([
      prisma.driver.findMany({
        where,
        include: driverInclude,
        skip,
        take: limit,
        orderBy: {
          user: {
            createdAt: "desc",
          },
        },
      }),
      prisma.driver.count({ where }),
    ]);

    return { drivers, total };
  }

  async findById(id: string) {
    return prisma.driver.findUnique({
      where: { id },
      include: driverInclude,
    });
  }

  async findByProfessionalIdCard(professionalIdCard: string) {
    return prisma.driver.findUnique({
      where: { professionalIdCard },
      include: driverInclude,
    });
  }

  async findByDrivingLicence(drivingLicence: number) {
    return prisma.driver.findFirst({
      where: { drivingLicence },
      include: driverInclude,
    });
  }

  async findByCin(cin: number) {
    return prisma.driver.findUnique({
      where: { cin },
      include: driverInclude,
    });
  }

  async create(data: CreateDriverPayload) {
    return prisma.$transaction(async (tx) => {
      const hashedPassword = await hashPassword(data.password);
      const now = new Date();
      const userId = randomUUID();
      const fullName = `${data.firstName} ${data.lastName}`.trim();

      const user = await tx.user.create({
        data: {
          id: userId,
          email: data.email,
          username: data.username,
          name: fullName,
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber,
          passwd: hashedPassword,
          role: Role.Driver,
          status: data.status || "active",
          emailVerified: false,
          createdAt: now,
          updatedAt: now,
        },
      });

      await tx.account.create({
        data: {
          id: randomUUID(),
          userId: user.id,
          accountId: data.email,
          providerId: "credential",
          password: hashedPassword,
          createdAt: now,
          updatedAt: now,
        },
      });

      return tx.driver.create({
        data: {
          id: user.id,
          cin: data.cin,
          professionalIdCard: data.professionalIdCard,
          professionalCardExpiry: data.professionalCardExpiry,
          drivingLicence: data.drivingLicence,
          drivingLicenceExpiry: data.drivingLicenceExpiry,
        },
        include: driverInclude,
      });
    });
  }

  async update(id: string, data: UpdateDriverPayload) {
    return prisma.driver.update({
      where: { id },
      data,
      include: driverInclude,
    });
  }
}
