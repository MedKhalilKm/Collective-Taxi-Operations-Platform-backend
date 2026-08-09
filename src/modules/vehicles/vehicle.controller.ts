import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/middleware/auth.middleware";
import { canManageDrivers } from "@/middleware/role.middleware";
import { ApiResponse, PaginatedResponse } from "@/types/api.types";
import { VehicleService } from "./vehicle.service";
import { createVehicleSchema, updateVehicleSchema, vehicleQuerySchema } from "./vehicle.validation";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "";
}

export class VehicleController {
  private vehicleService: VehicleService;

  constructor() {
    this.vehicleService = new VehicleService();
  }

  async getVehicles(req: NextRequest): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      const { searchParams } = new URL(req.url);
      const queryObj = {
        search: searchParams.get("search") || undefined,
        status: searchParams.get("status") || undefined,
        routeId: searchParams.get("routeId") || undefined,
        page: searchParams.get("page") || undefined,
        limit: searchParams.get("limit") || undefined,
      };

      const validation = vehicleQuerySchema.safeParse(queryObj);
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

      const { vehicles, meta } = await this.vehicleService.getVehicles(validation.data);

      return NextResponse.json<PaginatedResponse<unknown>>({
        success: true,
        data: vehicles,
        pagination: meta,
      });
    } catch (error) {
      console.error("Get vehicles controller error:", error);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Internal Server Error",
          message: "Failed to retrieve vehicles",
        },
        { status: 500 }
      );
    }
  }

  async getVehicleById(req: NextRequest, id: string): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      const vehicleId = Number(id);
      if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
        return this.validationResponse("Vehicle ID must be a positive number");
      }

      const vehicle = await this.vehicleService.getVehicleById(vehicleId);
      return NextResponse.json<ApiResponse>({ success: true, data: vehicle });
    } catch (error) {
      return this.handleVehicleError(error, "Get vehicle by id controller error:", "Failed to retrieve vehicle");
    }
  }

  async createVehicle(req: NextRequest): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      if (!canManageDrivers(authResult.user)) {
        return this.forbiddenResponse();
      }

      const body = await req.json().catch(() => ({}));
      const validation = createVehicleSchema.safeParse(body);
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

      const vehicle = await this.vehicleService.createVehicle(validation.data);
      return NextResponse.json<ApiResponse>(
        {
          success: true,
          message: "Vehicle created successfully",
          data: vehicle,
        },
        { status: 201 }
      );
    } catch (error) {
      return this.handleVehicleError(error, "Create vehicle controller error:", "Failed to create vehicle");
    }
  }

  async updateVehicle(req: NextRequest, id: string): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      if (!canManageDrivers(authResult.user)) {
        return this.forbiddenResponse();
      }

      const vehicleId = Number(id);
      if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
        return this.validationResponse("Vehicle ID must be a positive number");
      }

      const body = await req.json().catch(() => ({}));
      const validation = updateVehicleSchema.safeParse(body);
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

      const vehicle = await this.vehicleService.updateVehicle(vehicleId, validation.data);
      return NextResponse.json<ApiResponse>({
        success: true,
        message: "Vehicle updated successfully",
        data: vehicle,
      });
    } catch (error) {
      return this.handleVehicleError(error, "Update vehicle controller error:", "Failed to update vehicle");
    }
  }

  async deleteVehicle(req: NextRequest, id: string): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      if (!canManageDrivers(authResult.user)) {
        return this.forbiddenResponse();
      }

      const vehicleId = Number(id);
      if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
        return this.validationResponse("Vehicle ID must be a positive number");
      }

      await this.vehicleService.deleteVehicle(vehicleId);
      return NextResponse.json<ApiResponse>({
        success: true,
        message: "Vehicle deleted successfully",
      });
    } catch (error) {
      return this.handleVehicleError(error, "Delete vehicle controller error:", "Failed to delete vehicle");
    }
  }

  private forbiddenResponse(): NextResponse {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Forbidden",
        message: "Only agents, administrators, and super administrators can manage vehicles",
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

  private handleVehicleError(error: unknown, logMessage: string, fallbackMessage: string): NextResponse {
    const message = getErrorMessage(error);

    if (message === "VEHICLE_NOT_FOUND" || message === "VEHICLE_OR_ROUTE_NOT_FOUND") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Not Found",
          message: "Vehicle or route not found",
        },
        { status: 404 }
      );
    }

    if (message === "REGISTRATION_NUMBER_ALREADY_EXISTS") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Conflict",
          message: "A vehicle with this registration number already exists",
        },
        { status: 409 }
      );
    }

    if (message === "CHASSIS_NUMBER_ALREADY_EXISTS") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Conflict",
          message: "A vehicle with this chassis number already exists",
        },
        { status: 409 }
      );
    }

    if (message === "VEHICLE_ALREADY_EXISTS") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Conflict",
          message: "This vehicle already exists",
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
