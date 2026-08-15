import { Entrance, Reservation, User } from "@prisma/client";

type ReservationWithRelations = Reservation & {
  entrance: Entrance;
  user: User | null;
};

export interface ReservationResponseDto {
  id: number;
  ReservationRef: string;
  numberOfSeats: number;
  createdAt: Date;
  entranceId: number;
  userId: string | null;
  entrance: Entrance;
  user: User | null;
}

export class ReservationDto {
  static toResponse(reservation: ReservationWithRelations): ReservationResponseDto {
    return {
      id: reservation.id,
      ReservationRef: reservation.ReservationRef,
      numberOfSeats: reservation.numberOfSeats,
      createdAt: reservation.createdAt,
      entranceId: reservation.entranceId,
      userId: reservation.userId,
      entrance: reservation.entrance,
      user: reservation.user,
    };
  }

  static toResponseList(reservations: ReservationWithRelations[]): ReservationResponseDto[] {
    return reservations.map((reservation) => this.toResponse(reservation));
  }
}
