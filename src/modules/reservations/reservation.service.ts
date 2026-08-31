import { randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
import { PaginatedMeta } from "@/types/api.types";
import { ReservationDto, ReservationResponseDto } from "./reservation.dto";
import { ReservationRepository } from "./reservation.repository";
import {
  CancelReservationSeatsPayload,
  CreateReservationPayload,
  ReservationQueryFilters,
  UpdateReservationPayload,
} from "./reservation.types";

function generateReservationRef(): string {
  const randomPart = randomBytes(8).toString("hex").toUpperCase();
  return `RES-${randomPart}`;
}

function generateSeatRefs(numberOfSeats: number): string[] {
  const refs = new Set<string>();

  while (refs.size < numberOfSeats) {
    refs.add(generateReservationRef());
  }

  return [...refs];
}

export class ReservationService {
  private reservationRepository: ReservationRepository;

  constructor() {
    this.reservationRepository = new ReservationRepository();
  }

  async getReservations(filters: ReservationQueryFilters): Promise<{ reservations: ReservationResponseDto[]; meta: PaginatedMeta }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;

    const { reservations, total } = await this.reservationRepository.findMany(filters);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      reservations: ReservationDto.toResponseList(reservations),
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async getReservationById(id: number): Promise<ReservationResponseDto> {
    const reservation = await this.reservationRepository.findById(id);
    if (!reservation) {
      throw new Error("RESERVATION_NOT_FOUND");
    }
    return ReservationDto.toResponse(reservation);
  }

  async getReservationByRef(reservationRef: string): Promise<ReservationResponseDto> {
    const reservation = await this.reservationRepository.findByReservationRef(reservationRef);
    if (!reservation) {
      throw new Error("RESERVATION_NOT_FOUND");
    }
    return ReservationDto.toResponse(reservation);
  }

  async createReservation(payload: CreateReservationPayload): Promise<ReservationResponseDto> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const reservationRefs = generateSeatRefs(payload.numberOfSeats);
        const reservation = await this.reservationRepository.create({
          ...payload,
          userId: payload.userId ?? null,
          ReservationRef: reservationRefs[0],
          seatRefs: {
            create: reservationRefs.map((reservationRef, index) => ({
              reservationRef,
              seatNumber: index + 1,
            })),
          },
        });
        return ReservationDto.toResponse(reservation);
      } catch (error) {
        if (this.isUniqueReservationRefConflict(error)) {
          continue;
        }
        this.handlePrismaError(error);
      }
    }

    throw new Error("RESERVATION_REF_GENERATION_FAILED");
  }

  async updateReservation(id: number, payload: UpdateReservationPayload): Promise<ReservationResponseDto> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const reservationRefs = payload.numberOfSeats === undefined
          ? undefined
          : generateSeatRefs(payload.numberOfSeats);

        const reservation = await this.reservationRepository.update(id, {
          ...payload,
          userId: payload.userId === undefined ? undefined : payload.userId ?? null,
          ...(reservationRefs
            ? {
                ReservationRef: reservationRefs[0],
                seatRefs: {
                  deleteMany: {},
                  create: reservationRefs.map((reservationRef, index) => ({
                    reservationRef,
                    seatNumber: index + 1,
                  })),
                },
              }
            : {}),
        });
        return ReservationDto.toResponse(reservation);
      } catch (error) {
        if (this.isUniqueReservationRefConflict(error)) {
          continue;
        }
        this.handlePrismaError(error);
      }
    }

    throw new Error("RESERVATION_REF_GENERATION_FAILED");
  }

  async deleteReservation(id: number): Promise<void> {
    try {
      await this.reservationRepository.delete(id);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async cancelReservationSeats(id: number, payload: CancelReservationSeatsPayload): Promise<ReservationResponseDto> {
    try {
      const reservation = await this.reservationRepository.cancelSeatRefs(
        id,
        payload.seatRefIds,
        payload.reservationRefs
      );

      if (!reservation) {
        throw new Error("RESERVATION_SEAT_REF_NOT_FOUND");
      }

      return ReservationDto.toResponse(reservation);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  private isUniqueReservationRefConflict(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
  }

  private handlePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw new Error("RESERVATION_OR_FOREIGN_KEY_NOT_FOUND");
      }

      if (error.code === "P2003") {
        throw new Error("RESERVATION_FOREIGN_KEY_NOT_FOUND");
      }

      if (error.code === "P2002") {
        throw new Error("RESERVATION_ALREADY_EXISTS");
      }
    }

    throw error;
  }
}
