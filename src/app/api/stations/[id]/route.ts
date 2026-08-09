import { NextRequest } from "next/server";
import { StationController } from "@/modules/stations/station.controller";

export const dynamic = "force-dynamic";

const stationController = new StationController();

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return stationController.getStationById(req, id);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return stationController.updateStation(req, id);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return stationController.deleteStation(req, id);
}
