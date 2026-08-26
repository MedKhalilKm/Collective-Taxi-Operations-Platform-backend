import { Role } from "@prisma/client";
import type { AuthenticatedUser } from "./auth.middleware";

/**
 * Maps standard role strings to Prisma `Role` enum values.
 */
export function normalizeRole(role: unknown): Role {
  const upper = String(role ?? "").trim().toUpperCase();
  switch (upper) {
    case "SUPER_ADMIN":
    case "SUPERADMIN":
      return Role.SuperAdmin;
    case "ADMIN":
      return Role.Admin;
    case "AGENT":
      return Role.Agent;
    case "DRIVER":
      return Role.Driver;
    case "USER":
    case "PASSANGER":
    case "PASSENGER":
      return Role.Passanger;
    default:
      return String(role ?? "").trim() as Role;
  }
}

/**
 * Checks if user has one of the allowed roles.
 */
export function hasRole(user: AuthenticatedUser, allowedRoles: (Role | string)[]): boolean {
  if (!user || !user.role) return false;

  const userRoleNormalized = normalizeRole(user.role.toString());
  const normalizedAllowed = allowedRoles.map((r) => normalizeRole(r.toString()));

  return normalizedAllowed.includes(userRoleNormalized);
}

/**
 * Checks if user is SuperAdmin or Admin.
 */
export function isAdminOrSuperAdmin(user: AuthenticatedUser): boolean {
  return hasRole(user, [Role.SuperAdmin, Role.Admin]);
}

/**
 * Checks if user can manage driver records.
 */
export function canManageDrivers(user: AuthenticatedUser): boolean {
  return hasRole(user, [Role.SuperAdmin, Role.Admin, Role.Agent]);
}

export function canManageEntrances(user: AuthenticatedUser): boolean {
  return hasRole(user, [Role.SuperAdmin, Role.Admin, Role.Agent]);
}

export function isAgent(user: AuthenticatedUser): boolean {
  return hasRole(user, [Role.Agent]);
}

/**
 * Checks if user is accessing their own resource OR is Admin/SuperAdmin.
 */
export function isSelfOrAdmin(user: AuthenticatedUser, targetUserId: string): boolean {
  if (user.id === targetUserId) return true;
  return isAdminOrSuperAdmin(user);
}
