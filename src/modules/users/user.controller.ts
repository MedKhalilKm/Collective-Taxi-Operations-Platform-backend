import { NextRequest, NextResponse } from "next/server";
import { UserService } from "./user.service";
import { createUserSchema, updateUserSchema, userQuerySchema } from "./user.validation";
import { requireAuth } from "@/middleware/auth.middleware";
import { isAdminOrSuperAdmin, isSelfOrAdmin } from "@/middleware/role.middleware";
import { ApiResponse, PaginatedResponse } from "@/types/api.types";

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async getUsers(req: NextRequest): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      if (!isAdminOrSuperAdmin(authResult.user)) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Forbidden",
            message: "Access restricted to administrators only",
          },
          { status: 403 }
        );
      }

      const { searchParams } = new URL(req.url);
      const queryObj = {
        search: searchParams.get("search") || undefined,
        role: searchParams.get("role") || undefined,
        status: searchParams.get("status") || undefined,
        page: searchParams.get("page") || undefined,
        limit: searchParams.get("limit") || undefined,
      };

      const validation = userQuerySchema.safeParse(queryObj);
      if (!validation.success) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Validation Error",
            message: validation.error.issues[0]?.message || "Invalid query parameters",
          },
          { status: 400 }
        );
      }

      const { users, meta } = await this.userService.getUsers(validation.data);

      return NextResponse.json<PaginatedResponse<any>>({
        success: true,
        data: users,
        pagination: meta,
      });
    } catch (error) {
      console.error("Get users controller error:", error);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Internal Server Error",
          message: "Failed to retrieve users",
        },
        { status: 500 }
      );
    }
  }

  async getUserById(req: NextRequest, id: string): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      if (!isSelfOrAdmin(authResult.user, id)) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Forbidden",
            message: "You are not authorized to view this user profile",
          },
          { status: 403 }
        );
      }

      const user = await this.userService.getUserById(id);

      return NextResponse.json<ApiResponse>({
        success: true,
        data: user,
      });
    } catch (error: any) {
      if (error.message === "USER_NOT_FOUND") {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Not Found",
            message: "User not found",
          },
          { status: 404 }
        );
      }

      console.error("Get user by id controller error:", error);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Internal Server Error",
          message: "Failed to retrieve user",
        },
        { status: 500 }
      );
    }
  }

  async createUser(req: NextRequest): Promise<NextResponse> {
    try {
      // NOTE: Authentication check bypassed for testing convenience as requested.
      const body = await req.json().catch(() => ({}));
      const validation = createUserSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Validation Error",
            message: validation.error.issues[0]?.message || "Invalid input data",
            errors: validation.error.flatten().fieldErrors,
          },
          { status: 400 }
        );
      }

      const newUser = await this.userService.createUser(validation.data);

      return NextResponse.json<ApiResponse>(
        {
          success: true,
          message: "User created successfully",
          data: newUser,
        },
        { status: 201 }
      );
    } catch (error: any) {
      if (error.message === "EMAIL_ALREADY_EXISTS") {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Conflict",
            message: "A user with this email address already exists",
          },
          { status: 409 }
        );
      }

      if (error.message === "USERNAME_ALREADY_EXISTS") {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Conflict",
            message: "A user with this username already exists",
          },
          { status: 409 }
        );
      }

      console.error("Create user controller error:", error);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Internal Server Error",
          message: "Failed to create user",
        },
        { status: 500 }
      );
    }
  }

  async updateUser(req: NextRequest, id: string): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      if (!isAdminOrSuperAdmin(authResult.user)) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Forbidden",
            message: "Only administrators can update users",
          },
          { status: 403 }
        );
      }

      const body = await req.json().catch(() => ({}));
      const validation = updateUserSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Validation Error",
            message: validation.error.issues[0]?.message || "Invalid input data",
            errors: validation.error.flatten().fieldErrors,
          },
          { status: 400 }
        );
      }

      const updatedUser = await this.userService.updateUser(id, validation.data);

      return NextResponse.json<ApiResponse>({
        success: true,
        message: "User updated successfully",
        data: updatedUser,
      });
    } catch (error: any) {
      if (error.message === "USER_NOT_FOUND") {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Not Found",
            message: "User not found",
          },
          { status: 404 }
        );
      }

      if (error.message === "EMAIL_ALREADY_EXISTS") {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Conflict",
            message: "A user with this email address already exists",
          },
          { status: 409 }
        );
      }

      if (error.message === "USERNAME_ALREADY_EXISTS") {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Conflict",
            message: "A user with this username already exists",
          },
          { status: 409 }
        );
      }

      console.error("Update user controller error:", error);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Internal Server Error",
          message: "Failed to update user",
        },
        { status: 500 }
      );
    }
  }

  async deleteUser(req: NextRequest, id: string): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      if (!isAdminOrSuperAdmin(authResult.user)) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Forbidden",
            message: "Only administrators can delete users",
          },
          { status: 403 }
        );
      }

      await this.userService.deleteUser(id);

      return NextResponse.json<ApiResponse>({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error: any) {
      if (error.message === "USER_NOT_FOUND") {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Not Found",
            message: "User not found",
          },
          { status: 404 }
        );
      }

      console.error("Delete user controller error:", error);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Internal Server Error",
          message: "Failed to delete user",
        },
        { status: 500 }
      );
    }
  }
}
