import { User } from "@prisma/client";
import { AuthUserResponse } from "./auth.types";
import { AuthUser } from "./auth.repository";

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
      role: user.role,
      stationId: user.stationId,
      station: "station" in user ? user.station : null,
      status: user.status,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
