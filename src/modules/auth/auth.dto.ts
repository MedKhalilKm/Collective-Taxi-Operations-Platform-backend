import { User } from "@prisma/client";
import { AuthUserResponse } from "./auth.types";

export class AuthDto {
  static toUserResponse(user: User): AuthUserResponse {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
