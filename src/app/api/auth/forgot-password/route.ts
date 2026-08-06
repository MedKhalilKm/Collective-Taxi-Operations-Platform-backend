import { NextRequest, NextResponse } from "next/server";
import { AuthController } from "@/modules/auth/auth.controller";

export const dynamic = "force-dynamic";

const authController = new AuthController();

export async function POST(req: NextRequest) {
  return authController.forgotPassword(req);
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message: "To request a password reset, send a POST request with JSON body containing email and optional redirectTo.",
    },
    { status: 400 }
  );
}
