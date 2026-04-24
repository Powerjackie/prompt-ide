import type { Metadata, Viewport } from "next"
import { WebVitalsReporter } from "@/components/observability/web-vitals-reporter"
import "./globals.css"

export const metadata: Metadata = {
  title: "Prompt IDE",
  description: "Personal Prompt IDE & Asset Library",
  other: {
    google: "notranslate",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html translate="no" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full overflow-x-hidden notranslate" translate="no">
        <WebVitalsReporter />
        {children}
      </body>
    </html>
  )
}
