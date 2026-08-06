import { NextRequest } from "next/server";
import { AuthController } from "@/modules/auth/auth.controller";

export const dynamic = "force-dynamic";

const authController = new AuthController();

export async function GET(req: NextRequest) {
  return authController.me(req);
}
