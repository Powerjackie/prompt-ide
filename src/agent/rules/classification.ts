interface ClassificationResult {
  category: string
  model: string
  tags: string[]
  matchedRules: string[]
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  code: ["code", "programming", "function", "debug", "refactor", "api", "sql", "python", "javascript", "typescript", "algorithm", "class", "method"],
  writing: ["write", "essay", "article", "blog", "story", "creative", "copywrite", "draft", "prose"],
  data: ["data", "analyze", "csv", "json", "dataset", "statistics", "visualization", "chart", "metrics"],
  marketing: ["marketing", "seo", "campaign", "brand", "audience", "conversion", "ad copy", "social media"],
  education: ["teach", "explain", "lesson", "quiz", "student", "curriculum", "learning", "tutorial"],
  design: ["design", "ui", "ux", "wireframe", "mockup", "layout", "color", "typography"],
  research: ["research", "literature", "review", "academic", "paper", "cite", "hypothesis", "methodology"],
  productivity: ["organize", "schedule", "plan", "workflow", "automate", "template", "task", "meeting"],
  communication: ["email", "message", "reply", "conversation", "negotiate", "presentation", "speech"],
}

const MODEL_KEYWORDS: Record<string, string[]> = {
  claude: ["claude", "anthropic", "artifacts", "xml tags"],
  gpt4: ["gpt", "openai", "chatgpt", "dalle"],
  gemini: ["gemini", "google", "bard"],
  deepseek: ["deepseek", "deep seek"],
}

export function classify(content: string): ClassificationResult {
  const lower = content.toLowerCase()
  const words = lower.split(/\s+/)
  const matchedRules: string[] = []
  const tags = new Set<string>()

  // Category detection
  let bestCategory = "general"
  let bestScore = 0
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.filter((kw) => lower.includes(kw)).length
    if (score > bestScore) {
      bestScore = score
      bestCategory = cat
    }
    if (score > 0) {
      keywords.filter((kw) => lower.includes(kw)).forEach((kw) => tags.add(kw))
    }
  }
  if (bestScore > 0) matchedRules.push(`category:keyword-match:${bestCategory}(${bestScore})`)

  // Model detection
  let detectedModel = "universal"
  for (const [model, keywords] of Object.entries(MODEL_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      detectedModel = model
      matchedRules.push(`model:keyword-match:${model}`)
      break
    }
  }

  // Tag extraction from common patterns
  if (lower.includes("step by step") || lower.includes("step-by-step")) tags.add("chain-of-thought")
  if (lower.includes("role") || lower.includes("act as") || lower.includes("you are")) tags.add("role-playing")
  if (lower.includes("json") || lower.includes("xml") || lower.includes("markdown")) tags.add("structured-output")
  if (lower.includes("example")) tags.add("few-shot")
  if (words.length > 200) tags.add("long-form")
  if (words.length < 30) tags.add("concise")

  return {
    category: bestCategory,
    model: detectedModel,
    tags: Array.from(tags).slice(0, 8),
    matchedRules,
  }
}
