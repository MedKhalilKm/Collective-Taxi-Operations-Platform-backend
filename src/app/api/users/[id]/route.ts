import { NextRequest } from "next/server";
import { UserController } from "@/modules/users/user.controller";

export const dynamic = "force-dynamic";

const userController = new UserController();

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return userController.getUserById(req, id);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return userController.updateUser(req, id);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return userController.deleteUser(req, id);
}
