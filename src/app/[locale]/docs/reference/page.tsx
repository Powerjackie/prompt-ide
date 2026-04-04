import { redirect } from "next/navigation"

export default async function DocsReferencePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  redirect(`/${locale}/docs/reference/settings`)
}
