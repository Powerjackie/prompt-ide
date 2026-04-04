import { redirect } from "next/navigation"

export default async function DocsAdvancedPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  redirect(`/${locale}/docs/advanced/skills`)
}
