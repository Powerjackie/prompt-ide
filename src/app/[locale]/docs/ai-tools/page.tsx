import { redirect } from "next/navigation"

export default async function DocsAiToolsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  redirect(`/${locale}/docs/ai-tools/playground`)
}
