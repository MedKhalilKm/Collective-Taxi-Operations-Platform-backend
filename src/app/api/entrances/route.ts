import { NextRequest } from "next/server";
import { EntranceController } from "@/modules/entrances/entrance.controller";

export const dynamic = "force-dynamic";

const entranceController = new EntranceController();

export async function GET(req: NextRequest) {
  return entranceController.getEntrances(req);
}

export async function POST(req: NextRequest) {
  return entranceController.createEntrance(req);
}
