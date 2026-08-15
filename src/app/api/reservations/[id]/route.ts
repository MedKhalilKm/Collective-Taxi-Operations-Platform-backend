import { NextRequest } from "next/server";
import { ReservationController } from "@/modules/reservations/reservation.controller";

const reservationController = new ReservationController();

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return reservationController.getReservationById(req, id);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return reservationController.updateReservation(req, id);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return reservationController.deleteReservation(req, id);
}
