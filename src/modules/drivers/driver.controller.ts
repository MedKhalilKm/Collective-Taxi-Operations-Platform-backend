import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/middleware/auth.middleware";
import { canManageDrivers } from "@/middleware/role.middleware";
import { ApiResponse, PaginatedResponse } from "@/types/api.types";
import { DriverService } from "./driver.service";
import { createDriverSchema, driverQuerySchema, updateDriverSchema } from "./driver.validation";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "";
}

export class DriverController {
  private driverService: DriverService;

  constructor() {
    this.driverService = new DriverService();
  }

  async getDrivers(req: NextRequest): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      const { searchParams } = new URL(req.url);
      const queryObj = {
        search: searchParams.get("search") || undefined,
        page: searchParams.get("page") || undefined,
        limit: searchParams.get("limit") || undefined,
      };

      const validation = driverQuerySchema.safeParse(queryObj);
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

      const { drivers, meta } = await this.driverService.getDrivers(validation.data);

      return NextResponse.json<PaginatedResponse<unknown>>({
        success: true,
        data: drivers,
        pagination: meta,
      });
    } catch (error) {
      console.error("Get drivers controller error:", error);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Internal Server Error",
          message: "Failed to retrieve drivers",
        },
        { status: 500 }
      );
    }
  }

  async getDriverById(req: NextRequest, id: string): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      const driver = await this.driverService.getDriverById(id);

      return NextResponse.json<ApiResponse>({
        success: true,
        data: driver,
      });
    } catch (error) {
      return this.handleDriverError(error, "Get driver by id controller error:", "Failed to retrieve driver");
    }
  }

  async getDriverByProfessionalIdCard(req: NextRequest, professionalIdCard: string): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      const driver = await this.driverService.getDriverByProfessionalIdCard(professionalIdCard);

      return NextResponse.json<ApiResponse>({
        success: true,
        data: driver,
      });
    } catch (error) {
      return this.handleDriverError(
        error,
        "Get driver by professional id card controller error:",
        "Failed to retrieve driver"
      );
    }
  }

  async getDriverByDrivingLicence(req: NextRequest, drivingLicence: string): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      const parsedDrivingLicence = Number(drivingLicence);
      if (!Number.isInteger(parsedDrivingLicence) || parsedDrivingLicence <= 0) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Validation Error",
            message: "Driving licence must be a positive number",
          },
          { status: 400 }
        );
      }

      const driver = await this.driverService.getDriverByDrivingLicence(parsedDrivingLicence);

      return NextResponse.json<ApiResponse>({
        success: true,
        data: driver,
      });
    } catch (error) {
      return this.handleDriverError(
        error,
        "Get driver by driving licence controller error:",
        "Failed to retrieve driver"
      );
    }
  }

  async createDriver(req: NextRequest): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      if (!canManageDrivers(authResult.user)) {
        return this.forbiddenResponse();
      }

      const body = await req.json().catch(() => ({}));
      const validation = createDriverSchema.safeParse(body);

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

      const driver = await this.driverService.createDriver(validation.data);

      return NextResponse.json<ApiResponse>(
        {
          success: true,
          message: "Driver created successfully",
          data: driver,
        },
        { status: 201 }
      );
    } catch (error) {
      return this.handleDriverError(error, "Create driver controller error:", "Failed to create driver");
    }
  }

  async updateDriver(req: NextRequest, id: string): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      if (!canManageDrivers(authResult.user)) {
        return this.forbiddenResponse();
      }

      const body = await req.json().catch(() => ({}));
      const validation = updateDriverSchema.safeParse(body);

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

      const driver = await this.driverService.updateDriver(id, validation.data);

      return NextResponse.json<ApiResponse>({
        success: true,
        message: "Driver updated successfully",
        data: driver,
      });
    } catch (error) {
      return this.handleDriverError(error, "Update driver controller error:", "Failed to update driver");
    }
  }

  private forbiddenResponse(): NextResponse {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Forbidden",
        message: "Only agents, administrators, and super administrators can manage drivers",
      },
      { status: 403 }
    );
  }

  private handleDriverError(error: unknown, logMessage: string, fallbackMessage: string): NextResponse {
    const message = getErrorMessage(error);

    if (message === "DRIVER_NOT_FOUND" || message === "DRIVER_OR_USER_NOT_FOUND") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Not Found",
          message: "Driver or user not found",
        },
        { status: 404 }
      );
    }

    if (message === "CIN_ALREADY_EXISTS") {
      return this.conflictResponse("A driver with this CIN already exists");
    }

    if (message === "PROFESSIONAL_ID_CARD_ALREADY_EXISTS") {
      return this.conflictResponse("A driver with this professional ID card already exists");
    }

    if (message === "DRIVER_ALREADY_EXISTS") {
      return this.conflictResponse("This user is already registered as a driver");
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

  private conflictResponse(message: string): NextResponse {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Conflict",
        message,
      },
      { status: 409 }
    );
  }
}
