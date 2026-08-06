import { UserRepository } from "./user.repository";
import { UserDto, UserResponseDto } from "./user.dto";
import { CreateUserPayload, UpdateUserPayload, UserQueryFilters } from "./user.types";
import { normalizeRole } from "@/middleware/role.middleware";
import { hashPassword } from "@/lib/auth";
import { PaginatedMeta } from "@/types/api.types";

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async getUsers(filters: UserQueryFilters): Promise<{ users: UserResponseDto[]; meta: PaginatedMeta }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;

    const { users, total } = await this.userRepository.findMany(filters);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      users: UserDto.toResponseList(users),
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async getUserById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    return UserDto.toResponse(user);
  }

  async createUser(payload: CreateUserPayload): Promise<UserResponseDto> {
    const existingEmail = await this.userRepository.findByEmail(payload.email);
    if (existingEmail) {
      throw new Error("EMAIL_ALREADY_EXISTS");
    }

    const existingUsername = await this.userRepository.findByUsername(payload.username);
    if (existingUsername) {
      throw new Error("USERNAME_ALREADY_EXISTS");
    }

    const hashedPassword = await hashPassword(payload.password);
    const normalizedRole = normalizeRole(payload.role.toString());

    const newUser = await this.userRepository.create({
      email: payload.email,
      username: payload.username,
      firstName: payload.firstName,
      lastName: payload.lastName,
      phoneNumber: payload.phoneNumber,
      hashedPassword,
      role: normalizedRole,
      status: payload.status || "active",
    });

    return UserDto.toResponse(newUser);
  }

  async updateUser(id: string, payload: UpdateUserPayload): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    if (payload.email && payload.email !== user.email) {
      const existingEmail = await this.userRepository.findByEmail(payload.email);
      if (existingEmail) {
        throw new Error("EMAIL_ALREADY_EXISTS");
      }
    }

    if (payload.username && payload.username !== user.username) {
      const existingUsername = await this.userRepository.findByUsername(payload.username);
      if (existingUsername) {
        throw new Error("USERNAME_ALREADY_EXISTS");
      }
    }

    let hashedPassword: string | undefined = undefined;
    if (payload.password) {
      hashedPassword = await hashPassword(payload.password);
    }

    const normalizedRole = payload.role ? normalizeRole(payload.role.toString()) : undefined;

    const updatedUser = await this.userRepository.update(id, {
      email: payload.email,
      username: payload.username,
      firstName: payload.firstName,
      lastName: payload.lastName,
      phoneNumber: payload.phoneNumber,
      role: normalizedRole,
      status: payload.status,
      hashedPassword,
    });

    return UserDto.toResponse(updatedUser);
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    await this.userRepository.delete(id);
  }
}
