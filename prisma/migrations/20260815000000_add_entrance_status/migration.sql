-- CreateEnum
CREATE TYPE "EntranceStatus" AS ENUM ('ready', 'pending', 'waiting');

-- AlterTable
ALTER TABLE "Entrance"
ADD COLUMN "status" "EntranceStatus" NOT NULL DEFAULT 'pending';
