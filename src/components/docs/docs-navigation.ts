export interface DocsNavItem {
  slug: string
  titleKey: string
}

export interface DocsNavGroup {
  slug: string
  titleKey: string
  descriptionKey: string
  items: DocsNavItem[]
}

export interface DocsHeading {
  id: string
  text: string
  level: 2 | 3
}

export const docsNavGroups: readonly DocsNavGroup[] = [
  {
    slug: "getting-started",
    titleKey: "nav.gettingStarted",
    descriptionKey: "groups.gettingStarted",
    items: [
      { slug: "getting-started/introduction", titleKey: "nav.introduction" },
      { slug: "getting-started/login", titleKey: "nav.login" },
      { slug: "getting-started/quick-tour", titleKey: "nav.quickTour" },
    ],
  },
  {
    slug: "core-features",
    titleKey: "nav.coreFeatures",
    descriptionKey: "groups.coreFeatures",
    items: [
      { slug: "core-features/prompts", titleKey: "nav.prompts" },
      { slug: "core-features/editor", titleKey: "nav.editor" },
      { slug: "core-features/variables", titleKey: "nav.variables" },
      { slug: "core-features/modules", titleKey: "nav.modules" },
      { slug: "core-features/collections", titleKey: "nav.collections" },
      { slug: "core-features/tags", titleKey: "nav.tags" },
    ],
  },
  {
    slug: "ai-tools",
    titleKey: "nav.aiTools",
    descriptionKey: "groups.aiTools",
    items: [
      { slug: "ai-tools/playground", titleKey: "nav.playground" },
      { slug: "ai-tools/analysis", titleKey: "nav.analysis" },
      { slug: "ai-tools/refactor", titleKey: "nav.refactor" },
      { slug: "ai-tools/benchmark", titleKey: "nav.benchmark" },
    ],
  },
  {
    slug: "advanced",
    titleKey: "nav.advanced",
    descriptionKey: "groups.advanced",
    items: [
      { slug: "advanced/skills", titleKey: "nav.skills" },
      { slug: "advanced/versions", titleKey: "nav.versions" },
      { slug: "advanced/inbox", titleKey: "nav.inbox" },
      { slug: "advanced/archive-favorites", titleKey: "nav.archiveFavorites" },
    ],
  },
  {
    slug: "reference",
    titleKey: "nav.reference",
    descriptionKey: "groups.reference",
    items: [
      { slug: "reference/settings", titleKey: "nav.settings" },
      { slug: "reference/keyboard-shortcuts", titleKey: "nav.keyboardShortcuts" },
      { slug: "reference/faq", titleKey: "nav.faq" },
    ],
  },
] as const

export const docsNavItems = docsNavGroups.flatMap((group) => group.items)

export function getDocsHref(slug: string) {
  return `/docs/${slug}`
}
