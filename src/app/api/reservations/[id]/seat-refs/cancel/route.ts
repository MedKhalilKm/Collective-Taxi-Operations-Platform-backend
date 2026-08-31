import { NextRequest } from "next/server";
import { ReservationController } from "@/modules/reservations/reservation.controller";

const reservationController = new ReservationController();

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return reservationController.cancelReservationSeats(req, id);
}
