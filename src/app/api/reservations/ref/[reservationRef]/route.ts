import { NextRequest } from "next/server";
import { ReservationController } from "@/modules/reservations/reservation.controller";

const reservationController = new ReservationController();

export async function GET(req: NextRequest, { params }: { params: Promise<{ reservationRef: string }> }) {
  const { reservationRef } = await params;
  return reservationController.getReservationByRef(req, reservationRef);
}
