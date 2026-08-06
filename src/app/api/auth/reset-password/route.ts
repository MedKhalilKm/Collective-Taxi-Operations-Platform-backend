import { NextRequest, NextResponse } from "next/server";
import { AuthController } from "@/modules/auth/auth.controller";

export const dynamic = "force-dynamic";

const authController = new AuthController();

export async function POST(req: NextRequest) {
  return authController.resetPassword(req);
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message: "To reset password, send a POST request with JSON body containing token and newPassword.",
    },
    { status: 400 }
  );
}
