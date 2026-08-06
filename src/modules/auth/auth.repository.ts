import { prisma } from "@/lib/prisma";
import { User } from "@prisma/client";
import { randomUUID } from "crypto";

const PASSWORD_RESET_PREFIX = "reset-password:";

export class AuthRepository {
  async findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findUserByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { username },
    });
  }

  async findUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
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
