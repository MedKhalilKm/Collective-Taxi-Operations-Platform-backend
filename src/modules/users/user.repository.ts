import { prisma } from "@/lib/prisma";
import { User, Role, Prisma } from "@prisma/client";
import { UserQueryFilters } from "./user.types";
import { normalizeRole } from "@/middleware/role.middleware";
import { randomUUID } from "crypto";

export class UserRepository {
  async findMany(filters: UserQueryFilters): Promise<{ users: User[]; total: number }> {
    const { search, role, status, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { phoneNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role) {
      where.role = normalizeRole(role);
    }

    if (status) {
      where.status = status;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { email: { equals: email.trim(), mode: "insensitive" } },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { username },
    });
  }

  async create(data: {
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    hashedPassword: string;
    role: Role;
    status: string;
    stationId?: number | null;
  }): Promise<User> {
    const userId = randomUUID();
    const now = new Date();
    const fullName = `${data.firstName} ${data.lastName}`.trim();

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          id: userId,
          email: data.email,
          username: data.username,
          name: fullName,
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber,
          stationId: data.stationId ?? null,
          passwd: data.hashedPassword,
          role: data.role,
          status: data.status,
          emailVerified: false,
          createdAt: now,
          updatedAt: now,
        },
      });

      // Create Better Auth Account entry for credential login
      await tx.account.create({
        data: {
          id: randomUUID(),
          userId: user.id,
          accountId: data.email,
          providerId: "credential",
          password: data.hashedPassword,
          createdAt: now,
          updatedAt: now,
        },
      });

      return user;
    });
  }

  async update(
    id: string,
    data: {
      email?: string;
      username?: string;
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
      role?: Role;
      status?: string;
      hashedPassword?: string;
      stationId?: number | null;
    }
  ): Promise<User> {
    return prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({ where: { id } });
      if (!existingUser) {
        throw new Error("USER_NOT_FOUND");
      }

      const updateData: Prisma.UserUpdateInput = {};
      if (data.email) updateData.email = data.email;
      if (data.username) updateData.username = data.username;
      if (data.firstName) updateData.firstName = data.firstName;
      if (data.lastName) updateData.lastName = data.lastName;
      if (data.phoneNumber) updateData.phoneNumber = data.phoneNumber;
      if (data.role) updateData.role = data.role;
      if (data.status) updateData.status = data.status;
      if (data.hashedPassword) updateData.passwd = data.hashedPassword;
      if (data.stationId !== undefined) {
        updateData.station = data.stationId
          ? {
              connect: { id: data.stationId },
            }
          : {
              disconnect: true,
            };
      }

      const newFirstName = data.firstName ?? existingUser.firstName;
      const newLastName = data.lastName ?? existingUser.lastName;
      updateData.name = `${newFirstName} ${newLastName}`.trim();

      const updatedUser = await tx.user.update({
        where: { id },
        data: updateData,
      });

      if (data.hashedPassword || data.email) {
        const accountUpdate: Prisma.AccountUpdateManyMutationInput = {};
        if (data.hashedPassword) accountUpdate.password = data.hashedPassword;
        if (data.email) accountUpdate.accountId = data.email;

        await tx.account.updateMany({
          where: { userId: id },
          data: accountUpdate,
        });
      }

      return updatedUser;
    });
  }

  async delete(id: string): Promise<User> {
    return prisma.user.delete({
      where: { id },
    });
  }
}
