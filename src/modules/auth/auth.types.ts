import { Role } from "@prisma/client";

export interface LoginPayload {
  email?: string;
  username?: string;
  password: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordPayload {
  email: string;
  redirectTo?: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface AuthUserResponse {
  id: string;
  email: string;
  username: string;
  name: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: Role | string;
  status: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginResult {
  user: AuthUserResponse;
  sessionToken?: string;
  headers?: Headers;
}
