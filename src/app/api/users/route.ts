import { NextRequest } from "next/server";
import { UserController } from "@/modules/users/user.controller";

export const dynamic = "force-dynamic";

const userController = new UserController();

export async function GET(req: NextRequest) {
  return userController.getUsers(req);
}

export async function POST(req: NextRequest) {
  return userController.createUser(req);
}
