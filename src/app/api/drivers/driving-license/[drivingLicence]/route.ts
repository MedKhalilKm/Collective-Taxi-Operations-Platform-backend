import { NextRequest } from "next/server";
import { DriverController } from "@/modules/drivers/driver.controller";

export const dynamic = "force-dynamic";

const driverController = new DriverController();

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ drivingLicence: string }> }
) {
  const { drivingLicence } = await context.params;
  return driverController.getDriverByDrivingLicence(req, drivingLicence);
}
