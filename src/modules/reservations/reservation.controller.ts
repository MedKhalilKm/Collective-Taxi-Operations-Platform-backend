import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/middleware/auth.middleware";
import { canCreateReservations, canManageDrivers, normalizeRole } from "@/middleware/role.middleware";
import { Role } from "@prisma/client";
import { ApiResponse, PaginatedResponse } from "@/types/api.types";
import { ReservationService } from "./reservation.service";
import {
  cancelReservationSeatsSchema,
  createReservationSchema,
  reservationQuerySchema,
  updateReservationSchema,
} from "./reservation.validation";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "";
}

export class ReservationController {
  private reservationService: ReservationService;

  constructor() {
    this.reservationService = new ReservationService();
  }

  async getReservations(req: NextRequest): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      const { searchParams } = new URL(req.url);
      const queryObj = {
        search: searchParams.get("search") || undefined,
        entranceId: searchParams.get("entranceId") || undefined,
        userId: searchParams.get("userId") || undefined,
        reservationRef: searchParams.get("reservationRef") || undefined,
        page: searchParams.get("page") || undefined,
        limit: searchParams.get("limit") || undefined,
      };

      const validation = reservationQuerySchema.safeParse(queryObj);
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

      const userRole = normalizeRole(authResult.user.role.toString());
      const filters = {
        ...validation.data,
        ...(userRole === Role.Agent && authResult.user.stationId
          ? { agentStationId: Number(authResult.user.stationId) }
          : {}),
      };

      const { reservations, meta } = await this.reservationService.getReservations(filters);

      return NextResponse.json<PaginatedResponse<unknown>>({
        success: true,
        data: reservations,
        pagination: meta,
      });
    } catch (error) {
      console.error("Get reservations controller error:", error);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Internal Server Error",
          message: "Failed to retrieve reservations",
        },
        { status: 500 }
      );
    }
  }

  async getReservationById(req: NextRequest, id: string): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      const reservationId = Number(id);
      if (!Number.isInteger(reservationId) || reservationId <= 0) {
        return this.validationResponse("Reservation ID must be a positive number");
      }

      const reservation = await this.reservationService.getReservationById(reservationId);
      return NextResponse.json<ApiResponse>({ success: true, data: reservation });
    } catch (error) {
      return this.handleReservationError(error, "Get reservation by id controller error:", "Failed to retrieve reservation");
    }
  }

  async getReservationByRef(req: NextRequest, reservationRef: string): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      const reservation = await this.reservationService.getReservationByRef(reservationRef);
      return NextResponse.json<ApiResponse>({ success: true, data: reservation });
    } catch (error) {
      return this.handleReservationError(error, "Get reservation by ref controller error:", "Failed to retrieve reservation");
    }
  }

  async createReservation(req: NextRequest): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      const userRole = normalizeRole(authResult.user.role.toString());
      if (!canCreateReservations(authResult.user)) {
        return this.forbiddenResponse("Only passengers, agents, administrators, and super administrators can create reservations");
      }

      const body = await req.json().catch(() => ({}));
      const validation = createReservationSchema.safeParse(body);
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

      const payload = userRole === Role.Passanger
        ? { ...validation.data, userId: authResult.user.id }
        : validation.data;

      const reservation = await this.reservationService.createReservation(payload);
      return NextResponse.json<ApiResponse>(
        {
          success: true,
          message: "Reservation created successfully",
          data: reservation,
        },
        { status: 201 }
      );
    } catch (error) {
      return this.handleReservationError(error, "Create reservation controller error:", "Failed to create reservation");
    }
  }

  async updateReservation(req: NextRequest, id: string): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      if (!canManageDrivers(authResult.user)) {
        return this.forbiddenResponse();
      }

      const reservationId = Number(id);
      if (!Number.isInteger(reservationId) || reservationId <= 0) {
        return this.validationResponse("Reservation ID must be a positive number");
      }

      const body = await req.json().catch(() => ({}));
      const validation = updateReservationSchema.safeParse(body);
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

      const reservation = await this.reservationService.updateReservation(reservationId, validation.data);
      return NextResponse.json<ApiResponse>({
        success: true,
        message: "Reservation updated successfully",
        data: reservation,
      });
    } catch (error) {
      return this.handleReservationError(error, "Update reservation controller error:", "Failed to update reservation");
    }
  }

  async deleteReservation(req: NextRequest, id: string): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      if (!canManageDrivers(authResult.user)) {
        return this.forbiddenResponse();
      }

      const reservationId = Number(id);
      if (!Number.isInteger(reservationId) || reservationId <= 0) {
        return this.validationResponse("Reservation ID must be a positive number");
      }

      await this.reservationService.deleteReservation(reservationId);
      return NextResponse.json<ApiResponse>({
        success: true,
        message: "Reservation deleted successfully",
      });
    } catch (error) {
      return this.handleReservationError(error, "Delete reservation controller error:", "Failed to delete reservation");
    }
  }

  async cancelReservationSeats(req: NextRequest, id: string): Promise<NextResponse> {
    try {
      const authResult = await requireAuth(req);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      if (!canManageDrivers(authResult.user)) {
        return this.forbiddenResponse();
      }

      const reservationId = Number(id);
      if (!Number.isInteger(reservationId) || reservationId <= 0) {
        return this.validationResponse("Reservation ID must be a positive number");
      }

      const body = await req.json().catch(() => ({}));
      const validation = cancelReservationSeatsSchema.safeParse(body);
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

      const reservation = await this.reservationService.cancelReservationSeats(reservationId, validation.data);
      return NextResponse.json<ApiResponse>({
        success: true,
        message: "Reservation seat cancelled successfully",
        data: reservation,
      });
    } catch (error) {
      return this.handleReservationError(error, "Cancel reservation seat controller error:", "Failed to cancel reservation seat");
    }
  }

  private forbiddenResponse(message = "Only agents, administrators, and super administrators can manage reservations"): NextResponse {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Forbidden",
        message,
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

  private handleReservationError(error: unknown, logMessage: string, fallbackMessage: string): NextResponse {
    const message = getErrorMessage(error);

    if (
      message === "RESERVATION_NOT_FOUND" ||
      message === "RESERVATION_OR_FOREIGN_KEY_NOT_FOUND" ||
      message === "RESERVATION_SEAT_REF_NOT_FOUND"
    ) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Not Found",
          message: "Reservation or related record not found",
        },
        { status: 404 }
      );
    }

    if (message === "RESERVATION_FOREIGN_KEY_NOT_FOUND") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Not Found",
          message: "Entrance or user not found",
        },
        { status: 404 }
      );
    }

    if (message === "RESERVATION_REF_GENERATION_FAILED") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Conflict",
          message: "Could not generate a unique reservation reference",
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
