import { AuthRepository } from "./auth.repository";
import { AuthDto } from "./auth.dto";
import {
  LoginPayload,
  ChangePasswordPayload,
  AuthUserResponse,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from "./auth.types";
import { verifyPassword, hashPassword, auth } from "@/lib/auth";
import { sendResetPasswordEmail } from "@/lib/email";
import { randomBytes } from "crypto";
import { isActiveStatus, normalizeRole } from "@/middleware/role.middleware";

export class AuthService {
  private authRepository: AuthRepository;

  constructor() {
    this.authRepository = new AuthRepository();
  }

  async login(payload: LoginPayload, requestHeaders: Headers): Promise<{ user: AuthUserResponse; responseHeaders: Headers }> {
    let user = null;

    if (payload.email) {
      user = await this.authRepository.findUserByEmail(payload.email);
    } else if (payload.username) {
      user = await this.authRepository.findUserByUsername(payload.username);
    }

    if (!user) {
      throw new Error("INVALID_CREDENTIALS");
    }

    if (!isActiveStatus(user.status)) {
      throw new Error("ACCOUNT_INACTIVE");
    }

    const isValidPassword = await verifyPassword({
      password: payload.password,
      hash: user.passwd,
    });

    if (!isValidPassword) {
      throw new Error("INVALID_CREDENTIALS");
    }

    // Better Auth normalizes email input before querying. Keep legacy mixed
    // case records compatible by canonicalizing them before its lookup.
    if (user.email !== user.email.trim().toLowerCase()) {
      user = await this.authRepository.normalizeUserEmail(user.id, user.email);
    }

    // Call Better Auth to produce session and cookies
    const authRes = await auth.api.signInEmail({
      body: {
        email: user.email,
        password: payload.password,
      },
      headers: requestHeaders,
      asResponse: true,
    });

    if (!authRes.ok) {
      const details = await authRes.clone().text().catch(() => "");
      console.error("Better Auth sign-in failed", {
        email: user.email,
        status: authRes.status,
        details,
      });
      throw new Error("AUTH_SESSION_CREATION_FAILED");
    }

    return {
      user: AuthDto.toUserResponse({ ...user, role: normalizeRole(user.role) }),
      responseHeaders: authRes.headers,
    };
  }

  async logout(requestHeaders: Headers): Promise<Headers> {
    const res = await auth.api.signOut({
      headers: requestHeaders,
      asResponse: true,
    });
    return res.headers;
  }

  async getMe(userId: string): Promise<AuthUserResponse> {
    const user = await this.authRepository.findUserById(userId);

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    return AuthDto.toUserResponse(user);
  }

  async changePassword(userId: string, payload: ChangePasswordPayload): Promise<void> {
    const user = await this.authRepository.findUserById(userId);

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const isCurrentValid = await verifyPassword({
      password: payload.currentPassword,
      hash: user.passwd,
    });

    if (!isCurrentValid) {
      throw new Error("INVALID_CURRENT_PASSWORD");
    }

    const newHashedPassword = await hashPassword(payload.newPassword);
    await this.authRepository.updateUserPassword(userId, newHashedPassword);
  }

  async forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
    const user = await this.authRepository.findUserByEmail(payload.email);

    if (!user || !isActiveStatus(user.status)) {
      return;
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await this.authRepository.createPasswordResetToken(user.id, token, expiresAt);

    const defaultResetUrl = `${this.getAppBaseUrl()}/reset-password`;
    const resetUrl = new URL(payload.redirectTo || defaultResetUrl);
    resetUrl.searchParams.set("token", token);

    await sendResetPasswordEmail({
      to: user.email,
      resetUrl: resetUrl.toString(),
    });
  }

  async resetPassword(payload: ResetPasswordPayload): Promise<void> {
    const userId = await this.authRepository.consumePasswordResetToken(payload.token);

    if (!userId) {
      throw new Error("INVALID_RESET_TOKEN");
    }

    const user = await this.authRepository.findUserById(userId);
    if (!user || !isActiveStatus(user.status)) {
      throw new Error("INVALID_RESET_TOKEN");
    }

    const newHashedPassword = await hashPassword(payload.newPassword);
    await this.authRepository.updateUserPassword(userId, newHashedPassword);
  }

  private getAppBaseUrl(): string {
    return (
      process.env.FRONTEND_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.BETTER_AUTH_URL ||
      "http://localhost:3000"
    );
  }
}
