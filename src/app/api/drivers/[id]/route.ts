import { NextRequest } from "next/server";
import { DriverController } from "@/modules/drivers/driver.controller";

export const dynamic = "force-dynamic";

const driverController = new DriverController();

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return driverController.getDriverById(req, id);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return driverController.updateDriver(req, id);
}
