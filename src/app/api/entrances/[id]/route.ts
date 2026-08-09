import { NextRequest } from "next/server";
import { EntranceController } from "@/modules/entrances/entrance.controller";

export const dynamic = "force-dynamic";

const entranceController = new EntranceController();

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return entranceController.getEntranceById(req, id);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return entranceController.updateEntrance(req, id);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return entranceController.deleteEntrance(req, id);
}
