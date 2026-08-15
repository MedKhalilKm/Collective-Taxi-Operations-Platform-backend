-- Add nullable column first so existing rows can be backfilled safely
ALTER TABLE "Reservation" ADD COLUMN "ReservationRef" TEXT;

-- Backfill existing reservations with deterministic unique references
UPDATE "Reservation"
SET "ReservationRef" = 'RES-' || "id"
WHERE "ReservationRef" IS NULL;

-- Make the column required and unique
ALTER TABLE "Reservation" ALTER COLUMN "ReservationRef" SET NOT NULL;
CREATE UNIQUE INDEX "Reservation_ReservationRef_key" ON "Reservation"("ReservationRef");
