-- DropForeignKey
ALTER TABLE "Vehicle" DROP CONSTRAINT IF EXISTS "Vehicle_routeId_fkey";

-- AlterTable
ALTER TABLE "Vehicle" ALTER COLUMN "routeId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE SET NULL ON UPDATE CASCADE;
