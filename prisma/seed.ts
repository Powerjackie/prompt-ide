import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import { readFileSync } from "fs"
import { dirname, resolve } from "path"
import { fileURLToPath } from "url"

const __dir = dirname(fileURLToPath(import.meta.url))
const envContent = readFileSync(resolve(__dir, "..", ".env"), "utf-8")

for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) {
    process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, "")
  }
}

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const seedPrompts = [
  {
    title: "Code Review Assistant",
    description: "Structured code review with issue categorization and fix suggestions",
    content: `You are a senior code reviewer. Review the following code and output a structured report.

**Language**: {{language}}
**Focus**: {{focus_areas}}

\`\`\`{{language}}
{{code}}
\`\`\`

Output format:
## Review Summary
- Quality Rating: [A/B/C/D]
- Issues Found: [N]

## Issues
### [Severity] Issue Title
- **Line**: X
- **Description**: ...
- **Suggestion**: ...

## Recommendations
- ...`,
    status: "production",
    source: "internal",
    model: "universal",
    category: "code",
    tags: JSON.stringify(["code", "review", "quality"]),
    isFavorite: true,
    notes: "Works well with Python, JS, and TypeScript. Test with Go next.",
    variables: JSON.stringify([
      { name: "language", description: "Programming language", defaultValue: "Python" },
      {
        name: "focus_areas",
        description: "Review focus",
        defaultValue: "security, performance",
      },
      { name: "code", description: "Code to review", defaultValue: "" },
    ]),
  },
  {
    title: "Weekly Report Generator",
    description: "Generate structured weekly reports from bullet points",
    content: `Based on the following work items, generate a professional weekly report.

**Work Items**:
{{work_items}}

**Report Structure**:
1. This Week's Summary
2. Key Achievements
3. Next Week's Plan
4. Items Requiring Coordination

Use professional workplace language. Keep it concise.`,
    status: "production",
    source: "adapted",
    model: "universal",
    category: "writing",
    tags: JSON.stringify(["writing", "report", "productivity"]),
    isFavorite: false,
    notes: "",
    variables: JSON.stringify([
      {
        name: "work_items",
        description: "Bullet-point list of work done this week",
        defaultValue: "",
      },
    ]),
  },
  {
    title: "API Documentation Writer",
    description: "Generate API docs from endpoint specifications",
    content: `You are a technical writer. Generate clear API documentation for the following endpoint.

Endpoint: {{method}} {{path}}
Description: {{description}}
Auth: {{auth_type}}

Request body:
\`\`\`json
{{request_body}}
\`\`\`

Generate:
1. Endpoint description
2. Request parameters table
3. Request body schema
4. Response examples (success + error)
5. Usage notes`,
    status: "production",
    source: "internal",
    model: "claude",
    category: "code",
    tags: JSON.stringify(["code", "documentation", "api"]),
    isFavorite: true,
    notes: "Best results with Claude for technical accuracy",
    variables: JSON.stringify([
      { name: "method", description: "HTTP method", defaultValue: "POST" },
      { name: "path", description: "API path", defaultValue: "/api/v1/users" },
      { name: "description", description: "What this endpoint does", defaultValue: "" },
      { name: "auth_type", description: "Authentication type", defaultValue: "Bearer token" },
      {
        name: "request_body",
        description: "JSON request body example",
        defaultValue: "{}",
      },
    ]),
  },
  {
    title: "Data Analysis Helper",
    description: "Analyze dataset and provide insights",
    content: `Analyze the following data and provide structured insights.

{{data}}

Please provide:
1. Summary statistics
2. Key patterns and trends
3. Anomalies or outliers
4. Actionable recommendations`,
    status: "production",
    source: "internal",
    model: "gpt4",
    category: "data",
    tags: JSON.stringify(["data", "analysis", "insights"]),
    isFavorite: false,
    notes: "",
    variables: JSON.stringify([
      { name: "data", description: "Dataset or description of data", defaultValue: "" },
    ]),
  },
  {
    title: "Quick Translation",
    description: "Rough idea for a multi-language translation prompt",
    content: `Translate the following text from {{source_lang}} to {{target_lang}}. Keep the tone and style.

{{text}}`,
    status: "inbox",
    source: "external",
    model: "universal",
    category: "writing",
    tags: JSON.stringify(["translation", "writing"]),
    isFavorite: false,
    notes: "Needs more structure. Add formatting requirements.",
    variables: JSON.stringify([
      { name: "source_lang", description: "Source language", defaultValue: "English" },
      { name: "target_lang", description: "Target language", defaultValue: "Chinese" },
      { name: "text", description: "Text to translate", defaultValue: "" },
    ]),
    needsReanalysis: true,
  },
  {
    title: "Email Draft Ideas",
    description: "Unstructured idea for professional email writing",
    content: `Help me write a professional email about {{topic}} to {{recipient}}.`,
    status: "inbox",
    source: "external",
    model: "universal",
    category: "communication",
    tags: JSON.stringify(["email", "communication"]),
    isFavorite: false,
    notes: "",
    variables: JSON.stringify([
      { name: "topic", description: "Email topic", defaultValue: "" },
      { name: "recipient", description: "Who the email is for", defaultValue: "" },
    ]),
    needsReanalysis: true,
  },
]

const seedModules = [
  {
    title: "Expert Role",
    type: "role",
    content:
      "You are a {{domain}} expert with {{years}} years of experience. You provide precise, actionable advice based on industry best practices.",
    tags: JSON.stringify(["role", "expert"]),
  },
  {
    title: "Structured Output",
    type: "output_format",
    content:
      "Format your response as:\n1. **Summary** (2-3 sentences)\n2. **Details** (bullet points)\n3. **Action Items** (numbered list)\n4. **Notes** (if applicable)",
    tags: JSON.stringify(["format", "structure"]),
  },
  {
    title: "No Hallucination Constraint",
    type: "constraint",
    content:
      "Only use information explicitly provided in the input. If you are unsure or the information is insufficient, clearly state what is missing rather than guessing or fabricating information.",
    tags: JSON.stringify(["constraint", "safety"]),
  },
  {
    title: "Self-Check Module",
    type: "self_check",
    content:
      "Before providing your final answer, verify:\n- [ ] All claims are supported by the provided input\n- [ ] The output format matches the requirements\n- [ ] No sensitive information is included\n- [ ] The response is complete and actionable",
    tags: JSON.stringify(["self-check", "quality"]),
  },
]

async function main() {
  console.log("Seeding database...")

  const existingPrompts = await prisma.prompt.count()
  if (existingPrompts > 0) {
    console.log(`Database already has ${existingPrompts} prompts. Skipping seed.`)
    return
  }

  const createdPrompts = []
  for (const prompt of seedPrompts) {
    createdPrompts.push(await prisma.prompt.create({ data: prompt }))
  }
  console.log(`  Created ${createdPrompts.length} prompts`)

  const createdModules = []
  for (const moduleSeed of seedModules) {
    createdModules.push(await prisma.module.create({ data: moduleSeed }))
  }
  console.log(`  Created ${createdModules.length} modules`)

  const entryPrompt = createdPrompts[0]
  const starterCollection = await prisma.collection.create({
    data: {
      title: "Prompt Engineering Starter Pack",
      description: "A clean starter pack that links a production prompt with reusable guidance modules.",
      type: "toolkit",
    },
  })

  await prisma.collectionItem.createMany({
    data: [
      {
        collectionId: starterCollection.id,
        itemType: "prompt",
        promptId: entryPrompt.id,
        position: 0,
      },
      {
        collectionId: starterCollection.id,
        itemType: "module",
        moduleId: createdModules[0].id,
        position: 1,
      },
    ],
  })

  const baselineVersion = await prisma.promptVersion.create({
    data: {
      promptId: entryPrompt.id,
      versionNumber: 1,
      isBaseline: true,
      changeSummary: "Initial production baseline",
      title: entryPrompt.title,
      description: entryPrompt.description,
      content: entryPrompt.content,
      status: entryPrompt.status,
      source: entryPrompt.source,
      model: entryPrompt.model,
      category: entryPrompt.category,
      tags: entryPrompt.tags,
      notes: entryPrompt.notes,
      variables: entryPrompt.variables,
    },
  })

  await prisma.benchmarkRun.create({
    data: {
      promptId: entryPrompt.id,
      promptVersionId: baselineVersion.id,
      evaluator: "MiniMax-M2.7",
      input: entryPrompt.content,
      summary: "This prompt is stable, structured, and suitable as a reusable production baseline.",
      overallScore: 88,
      clarityScore: 90,
      reusabilityScore: 86,
      controllabilityScore: 87,
      deploymentReadinessScore: 89,
      improvementSuggestions: JSON.stringify([
        "Add a stricter section on edge-case handling.",
        "Parameterize reviewer tone for different audiences.",
      ]),
      recommendedForProduction: true,
      rawOutput: JSON.stringify({
        overallScore: 88,
        clarityScore: 90,
        reusabilityScore: 86,
        controllabilityScore: 87,
        deploymentReadinessScore: 89,
        summary:
          "This prompt is stable, structured, and suitable as a reusable production baseline.",
        improvementSuggestions: [
          "Add a stricter section on edge-case handling.",
          "Parameterize reviewer tone for different audiences.",
        ],
        recommendedForProduction: true,
      }),
    },
  })

  const seededSkill = await prisma.skill.create({
    data: {
      name: "Code Review Skill",
      description:
        "A reusable capability shell for structured code review with clear scoring and issue reporting.",
      goal: "Turn source code and review focus areas into a production-ready review report.",
      status: "active",
      entryPromptId: entryPrompt.id,
      collectionId: starterCollection.id,
      recommendedModel: "universal",
      inputSchema: JSON.stringify({
        language: "Programming language under review",
        focus_areas: "Areas that deserve extra attention",
        code: "Source code to inspect",
      }),
      outputSchema: JSON.stringify({
        review_summary: "Short summary of quality and risks",
        issues: "Structured list of problems with severity and line references",
        recommendations: "Actionable next steps",
      }),
      notes: "Use as the default demonstration capability for smoke and manual milestone checks.",
    },
  })

  await prisma.setting.upsert({
    where: { key: "skill-run-state" },
    create: {
      key: "skill-run-state",
      value: JSON.stringify({
        recentValuesBySkillId: {
          [seededSkill.id]: {
            language: "TypeScript",
            focus_areas: "security, readability",
            code: "export function sum(a: number, b: number) { return a + b }",
          },
        },
        presetsBySkillId: {
          [seededSkill.id]: [
            {
              id: "seed-preset-ts-review",
              name: "TypeScript review",
              values: {
                language: "TypeScript",
                focus_areas: "security, readability",
                code: "export function sum(a: number, b: number) { return a + b }",
              },
              updatedAt: new Date().toISOString(),
            },
          ],
        },
        recentRunsBySkillId: {
          [seededSkill.id]: [
            {
              id: "seed-run-code-review",
              values: {
                language: "TypeScript",
                focus_areas: "security, readability",
                code: "export function sum(a: number, b: number) { return a + b }",
              },
              renderedPrompt: entryPrompt.content
                .replaceAll("{{language}}", "TypeScript")
                .replaceAll("{{focus_areas}}", "security, readability")
                .replaceAll(
                  "{{code}}",
                  "export function sum(a: number, b: number) { return a + b }"
                ),
              summary: "Recent validation run confirms the skill is stable for lightweight code review prompts.",
              riskLevel: "low",
              confidence: 0.84,
              createdAt: new Date().toISOString(),
            },
          ],
        },
      }),
    },
    update: {
      value: JSON.stringify({
        recentValuesBySkillId: {
          [seededSkill.id]: {
            language: "TypeScript",
            focus_areas: "security, readability",
            code: "export function sum(a: number, b: number) { return a + b }",
          },
        },
        presetsBySkillId: {
          [seededSkill.id]: [
            {
              id: "seed-preset-ts-review",
              name: "TypeScript review",
              values: {
                language: "TypeScript",
                focus_areas: "security, readability",
                code: "export function sum(a: number, b: number) { return a + b }",
              },
              updatedAt: new Date().toISOString(),
            },
          ],
        },
        recentRunsBySkillId: {
          [seededSkill.id]: [
            {
              id: "seed-run-code-review",
              values: {
                language: "TypeScript",
                focus_areas: "security, readability",
                code: "export function sum(a: number, b: number) { return a + b }",
              },
              renderedPrompt: entryPrompt.content
                .replaceAll("{{language}}", "TypeScript")
                .replaceAll("{{focus_areas}}", "security, readability")
                .replaceAll(
                  "{{code}}",
                  "export function sum(a: number, b: number) { return a + b }"
                ),
              summary: "Recent validation run confirms the skill is stable for lightweight code review prompts.",
              riskLevel: "low",
              confidence: 0.84,
              createdAt: new Date().toISOString(),
            },
          ],
        },
      }),
    },
  })

  console.log("  Created 1 collection")
  console.log("  Created 1 baseline prompt version")
  console.log("  Created 1 benchmark run")
  console.log("  Created 1 skill with runner state")
  console.log("Seeding complete.")
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
