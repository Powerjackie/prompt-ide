import type { Prompt } from "@/types/prompt"
import type { Module } from "@/types/module"

export const seedPrompts: Omit<Prompt, "id">[] = [
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
    tags: ["code", "review", "quality"],
    isFavorite: true,
    createdAt: "2026-03-20T10:00:00Z",
    updatedAt: "2026-03-28T14:00:00Z",
    lastUsedAt: "2026-03-28T14:00:00Z",
    notes: "Works well with Python, JS, and TypeScript. Test with Go next.",
    variables: [
      { name: "language", description: "Programming language", defaultValue: "Python" },
      { name: "focus_areas", description: "Review focus", defaultValue: "security, performance" },
      { name: "code", description: "Code to review", defaultValue: "" },
    ],
    agentAnalysis: null,
    lastAnalyzedAt: null,
    agentVersion: null,
    needsReanalysis: false,
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
    tags: ["writing", "report", "productivity"],
    isFavorite: false,
    createdAt: "2026-03-22T09:00:00Z",
    updatedAt: "2026-03-27T11:00:00Z",
    lastUsedAt: "2026-03-27T11:00:00Z",
    notes: "",
    variables: [
      { name: "work_items", description: "Bullet-point list of work done this week", defaultValue: "" },
    ],
    agentAnalysis: null,
    lastAnalyzedAt: null,
    agentVersion: null,
    needsReanalysis: false,
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
    tags: ["code", "documentation", "api"],
    isFavorite: true,
    createdAt: "2026-03-15T08:00:00Z",
    updatedAt: "2026-03-25T16:00:00Z",
    lastUsedAt: "2026-03-25T16:00:00Z",
    notes: "Best results with Claude for technical accuracy",
    variables: [
      { name: "method", description: "HTTP method", defaultValue: "POST" },
      { name: "path", description: "API path", defaultValue: "/api/v1/users" },
      { name: "description", description: "What this endpoint does", defaultValue: "" },
      { name: "auth_type", description: "Authentication type", defaultValue: "Bearer token" },
      { name: "request_body", description: "JSON request body example", defaultValue: "{}" },
    ],
    agentAnalysis: null,
    lastAnalyzedAt: null,
    agentVersion: null,
    needsReanalysis: false,
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
    tags: ["data", "analysis", "insights"],
    isFavorite: false,
    createdAt: "2026-03-18T12:00:00Z",
    updatedAt: "2026-03-26T10:00:00Z",
    lastUsedAt: null,
    notes: "",
    variables: [
      { name: "data", description: "Dataset or description of data", defaultValue: "" },
    ],
    agentAnalysis: null,
    lastAnalyzedAt: null,
    agentVersion: null,
    needsReanalysis: false,
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
    tags: ["translation", "writing"],
    isFavorite: false,
    createdAt: "2026-03-28T08:00:00Z",
    updatedAt: "2026-03-28T08:00:00Z",
    lastUsedAt: null,
    notes: "Needs more structure. Add formatting requirements.",
    variables: [
      { name: "source_lang", description: "Source language", defaultValue: "English" },
      { name: "target_lang", description: "Target language", defaultValue: "Chinese" },
      { name: "text", description: "Text to translate", defaultValue: "" },
    ],
    agentAnalysis: null,
    lastAnalyzedAt: null,
    agentVersion: null,
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
    tags: ["email", "communication"],
    isFavorite: false,
    createdAt: "2026-03-29T06:00:00Z",
    updatedAt: "2026-03-29T06:00:00Z",
    lastUsedAt: null,
    notes: "",
    variables: [
      { name: "topic", description: "Email topic", defaultValue: "" },
      { name: "recipient", description: "Who the email is for", defaultValue: "" },
    ],
    agentAnalysis: null,
    lastAnalyzedAt: null,
    agentVersion: null,
    needsReanalysis: true,
  },
]

export const seedModules: Omit<Module, "id">[] = [
  {
    title: "Expert Role",
    type: "role",
    content: "You are a {{domain}} expert with {{years}} years of experience. You provide precise, actionable advice based on industry best practices.",
    tags: ["role", "expert"],
    createdAt: "2026-03-20T10:00:00Z",
    updatedAt: "2026-03-20T10:00:00Z",
  },
  {
    title: "Structured Output",
    type: "output_format",
    content: "Format your response as:\n1. **Summary** (2-3 sentences)\n2. **Details** (bullet points)\n3. **Action Items** (numbered list)\n4. **Notes** (if applicable)",
    tags: ["format", "structure"],
    createdAt: "2026-03-21T10:00:00Z",
    updatedAt: "2026-03-21T10:00:00Z",
  },
  {
    title: "No Hallucination Constraint",
    type: "constraint",
    content: "Only use information explicitly provided in the input. If you are unsure or the information is insufficient, clearly state what is missing rather than guessing or fabricating information.",
    tags: ["constraint", "safety"],
    createdAt: "2026-03-22T10:00:00Z",
    updatedAt: "2026-03-22T10:00:00Z",
  },
  {
    title: "Self-Check Module",
    type: "self_check",
    content: "Before providing your final answer, verify:\n- [ ] All claims are supported by the provided input\n- [ ] The output format matches the requirements\n- [ ] No sensitive information is included\n- [ ] The response is complete and actionable",
    tags: ["self-check", "quality"],
    createdAt: "2026-03-23T10:00:00Z",
    updatedAt: "2026-03-23T10:00:00Z",
  },
]
