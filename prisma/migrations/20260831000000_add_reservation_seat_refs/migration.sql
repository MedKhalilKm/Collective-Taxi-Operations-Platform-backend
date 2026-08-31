CREATE TYPE "ReservationSeatStatus" AS ENUM ('active', 'cancelled');

CREATE TABLE "ReservationSeatRef" (
    "id" SERIAL NOT NULL,
    "reservationRef" TEXT NOT NULL,
    "seatNumber" INTEGER NOT NULL,
    "status" "ReservationSeatStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reservationId" INTEGER NOT NULL,

    CONSTRAINT "ReservationSeatRef_pkey" PRIMARY KEY ("id")
);

INSERT INTO "ReservationSeatRef" ("reservationRef", "seatNumber", "reservationId")
SELECT
  CASE
    WHEN seat_number = 1 THEN "ReservationRef"
    ELSE "ReservationRef" || '-S' || seat_number || '-' || id
  END,
  seat_number,
  id
FROM "Reservation"
CROSS JOIN LATERAL generate_series(1, "numberOfSeats") AS seat_number;

CREATE UNIQUE INDEX "ReservationSeatRef_reservationRef_key" ON "ReservationSeatRef"("reservationRef");
CREATE UNIQUE INDEX "ReservationSeatRef_reservationId_seatNumber_key" ON "ReservationSeatRef"("reservationId", "seatNumber");
CREATE INDEX "ReservationSeatRef_reservationId_idx" ON "ReservationSeatRef"("reservationId");

ALTER TABLE "ReservationSeatRef" ADD CONSTRAINT "ReservationSeatRef_reservationId_fkey"
FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
