import { describe, expect, it } from "vitest"
import { deriveSkillHealth, getSkillAttentionKey, getSkillHealthVariant } from "./skill-health"

describe("skill-health helpers", () => {
  it("marks a fully healthy skill as ready/stable/default", () => {
    const health = deriveSkillHealth({
      latestBenchmark: {
        id: "b1",
        promptId: "p1",
        promptVersionId: "pv1",
        promptVersionNumber: 1,
        promptVersionChangeSummary: "Initial",
        evaluator: "MiniMax",
        input: "input",
        summary: "summary",
        overallScore: 91,
        clarityScore: 92,
        reusabilityScore: 90,
        controllabilityScore: 89,
        deploymentReadinessScore: 93,
        improvementSuggestions: [],
        recommendedForProduction: true,
        rawOutput: {},
        createdAt: "2026-04-04T00:00:00.000Z",
      },
      baselineVersion: {
        id: "pv1",
        promptId: "p1",
        versionNumber: 1,
        isBaseline: true,
        changeSummary: "Initial",
        title: "Prompt",
        description: "",
        content: "Hello",
        status: "production",
        source: "",
        model: "universal",
        category: "general",
        tags: [],
        notes: "",
        variables: [],
        createdAt: "2026-04-04T00:00:00.000Z",
      },
      recentRun: {
        id: "r1",
        values: {},
        renderedPrompt: "Hello",
        summary: "Run summary",
        riskLevel: "medium",
        confidence: 0.92,
        createdAt: "2026-04-04T00:00:00.000Z",
      },
    })

    expect(health.state).toBe("ready")
    expect(getSkillAttentionKey(health)).toBe("stable")
    expect(getSkillHealthVariant(health.state)).toBe("default")
  })

  it("marks a skill without baseline as setup/needsBaseline", () => {
    const health = deriveSkillHealth({
      latestBenchmark: null,
      baselineVersion: null,
      recentRun: null,
    })

    expect(health.state).toBe("setup")
    expect(getSkillAttentionKey(health)).toBe("needsBaseline")
    expect(getSkillHealthVariant(health.state)).toBe("outline")
  })
})
