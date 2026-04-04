import { redirect } from "next/navigation"

export default async function DocsGettingStartedPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  redirect(`/${locale}/docs/getting-started/introduction`)
}
