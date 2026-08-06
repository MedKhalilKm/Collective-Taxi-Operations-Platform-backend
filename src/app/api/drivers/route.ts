import { NextRequest } from "next/server";
import { DriverController } from "@/modules/drivers/driver.controller";

export const dynamic = "force-dynamic";

const driverController = new DriverController();

export async function GET(req: NextRequest) {
  return driverController.getDrivers(req);
}

export async function POST(req: NextRequest) {
  return driverController.createDriver(req);
}
