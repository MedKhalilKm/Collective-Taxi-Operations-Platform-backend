import { NextRequest } from "next/server";
import { StationController } from "@/modules/stations/station.controller";

export const dynamic = "force-dynamic";

const stationController = new StationController();

export async function GET(req: NextRequest) {
  return stationController.getStations(req);
}

export async function POST(req: NextRequest) {
  return stationController.createStation(req);
}
