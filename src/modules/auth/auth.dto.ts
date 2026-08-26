import { User } from "@prisma/client";
import { AuthUserResponse } from "./auth.types";
import { AuthUser } from "./auth.repository";
import { normalizeRole, normalizeStatus } from "@/middleware/role.middleware";

export class AuthDto {
  static toUserResponse(user: User | AuthUser): AuthUserResponse {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      role: normalizeRole(user.role),
      stationId: user.stationId,
      station: "station" in user ? user.station : null,
      status: normalizeStatus(user.status),
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
