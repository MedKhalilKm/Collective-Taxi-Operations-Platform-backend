import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  ReservationQueryFilters,
} from "./reservation.types";

const reservationInclude = {
  entrance: {
    include: {
      station: true,
      vehicle: true,
    },
  },
  user: true,
  seatRefs: {
    orderBy: { seatNumber: "asc" },
  },
} satisfies Prisma.ReservationInclude;

export class ReservationRepository {
  async findMany(filters: ReservationQueryFilters) {
    const {
      search,
      entranceId,
      userId,
      reservationRef,
      page = 1,
      limit = 10,
      agentStationId,
    } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.ReservationWhereInput = {};

    if (search) {
      const numericSearch = Number(search);
      where.OR = [
        { ReservationRef: { contains: search, mode: "insensitive" } },
        { seatRefs: { some: { reservationRef: { contains: search, mode: "insensitive" } } } },
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
      where.OR = [
        ...(where.OR || []),
        { ReservationRef: { contains: reservationRef, mode: "insensitive" } },
        { seatRefs: { some: { reservationRef: { contains: reservationRef, mode: "insensitive" } } } },
      ];
    }

    if (agentStationId) {
      where.entrance = {
        is: {
          stationId: agentStationId,
        },
      };
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
    return prisma.reservation.findFirst({
      where: {
        OR: [
          { ReservationRef: reservationRef },
          { seatRefs: { some: { reservationRef } } },
        ],
      },
      include: reservationInclude,
    });
  }

  async create(data: Prisma.ReservationUncheckedCreateInput) {
    return prisma.reservation.create({
      data,
      include: reservationInclude,
    });
  }

  async update(id: number, data: Prisma.ReservationUncheckedUpdateInput) {
    return prisma.reservation.update({
      where: { id },
      data,
      include: reservationInclude,
    });
  }

  async cancelSeatRefs(reservationId: number, seatRefIds?: number[], reservationRefs?: string[]) {
    return prisma.$transaction(async (tx) => {
      const matchingSeatRefs = await tx.reservationSeatRef.findMany({
        where: {
          reservationId,
          status: "active",
          OR: [
            ...(seatRefIds?.length ? [{ id: { in: seatRefIds } }] : []),
            ...(reservationRefs?.length ? [{ reservationRef: { in: reservationRefs } }] : []),
          ],
        },
        select: { id: true },
      });

      if (!matchingSeatRefs.length) {
        return null;
      }

      await tx.reservationSeatRef.updateMany({
        where: {
          id: { in: matchingSeatRefs.map((seatRef) => seatRef.id) },
        },
        data: { status: "cancelled" },
      });

      const activeSeatCount = await tx.reservationSeatRef.count({
        where: {
          reservationId,
          status: "active",
        },
      });

      return tx.reservation.update({
        where: { id: reservationId },
        data: { numberOfSeats: activeSeatCount },
        include: reservationInclude,
      });
    });
  }

  async delete(id: number) {
    return prisma.reservation.delete({
      where: { id },
    });
  }
}
