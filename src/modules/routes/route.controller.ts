import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/middleware/auth.middleware";
import { canManageDrivers } from "@/middleware/role.middleware";
import { ApiResponse, PaginatedResponse } from "@/types/api.types";
import { RouteService } from "./route.service";
import { createRouteSchema, routeQuerySchema, updateRouteSchema } from "./route.validation";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "";
}

export class RouteController {
  private routeService: RouteService;

  constructor() {
    this.routeService = new RouteService();
  }

  async getRoutes(req: NextRequest): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      const { searchParams } = new URL(req.url);
      const queryObj = {
        search: searchParams.get("search") || undefined,
        stationId: searchParams.get("stationId") || undefined,
        page: searchParams.get("page") || undefined,
        limit: searchParams.get("limit") || undefined,
      };

      const validation = routeQuerySchema.safeParse(queryObj);
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

      const { routes, meta } = await this.routeService.getRoutes(validation.data);

      return NextResponse.json<PaginatedResponse<unknown>>({
        success: true,
        data: routes,
        pagination: meta,
      });
    } catch (error) {
      console.error("Get routes controller error:", error);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Internal Server Error",
          message: "Failed to retrieve routes",
        },
        { status: 500 }
      );
    }
  }

  async getRouteById(req: NextRequest, id: string): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      const routeId = Number(id);
      if (!Number.isInteger(routeId) || routeId <= 0) {
        return this.validationResponse("Route ID must be a positive number");
      }

      const route = await this.routeService.getRouteById(routeId);
      return NextResponse.json<ApiResponse>({ success: true, data: route });
    } catch (error) {
      return this.handleRouteError(error, "Get route by id controller error:", "Failed to retrieve route");
    }
  }

  async createRoute(req: NextRequest): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      if (!canManageDrivers(authResult.user)) {
        return this.forbiddenResponse();
      }

      const body = await req.json().catch(() => ({}));
      const validation = createRouteSchema.safeParse(body);
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

      const route = await this.routeService.createRoute(validation.data);

      return NextResponse.json<ApiResponse>(
        {
          success: true,
          message: "Route created successfully",
          data: route,
        },
        { status: 201 }
      );
    } catch (error) {
      return this.handleRouteError(error, "Create route controller error:", "Failed to create route");
    }
  }

  async updateRoute(req: NextRequest, id: string): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      if (!canManageDrivers(authResult.user)) {
        return this.forbiddenResponse();
      }

      const routeId = Number(id);
      if (!Number.isInteger(routeId) || routeId <= 0) {
        return this.validationResponse("Route ID must be a positive number");
      }

      const body = await req.json().catch(() => ({}));
      const validation = updateRouteSchema.safeParse(body);
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

      const route = await this.routeService.updateRoute(routeId, validation.data);

      return NextResponse.json<ApiResponse>({
        success: true,
        message: "Route updated successfully",
        data: route,
      });
    } catch (error) {
      return this.handleRouteError(error, "Update route controller error:", "Failed to update route");
    }
  }

  async deleteRoute(req: NextRequest, id: string): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      if (!canManageDrivers(authResult.user)) {
        return this.forbiddenResponse();
      }

      const routeId = Number(id);
      if (!Number.isInteger(routeId) || routeId <= 0) {
        return this.validationResponse("Route ID must be a positive number");
      }

      await this.routeService.deleteRoute(routeId);
      return NextResponse.json<ApiResponse>({
        success: true,
        message: "Route deleted successfully",
      });
    } catch (error) {
      return this.handleRouteError(error, "Delete route controller error:", "Failed to delete route");
    }
  }

  private forbiddenResponse(): NextResponse {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Forbidden",
        message: "Only agents, administrators, and super administrators can manage routes",
      },
      { status: 403 }
    );
  }

  private validationResponse(message: string): NextResponse {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Validation Error",
        message,
      },
      { status: 400 }
    );
  }

  private handleRouteError(error: unknown, logMessage: string, fallbackMessage: string): NextResponse {
    const message = getErrorMessage(error);

    if (message === "ROUTE_NOT_FOUND" || message === "ROUTE_OR_STATION_NOT_FOUND") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Not Found",
          message: "Route or station not found",
        },
        { status: 404 }
      );
    }

    if (message === "ROUTE_ALREADY_EXISTS") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Conflict",
          message: "A route with the same unique value already exists",
        },
        { status: 409 }
      );
    }

    console.error(logMessage, error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Internal Server Error",
        message: fallbackMessage,
      },
      { status: 500 }
    );
  }
}
