import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  CreateReservationPayload,
  ReservationQueryFilters,
  UpdateReservationPayload,
} from "./reservation.types";

const reservationInclude = {
  entrance: true,
  user: true,
} satisfies Prisma.ReservationInclude;

export class ReservationRepository {
  async findMany(filters: ReservationQueryFilters) {
    const { search, entranceId, userId, reservationRef, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.ReservationWhereInput = {};

    if (search) {
      const numericSearch = Number(search);
      where.OR = [
        { ReservationRef: { contains: search, mode: "insensitive" } },
        ...(Number.isNaN(numericSearch)
          ? []
          : [{ id: numericSearch }, { numberOfSeats: numericSearch }, { entranceId: numericSearch }]),
      ];
    }

    if (entranceId) {
      where.entranceId = entranceId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (reservationRef) {
      where.ReservationRef = { contains: reservationRef, mode: "insensitive" };
    }

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        include: reservationInclude,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.reservation.count({ where }),
    ]);

    return { reservations, total };
  }

  async findById(id: number) {
    return prisma.reservation.findUnique({
      where: { id },
      include: reservationInclude,
    });
  }

  async findByReservationRef(reservationRef: string) {
    return prisma.reservation.findUnique({
      where: { ReservationRef: reservationRef },
      include: reservationInclude,
    });
  }

  async create(data: CreateReservationPayload) {
    return prisma.reservation.create({
      data,
      include: reservationInclude,
    });
  }

  async update(id: number, data: UpdateReservationPayload) {
    return prisma.reservation.update({
      where: { id },
      data,
      include: reservationInclude,
    });
  }

  async delete(id: number) {
    return prisma.reservation.delete({
      where: { id },
    });
  }
}
