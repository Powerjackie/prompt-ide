import { z } from "zod"

const base64AesKey = z
  .string()
  .min(1, "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY is required")
  .refine((value) => {
    try {
      const buf = Buffer.from(value, "base64")
      return [16, 24, 32].includes(buf.length)
    } catch {
      return false
    }
  }, "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY must be base64 and decode to 16, 24, or 32 bytes")

export const serverEnv = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    ADMIN_PASSWORD: z.string().min(1, "ADMIN_PASSWORD is required"),
    MEMBER_PASSWORD: z.string().optional(),
    MINIMAX_API_KEY: z.string().min(1, "MINIMAX_API_KEY is required"),
    NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: base64AesKey,
  })
  .parse(process.env)
