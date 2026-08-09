import { NextRequest } from "next/server";
import { VehicleController } from "@/modules/vehicles/vehicle.controller";

export const dynamic = "force-dynamic";

const vehicleController = new VehicleController();

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return vehicleController.getVehicleById(req, id);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return vehicleController.updateVehicle(req, id);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return vehicleController.deleteVehicle(req, id);
}
