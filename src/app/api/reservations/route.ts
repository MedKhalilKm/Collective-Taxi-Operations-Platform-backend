import { NextRequest } from "next/server";
import { ReservationController } from "@/modules/reservations/reservation.controller";

const reservationController = new ReservationController();

export async function GET(req: NextRequest) {
  return reservationController.getReservations(req);
}

export async function POST(req: NextRequest) {
  return reservationController.createReservation(req);
}
