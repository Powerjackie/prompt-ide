import { redirect } from "next/navigation"

export default async function DocsCoreFeaturesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  redirect(`/${locale}/docs/core-features/prompts`)
}
