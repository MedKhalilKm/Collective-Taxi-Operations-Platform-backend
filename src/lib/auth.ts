import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { prisma } from "@/lib/prisma";

const authSecret =
  process.env.BETTER_AUTH_SECRET || "super_secret_taxi_collectif_jwt_key_2026";

const authBaseUrl =
  process.env.BETTER_AUTH_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://localhost:3000";

const trustedOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const isProduction = process.env.NODE_ENV === "production";

export { hashPassword, verifyPassword };

export const auth = betterAuth({
  appName: "Taxi Collectif",
  secret: authSecret,
  baseURL: authBaseUrl,
  ...(trustedOrigins?.length ? { trustedOrigins } : {}),

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    password: {
      hash: hashPassword,
      verify: verifyPassword,
    },
  },

  user: {
    additionalFields: {
      username: {
        type: "string",
        required: true,
        input: false,
      },
      firstName: {
        type: "string",
        required: true,
        input: false,
      },
      lastName: {
        type: "string",
        required: true,
        input: false,
      },
      phoneNumber: {
        type: "string",
        required: true,
        input: false,
      },
      passwd: {
        type: "string",
        required: true,
        input: false,
        returned: false,
      },
      status: {
        type: "string",
        required: false,
        defaultValue: "active",
        input: false,
      },
      role: {
        type: "string",
        required: true,
        defaultValue: "Passanger",
        input: false,
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },

  advanced: {
    useSecureCookies: isProduction,
    defaultCookieAttributes: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
    },
    cookiePrefix: "taxi_collectif",
  },
});

export type Auth = typeof auth;
