-- Add optional station relation to users
ALTER TABLE "User"
ADD COLUMN "stationId" INTEGER;

ALTER TABLE "User"
ADD CONSTRAINT "User_stationId_fkey"
FOREIGN KEY ("stationId") REFERENCES "Station"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "User_stationId_idx" ON "User"("stationId");
