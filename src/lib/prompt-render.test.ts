import { describe, expect, it } from "vitest"
import { extractPromptVariables, renderPromptTemplate } from "./prompt-render"

describe("prompt-render helpers", () => {
  it("extracts unique template variables in appearance order", () => {
    expect(extractPromptVariables("Hello {{name}}, your role is {{role}} and {{name}}"))
      .toEqual(["name", "role"])
  })

  it("renders provided variables and uses fallback for missing values", () => {
    expect(renderPromptTemplate("Hello {{name}} from {{team}}", { name: "Ada" }))
      .toBe("Hello Ada from [team]")
  })
})
