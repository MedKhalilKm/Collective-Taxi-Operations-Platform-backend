-- DropForeignKey
ALTER TABLE "Route" DROP CONSTRAINT "Route_stationId_fkey";

-- AlterTable
ALTER TABLE "Route" ALTER COLUMN "stationId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE SET NULL ON UPDATE CASCADE;
