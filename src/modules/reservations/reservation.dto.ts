import { Entrance, Reservation, ReservationSeatRef, Station, User, Vehicle } from "@prisma/client";

type ReservationWithRelations = Reservation & {
  entrance: Entrance & {
    station: Station;
    vehicle: Vehicle;
  };
  user: User | null;
  seatRefs: ReservationSeatRef[];
};

export interface ReservationSeatRefResponseDto {
  id: number;
  reservationRef: string;
  seatNumber: number;
  status: ReservationSeatRef["status"];
  createdAt: Date;
}

export interface ReservationResponseDto {
  id: number;
  ReservationRef: string;
  reservationRefs: string[];
  seatRefs: ReservationSeatRefResponseDto[];
  numberOfSeats: number;
  createdAt: Date;
  entranceId: number;
  userId: string | null;
  entrance: Entrance & {
    station: Station;
    vehicle: Vehicle;
  };
  user: User | null;
}

export class ReservationDto {
  static toResponse(reservation: ReservationWithRelations): ReservationResponseDto {
    return {
      id: reservation.id,
      ReservationRef: reservation.ReservationRef,
      reservationRefs: reservation.seatRefs.map((seatRef) => seatRef.reservationRef),
      seatRefs: reservation.seatRefs.map((seatRef) => ({
        id: seatRef.id,
        reservationRef: seatRef.reservationRef,
        seatNumber: seatRef.seatNumber,
        status: seatRef.status,
        createdAt: seatRef.createdAt,
      })),
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
