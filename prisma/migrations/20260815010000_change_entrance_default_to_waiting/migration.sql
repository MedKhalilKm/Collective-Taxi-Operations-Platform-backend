-- Change default entrance status to waiting
ALTER TABLE "Entrance"
ALTER COLUMN "status" SET DEFAULT 'waiting';
