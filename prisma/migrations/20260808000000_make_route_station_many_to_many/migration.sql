-- CreateJoinTable
CREATE TABLE "_RouteStations" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- Copy existing single-station links into the new many-to-many table
INSERT INTO "_RouteStations" ("A", "B")
SELECT "id", "stationId"
FROM "Route"
WHERE "stationId" IS NOT NULL;

-- CreateIndexes
CREATE UNIQUE INDEX "_RouteStations_AB_pkey" ON "_RouteStations"("A", "B");
CREATE INDEX "_RouteStations_B_index" ON "_RouteStations"("B");

-- AddForeignKeys
ALTER TABLE "_RouteStations"
ADD CONSTRAINT "_RouteStations_A_fkey"
FOREIGN KEY ("A") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_RouteStations"
ADD CONSTRAINT "_RouteStations_B_fkey"
FOREIGN KEY ("B") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop old single-station relation from Route
ALTER TABLE "Route" DROP CONSTRAINT "Route_stationId_fkey";
DROP INDEX IF EXISTS "Route_stationId_idx";
ALTER TABLE "Route" DROP COLUMN "stationId";
