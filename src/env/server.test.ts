import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ZodError } from "zod"

const validEnv = {
  NODE_ENV: "test",
  DATABASE_URL: "file:./test.db",
  ADMIN_PASSWORD: "admin-password",
  MEMBER_PASSWORD: "member-password",
  MINIMAX_API_KEY: "minimax-key",
  NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=",
} satisfies NodeJS.ProcessEnv

const originalEnv = { ...process.env }

beforeEach(() => {
  vi.resetModules()
  process.env = { ...originalEnv, ...validEnv }
})

afterEach(() => {
  process.env = { ...originalEnv }
})

async function loadServerModule() {
  return import("./server")
}

function expectMissingField(error: unknown, field: string) {
  expect(error).toBeInstanceOf(ZodError)
  const issues = (error as ZodError).issues
  expect(issues.some((issue) => issue.path.join(".") === field)).toBe(true)
}

describe("parseServerEnv", () => {
  it("fails when DATABASE_URL is missing", async () => {
    const { parseServerEnv } = await loadServerModule()

    try {
      parseServerEnv({ ...validEnv, DATABASE_URL: undefined })
      throw new Error("Expected parseServerEnv to throw")
    } catch (error) {
      expectMissingField(error, "DATABASE_URL")
    }
  })

  it("fails when ADMIN_PASSWORD is missing", async () => {
    const { parseServerEnv } = await loadServerModule()

    try {
      parseServerEnv({ ...validEnv, ADMIN_PASSWORD: undefined })
      throw new Error("Expected parseServerEnv to throw")
    } catch (error) {
      expectMissingField(error, "ADMIN_PASSWORD")
    }
  })

  it("fails when MINIMAX_API_KEY is missing", async () => {
    const { parseServerEnv } = await loadServerModule()

    try {
      parseServerEnv({ ...validEnv, MINIMAX_API_KEY: undefined })
      throw new Error("Expected parseServerEnv to throw")
    } catch (error) {
      expectMissingField(error, "MINIMAX_API_KEY")
    }
  })

  it("fails when NEXT_SERVER_ACTIONS_ENCRYPTION_KEY is invalid", async () => {
    const { parseServerEnv } = await loadServerModule()

    expect(() => parseServerEnv({ ...validEnv, NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: "not-valid-base64" })).toThrow(
      /NEXT_SERVER_ACTIONS_ENCRYPTION_KEY must be base64/
    )
  })

  it("passes when NEXT_SERVER_ACTIONS_ENCRYPTION_KEY is valid", async () => {
    const { parseServerEnv } = await loadServerModule()
    const parsed = parseServerEnv(validEnv)

    expect(parsed.DATABASE_URL).toBe("file:./test.db")
    expect(parsed.NODE_ENV).toBe("test")
  })
})
