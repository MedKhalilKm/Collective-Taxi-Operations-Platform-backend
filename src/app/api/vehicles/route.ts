import { NextRequest } from "next/server";
import { VehicleController } from "@/modules/vehicles/vehicle.controller";

export const dynamic = "force-dynamic";

const vehicleController = new VehicleController();

export async function GET(req: NextRequest) {
  return vehicleController.getVehicles(req);
}

export async function POST(req: NextRequest) {
  return vehicleController.createVehicle(req);
}
