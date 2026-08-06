import { NextRequest } from "next/server";
import { RouteController } from "@/modules/routes/route.controller";

export const dynamic = "force-dynamic";

const routeController = new RouteController();

export async function GET(req: NextRequest) {
  return routeController.getRoutes(req);
}

export async function POST(req: NextRequest) {
  return routeController.createRoute(req);
}
