import { NextRequest, NextResponse } from "next/server";
import { AuthController } from "@/modules/auth/auth.controller";

export const dynamic = "force-dynamic";

const authController = new AuthController();

export async function PATCH(req: NextRequest) {
  return authController.changePassword(req);
}

export async function POST(req: NextRequest) {
  return authController.changePassword(req);
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message: "To change password, send a POST or PATCH request with JSON body containing currentPassword and newPassword.",
    },
    { status: 400 }
  );
}
