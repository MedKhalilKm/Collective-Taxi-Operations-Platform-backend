import { prisma } from "@/lib/prisma";
import { Prisma, User } from "@prisma/client";
import { randomUUID } from "crypto";

const PASSWORD_RESET_PREFIX = "reset-password:";
const userInclude = { station: true } satisfies Prisma.UserInclude;
export type AuthUser = Prisma.UserGetPayload<{ include: typeof userInclude }>;

export class AuthRepository {
  async findUserByEmail(email: string): Promise<AuthUser | null> {
    return prisma.user.findFirst({
      where: { email: { equals: email.trim(), mode: "insensitive" } }, include: userInclude,
    });
  }

  async findUserByUsername(username: string): Promise<AuthUser | null> {
    return prisma.user.findUnique({
      where: { username }, include: userInclude,
    });
  }

  async findUserById(id: string): Promise<AuthUser | null> {
    return prisma.user.findUnique({
      where: { id }, include: userInclude,
    });
  }

  async normalizeUserEmail(userId: string, email: string): Promise<AuthUser> {
    const normalizedEmail = email.trim().toLowerCase();
    return prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { email: normalizedEmail } });
      await tx.account.updateMany({
        where: { userId, providerId: "credential" },
        data: { accountId: normalizedEmail },
      });
      return tx.user.findUniqueOrThrow({ where: { id: userId }, include: userInclude });
    });
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<User> {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { passwd: hashedPassword },
      });

      await tx.account.updateMany({
        where: { userId },
        data: { password: hashedPassword },
      });

      return user;
    });
  }

  async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await prisma.verification.create({
      data: {
        id: randomUUID(),
        identifier: `${PASSWORD_RESET_PREFIX}${token}`,
        value: userId,
        expiresAt,
      },
    });
  }

  async consumePasswordResetToken(token: string): Promise<string | null> {
    const identifier = `${PASSWORD_RESET_PREFIX}${token}`;

    return prisma.$transaction(async (tx) => {
      const verification = await tx.verification.findFirst({
        where: { identifier },
      });

      if (!verification) {
        return null;
      }

      await tx.verification.delete({
        where: { id: verification.id },
      });

      if (verification.expiresAt < new Date()) {
        return null;
      }

      return verification.value;
    });
  }
}
