import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/middleware/auth.middleware";
import { canManageEntrances, isAgent } from "@/middleware/role.middleware";
import { ApiResponse, PaginatedResponse } from "@/types/api.types";
import { EntranceService } from "./entrance.service";
import { createEntranceSchema, entranceQuerySchema, updateEntranceSchema } from "./entrance.validation";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "";
}

export class EntranceController {
  private entranceService: EntranceService;

  constructor() {
    this.entranceService = new EntranceService();
  }

  async getEntrances(req: NextRequest): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      const { searchParams } = new URL(req.url);
      const queryObj = {
        search: searchParams.get("search") || undefined,
        vehicleId: searchParams.get("vehicleId") || undefined,
        stationId: searchParams.get("stationId") || undefined,
        driverId: searchParams.get("driverId") || undefined,
        status: searchParams.get("status") || undefined,
        page: searchParams.get("page") || undefined,
        limit: searchParams.get("limit") || undefined,
      };

      const validation = entranceQuerySchema.safeParse(queryObj);
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

      const agentStationId = this.getAgentStationId(authResult.user);
      if (isAgent(authResult.user) && agentStationId === undefined) return this.forbiddenResponse();

      const filters = {
        ...validation.data,
        ...(agentStationId !== undefined ? { stationId: agentStationId } : {}),
      };

      const { entrances, meta } = await this.entranceService.getEntrances(filters);

      return NextResponse.json<PaginatedResponse<unknown>>({
        success: true,
        data: entrances,
        pagination: meta,
      });
    } catch (error) {
      console.error("Get entrances controller error:", error);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Internal Server Error",
          message: "Failed to retrieve entrances",
        },
        { status: 500 }
      );
    }
  }

  async getEntranceById(req: NextRequest, id: string): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      const entranceId = Number(id);
      if (!Number.isInteger(entranceId) || entranceId <= 0) {
        return this.validationResponse("Entrance ID must be a positive number");
      }

      const entrance = await this.entranceService.getEntranceById(entranceId);
      const agentStationId = this.getAgentStationId(authResult.user);
      if (isAgent(authResult.user) && agentStationId === undefined) return this.forbiddenResponse();
      if (agentStationId !== undefined) {
        if (entrance.stationId !== agentStationId) {
          return this.forbiddenResponse();
        }
      }

      return NextResponse.json<ApiResponse>({ success: true, data: entrance });
    } catch (error) {
      return this.handleEntranceError(error, "Get entrance by id controller error:", "Failed to retrieve entrance");
    }
  }

  async createEntrance(req: NextRequest): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      if (!canManageEntrances(authResult.user)) {
        return this.forbiddenResponse();
      }

      const agentStationId = this.getAgentStationId(authResult.user);
      if (isAgent(authResult.user) && agentStationId === undefined) return this.forbiddenResponse();

      const body = await req.json().catch(() => ({}));
      const validation = createEntranceSchema.safeParse(body);
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

      if (agentStationId !== undefined && validation.data.stationId !== agentStationId) {
        return this.forbiddenResponse();
      }

      const payload =
        agentStationId !== undefined
          ? {
              ...validation.data,
              stationId: agentStationId,
            }
          : validation.data;

      const entrance = await this.entranceService.createEntrance(payload);
      return NextResponse.json<ApiResponse>(
        {
          success: true,
          message: "Entrance created successfully",
          data: entrance,
        },
        { status: 201 }
      );
    } catch (error) {
      return this.handleEntranceError(error, "Create entrance controller error:", "Failed to create entrance");
    }
  }

  async updateEntrance(req: NextRequest, id: string): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      if (!canManageEntrances(authResult.user)) {
        return this.forbiddenResponse();
      }

      const entranceId = Number(id);
      if (!Number.isInteger(entranceId) || entranceId <= 0) {
        return this.validationResponse("Entrance ID must be a positive number");
      }

      const agentStationId = this.getAgentStationId(authResult.user);
      if (agentStationId !== undefined) {
        const entrance = await this.entranceService.getEntranceById(entranceId);
        if (entrance.stationId !== agentStationId) {
          return this.forbiddenResponse();
        }
      }

      const body = await req.json().catch(() => ({}));
      const validation = updateEntranceSchema.safeParse(body);
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

      if (isAgent(authResult.user) && agentStationId === undefined) return this.forbiddenResponse();
      if (agentStationId !== undefined && validation.data.stationId !== undefined && validation.data.stationId !== agentStationId) {
        return this.forbiddenResponse();
      }
      const entrance = await this.entranceService.updateEntrance(entranceId, agentStationId === undefined
        ? validation.data
        : { ...validation.data, stationId: agentStationId });
      return NextResponse.json<ApiResponse>({
        success: true,
        message: "Entrance updated successfully",
        data: entrance,
      });
    } catch (error) {
      return this.handleEntranceError(error, "Update entrance controller error:", "Failed to update entrance");
    }
  }

  async deleteEntrance(req: NextRequest, id: string): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      if (!canManageEntrances(authResult.user)) {
        return this.forbiddenResponse();
      }

      const entranceId = Number(id);
      if (!Number.isInteger(entranceId) || entranceId <= 0) {
        return this.validationResponse("Entrance ID must be a positive number");
      }

      const agentStationId = this.getAgentStationId(authResult.user);
      if (isAgent(authResult.user) && agentStationId === undefined) return this.forbiddenResponse();
      if (agentStationId !== undefined) {
        const entrance = await this.entranceService.getEntranceById(entranceId);
        if (entrance.stationId !== agentStationId) {
          return this.forbiddenResponse();
        }
      }

      await this.entranceService.deleteEntrance(entranceId);
      return NextResponse.json<ApiResponse>({
        success: true,
        message: "Entrance deleted successfully",
      });
    } catch (error) {
      return this.handleEntranceError(error, "Delete entrance controller error:", "Failed to delete entrance");
    }
  }

  private getAgentStationId(user: Parameters<typeof isAgent>[0]): number | undefined {
    if (!isAgent(user)) return undefined;
    const stationId = Number(user.stationId);
    return Number.isInteger(stationId) && stationId > 0 ? stationId : undefined;
  }

  private forbiddenResponse(): NextResponse {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Forbidden",
        message: "Only agents, administrators, and super administrators can manage entrances",
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

  private handleEntranceError(error: unknown, logMessage: string, fallbackMessage: string): NextResponse {
    const message = getErrorMessage(error);

    if (message === "ENTRANCE_NOT_FOUND" || message === "ENTRANCE_OR_FOREIGN_KEY_NOT_FOUND") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Not Found",
          message: "Entrance or related record not found",
        },
        { status: 404 }
      );
    }

    if (message === "ENTRANCE_FOREIGN_KEY_NOT_FOUND") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Not Found",
          message: "Driver, vehicle, or station not found",
        },
        { status: 404 }
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
