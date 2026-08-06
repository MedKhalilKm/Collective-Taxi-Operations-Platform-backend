import { NextRequest } from "next/server";
import { RouteController } from "@/modules/routes/route.controller";

export const dynamic = "force-dynamic";

const routeController = new RouteController();

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return routeController.getRouteById(req, id);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return routeController.updateRoute(req, id);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return routeController.deleteRoute(req, id);
}
