import { Role } from "@prisma/client";

export interface CreateUserPayload {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  password: string;
  role: Role | string;
  status?: string;
  stationId?: number | null;
}

export interface UpdateUserPayload {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role?: Role | string;
  status?: string;
  password?: string;
  stationId?: number | null;
}

export interface UserQueryFilters {
  search?: string;
  role?: Role | string;
  status?: string;
  page?: number;
  limit?: number;
}
