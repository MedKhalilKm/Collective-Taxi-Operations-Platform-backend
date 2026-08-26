import { Prisma, User } from "@prisma/client";

type UserWithStation = Prisma.UserGetPayload<{ include: { station: true } }>;

export interface UserResponseDto {
  id: string;
  name: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  stationId: number | null;
  role: string;
  status: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class UserDto {
  static toResponse(user: User | UserWithStation): UserResponseDto & { station?: UserWithStation["station"] } {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      stationId: user.stationId,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      ...( "station" in user ? { station: user.station } : {}),
    };
  }

  static toResponseList(users: User[]): UserResponseDto[] {
    return users.map((user) => this.toResponse(user));
  }
}
