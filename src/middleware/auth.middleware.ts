import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role: Role | string;
  status?: string;
}

export interface AuthContext {
  user: AuthenticatedUser;
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
  };
}

/**
 * Extracts and verifies the current session from request headers.
 */
export async function getAuthSession(req: NextRequest): Promise<AuthContext | null> {
  try {
    const sessionData = await auth.api.getSession({
      headers: req.headers,
    });

    if (!sessionData || !sessionData.user || !sessionData.session) {
      return null;
    }

    return {
      user: sessionData.user as AuthenticatedUser,
      session: sessionData.session,
    };
  } catch (error) {
    console.error("Error in getAuthSession middleware:", error);
    return null;
  }
}

/**
 * Ensures request is authenticated, returning AuthContext or an unauthorized Response.
 */
export async function requireAuth(
  req: NextRequest
): Promise<AuthContext | NextResponse> {
  const context = await getAuthSession(req);

  if (!context) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized",
        message: "Authentication is required to access this resource",
      },
      { status: 401 }
    );
  }

  return context;
}
