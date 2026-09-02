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
  private async optimizeEntranceReservations(
    entranceId: number,
    tx: Prisma.TransactionClient,
    excludedReservationIds: Set<number> = new Set()
  ): Promise<void> {
    const entrance = await tx.entrance.findUnique({
      where: { id: entranceId },
      select: {
        id: true,
        createdAt: true,
        stationId: true,
        status: true,
        vehicle: {
          select: {
            capacity: true,
            routeId: true,
          },
        },
      },
    });

    if (!entrance || entrance.status === "departed") {
      return;
    }

    const bookedSeats = await tx.reservation.aggregate({
      where: {
        entranceId,
        numberOfSeats: { gt: 0 },
      },
      _sum: { numberOfSeats: true },
    });
    let remainingEmptySeats = entrance.vehicle.capacity - (bookedSeats._sum.numberOfSeats ?? 0);

    if (remainingEmptySeats <= 0) {
      return;
    }

    const nextEntrances = await tx.entrance.findMany({
      where: {
        stationId: entrance.stationId,
        status: { not: "departed" },
        createdAt: { gt: entrance.createdAt },
        vehicle: {
          routeId: entrance.vehicle.routeId,
        },
      },
      select: {
        id: true,
        reservations: {
          where: {
            numberOfSeats: { gt: 0 },
            ...(excludedReservationIds.size
              ? { id: { notIn: [...excludedReservationIds] } }
              : {}),
          },
          select: {
            id: true,
            numberOfSeats: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });

    const affectedEntranceIds = new Set<number>();

    for (const nextEntrance of nextEntrances) {
      for (const reservation of nextEntrance.reservations) {
        if (reservation.numberOfSeats > remainingEmptySeats) {
          continue;
        }

        await tx.reservation.update({
          where: { id: reservation.id },
          data: { entranceId },
        });

        affectedEntranceIds.add(nextEntrance.id);
        remainingEmptySeats -= reservation.numberOfSeats;

        if (remainingEmptySeats === 0) {
          break;
        }
      }

      if (remainingEmptySeats === 0) {
        break;
      }
    }

    for (const affectedEntranceId of affectedEntranceIds) {
      await this.optimizeEntranceReservations(affectedEntranceId, tx);
    }
  }

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
    return prisma.$transaction(async (tx) => {
      const existingReservation = await tx.reservation.findUniqueOrThrow({
        where: { id },
        select: { entranceId: true },
      });

      const updatedReservation = await tx.reservation.update({
        where: { id },
        data,
        include: reservationInclude,
      });

      const oldEntranceId = existingReservation.entranceId;
      const newEntranceId = updatedReservation.entranceId;

      if (oldEntranceId !== newEntranceId) {
        await this.optimizeEntranceReservations(oldEntranceId, tx, new Set([id]));
      }

      await this.optimizeEntranceReservations(newEntranceId, tx);

      return tx.reservation.findUniqueOrThrow({
        where: { id },
        include: reservationInclude,
      });
    });
  }

  async cancelSeatRefs(reservationId: number, seatRefIds?: number[], reservationRefs?: string[]) {
    return prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUniqueOrThrow({
        where: { id: reservationId },
        select: { entranceId: true },
      });

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

      await tx.reservation.update({
        where: { id: reservationId },
        data: { numberOfSeats: activeSeatCount },
      });

      await this.optimizeEntranceReservations(reservation.entranceId, tx);

      return tx.reservation.findUniqueOrThrow({
        where: { id: reservationId },
        include: reservationInclude,
      });
    });
  }

  async delete(id: number) {
    return prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUniqueOrThrow({
        where: { id },
        select: { entranceId: true },
      });

      const deletedReservation = await tx.reservation.delete({
        where: { id },
      });

      await this.optimizeEntranceReservations(reservation.entranceId, tx);

      return deletedReservation;
    });
  }
}
