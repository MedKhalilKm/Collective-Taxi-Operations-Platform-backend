import { z } from "zod";

export const loginSchema = z
  .object({
    email: z.string().email("Invalid email format").optional(),
    username: z.string().min(2, "Username must be at least 2 characters").optional(),
    password: z.string().min(8, "Password must be at least 8 characters long"),
  })
  .refine((data) => data.email || data.username, {
    message: "Either email or username must be provided",
    path: ["email"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters long")
      .max(128, "New password must not exceed 128 characters"),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
  redirectTo: z.string().url("Reset redirect URL must be a valid URL").optional(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters long")
    .max(128, "New password must not exceed 128 characters"),
});

export type LoginDtoInput = z.infer<typeof loginSchema>;
export type ChangePasswordDtoInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordDtoInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDtoInput = z.infer<typeof resetPasswordSchema>;
