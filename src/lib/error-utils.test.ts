import { describe, expect, it } from "vitest"
import { APIConnectionError } from "openai"
import { formatActionError, isNetworkActionError } from "./error-utils"

describe("error-utils", () => {
  it("recognizes transport error codes", () => {
    expect(isNetworkActionError({ code: "ECONNREFUSED" })).toBe(true)
    expect(isNetworkActionError({ code: "ETIMEDOUT" })).toBe(true)
  })

  it("recognizes OpenAI connection errors", () => {
    const error = new APIConnectionError({ message: "fetch failed" })
    expect(isNetworkActionError(error)).toBe(true)
  })

  it("treats timed out errors as network failures", () => {
    expect(formatActionError(new Error("Request timed out."), "zh")).toBe("AI 服务暂时不可用，请稍后重试")
  })

  it("returns localized friendly network messages", () => {
    const error = new Error("fetch failed")

    expect(formatActionError(error, "zh")).toBe("AI 服务暂时不可用，请稍后重试")
    expect(formatActionError(error, "en")).toBe(
      "AI service temporarily unavailable, please try again later"
    )
  })

  it("preserves non-network error messages", () => {
    expect(formatActionError(new Error("Prompt version not found"), "en")).toBe(
      "Prompt version not found"
    )
  })
})
