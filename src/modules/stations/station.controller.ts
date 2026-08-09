import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/middleware/auth.middleware";
import { canManageDrivers } from "@/middleware/role.middleware";
import { ApiResponse, PaginatedResponse } from "@/types/api.types";
import { StationService } from "./station.service";
import { createStationSchema, stationQuerySchema, updateStationSchema } from "./station.validation";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "";
}

export class StationController {
  private stationService: StationService;

  constructor() {
    this.stationService = new StationService();
  }

  async getStations(req: NextRequest): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      const { searchParams } = new URL(req.url);
      const queryObj = {
        search: searchParams.get("search") || undefined,
        governorate: searchParams.get("governorate") || undefined,
        city: searchParams.get("city") || undefined,
        page: searchParams.get("page") || undefined,
        limit: searchParams.get("limit") || undefined,
      };

      const validation = stationQuerySchema.safeParse(queryObj);
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

      const { stations, meta } = await this.stationService.getStations(validation.data);

      return NextResponse.json<PaginatedResponse<unknown>>({
        success: true,
        data: stations,
        pagination: meta,
      });
    } catch (error) {
      console.error("Get stations controller error:", error);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Internal Server Error",
          message: "Failed to retrieve stations",
        },
        { status: 500 }
      );
    }
  }

  async getStationById(req: NextRequest, id: string): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      const stationId = Number(id);
      if (!Number.isInteger(stationId) || stationId <= 0) {
        return this.validationResponse("Station ID must be a positive number");
      }

      const station = await this.stationService.getStationById(stationId);
      return NextResponse.json<ApiResponse>({ success: true, data: station });
    } catch (error) {
      return this.handleStationError(error, "Get station by id controller error:", "Failed to retrieve station");
    }
  }

  async createStation(req: NextRequest): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      if (!canManageDrivers(authResult.user)) {
        return this.forbiddenResponse();
      }

      const body = await req.json().catch(() => ({}));
      const validation = createStationSchema.safeParse(body);
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

      const station = await this.stationService.createStation(validation.data);

      return NextResponse.json<ApiResponse>(
        {
          success: true,
          message: "Station created successfully",
          data: station,
        },
        { status: 201 }
      );
    } catch (error) {
      return this.handleStationError(error, "Create station controller error:", "Failed to create station");
    }
  }

  async updateStation(req: NextRequest, id: string): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      if (!canManageDrivers(authResult.user)) {
        return this.forbiddenResponse();
      }

      const stationId = Number(id);
      if (!Number.isInteger(stationId) || stationId <= 0) {
        return this.validationResponse("Station ID must be a positive number");
      }

      const body = await req.json().catch(() => ({}));
      const validation = updateStationSchema.safeParse(body);
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

      const station = await this.stationService.updateStation(stationId, validation.data);

      return NextResponse.json<ApiResponse>({
        success: true,
        message: "Station updated successfully",
        data: station,
      });
    } catch (error) {
      return this.handleStationError(error, "Update station controller error:", "Failed to update station");
    }
  }

  async deleteStation(req: NextRequest, id: string): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      if (!canManageDrivers(authResult.user)) {
        return this.forbiddenResponse();
      }

      const stationId = Number(id);
      if (!Number.isInteger(stationId) || stationId <= 0) {
        return this.validationResponse("Station ID must be a positive number");
      }

      await this.stationService.deleteStation(stationId);
      return NextResponse.json<ApiResponse>({
        success: true,
        message: "Station deleted successfully",
      });
    } catch (error) {
      return this.handleStationError(error, "Delete station controller error:", "Failed to delete station");
    }
  }

  private forbiddenResponse(): NextResponse {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Forbidden",
        message: "Only agents, administrators, and super administrators can manage stations",
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

  private handleStationError(error: unknown, logMessage: string, fallbackMessage: string): NextResponse {
    const message = getErrorMessage(error);

    if (message === "STATION_NOT_FOUND" || message === "STATION_OR_ROUTE_NOT_FOUND") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Not Found",
          message: "Station or route not found",
        },
        { status: 404 }
      );
    }

    if (message === "STATION_ALREADY_EXISTS") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Conflict",
          message: "A station with the same unique value already exists",
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
