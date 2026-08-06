import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "./auth.service";
import {
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.validation";
import { requireAuth } from "@/middleware/auth.middleware";
import { ApiResponse } from "@/types/api.types";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "";
}

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async login(req: NextRequest): Promise<NextResponse> {
    try {
      const body = await req.json().catch(() => ({}));
      const validation = loginSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Validation Error",
            message: validation.error.issues[0]?.message || "Invalid input",
            errors: validation.error.flatten().fieldErrors,
          },
          { status: 400 }
        );
      }

      const { user, responseHeaders } = await this.authService.login(
        validation.data,
        req.headers
      );

      const response = NextResponse.json<ApiResponse>(
        {
          success: true,
          message: "Login successful",
          data: user,
        },
        { status: 200 }
      );

      // Copy set-cookie headers from Better Auth response
      responseHeaders.forEach((value, key) => {
        if (key.toLowerCase() === "set-cookie") {
          response.headers.append("set-cookie", value);
        }
      });

      return response;
    } catch (error) {
      const message = getErrorMessage(error);

      if (message === "INVALID_CREDENTIALS") {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Unauthorized",
            message: "Invalid email/username or password",
          },
          { status: 401 }
        );
      }

      if (message === "ACCOUNT_INACTIVE") {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Forbidden",
            message: "Your account is deactivated. Please contact an administrator.",
          },
          { status: 403 }
        );
      }

      console.error("Login controller error:", error);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Internal Server Error",
          message: "An unexpected error occurred during login",
        },
        { status: 500 }
      );
    }
  }

  async logout(req: NextRequest): Promise<NextResponse> {
    try {
      const responseHeaders = await this.authService.logout(req.headers);

      const response = NextResponse.json<ApiResponse>(
        {
          success: true,
          message: "Logged out successfully",
        },
        { status: 200 }
      );

      responseHeaders.forEach((value, key) => {
        if (key.toLowerCase() === "set-cookie") {
          response.headers.append("set-cookie", value);
        }
      });

      return response;
    } catch (error) {
      console.error("Logout controller error:", error);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Internal Server Error",
          message: "An unexpected error occurred during logout",
        },
        { status: 500 }
      );
    }
  }

  async me(req: NextRequest): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      const user = await this.authService.getMe(authResult.user.id);

      return NextResponse.json<ApiResponse>({
        success: true,
        data: user,
      });
    } catch (error) {
      const message = getErrorMessage(error);

      if (message === "USER_NOT_FOUND") {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Not Found",
            message: "User profile not found",
          },
          { status: 404 }
        );
      }

      console.error("Me controller error:", error);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Internal Server Error",
          message: "Failed to fetch user profile",
        },
        { status: 500 }
      );
    }
  }

  async changePassword(req: NextRequest): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      const body = await req.json().catch(() => ({}));
      const validation = changePasswordSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Validation Error",
            message: validation.error.issues[0]?.message || "Invalid input",
            errors: validation.error.flatten().fieldErrors,
          },
          { status: 400 }
        );
      }

      await this.authService.changePassword(authResult.user.id, validation.data);

      return NextResponse.json<ApiResponse>({
        success: true,
        message: "Password updated successfully",
      });
    } catch (error) {
      const message = getErrorMessage(error);

      if (message === "INVALID_CURRENT_PASSWORD") {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "BadRequest",
            message: "The current password provided is incorrect",
          },
          { status: 400 }
        );
      }

      console.error("Change password controller error:", error);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Internal Server Error",
          message: "Failed to change password",
        },
        { status: 500 }
      );
    }
  }

  async forgotPassword(req: NextRequest): Promise<NextResponse> {
    try {
      const body = await req.json().catch(() => ({}));
      const validation = forgotPasswordSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Validation Error",
            message: validation.error.issues[0]?.message || "Invalid input",
            errors: validation.error.flatten().fieldErrors,
          },
          { status: 400 }
        );
      }

      await this.authService.forgotPassword(validation.data);

      return NextResponse.json<ApiResponse>({
        success: true,
        message: "If this email exists in our system, check your email for the reset link",
      });
    } catch (error) {
      console.error("Forgot password controller error:", error);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Internal Server Error",
          message: "Failed to request password reset",
        },
        { status: 500 }
      );
    }
  }

  async resetPassword(req: NextRequest): Promise<NextResponse> {
    try {
      const body = await req.json().catch(() => ({}));
      const validation = resetPasswordSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Validation Error",
            message: validation.error.issues[0]?.message || "Invalid input",
            errors: validation.error.flatten().fieldErrors,
          },
          { status: 400 }
        );
      }

      await this.authService.resetPassword(validation.data);

      return NextResponse.json<ApiResponse>({
        success: true,
        message: "Password reset successfully",
      });
    } catch (error) {
      const message = getErrorMessage(error);

      if (message === "INVALID_RESET_TOKEN") {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "BadRequest",
            message: "The reset token is invalid or has expired",
          },
          { status: 400 }
        );
      }

      console.error("Reset password controller error:", error);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Internal Server Error",
          message: "Failed to reset password",
        },
        { status: 500 }
      );
    }
  }
}
