import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeRole } from "./role.middleware";

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
  stationId?: number | null;
  station?: { id: number; name: string } | null;
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

    // Better Auth's session user can contain cached/custom fields. Always use
    // the current database row for authorization and station scoping.
    const user = await prisma.user.findUnique({
      where: { id: sessionData.user.id },
      include: { station: { select: { id: true, name: true } } },
    });

    if (!user) {
      return null;
    }

    return {
      user: { ...user, role: normalizeRole(user.role) } as AuthenticatedUser,
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
