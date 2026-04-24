import type { Metadata, Viewport } from "next"
import { IBM_Plex_Sans, JetBrains_Mono, Source_Serif_4 } from "next/font/google"
import { WebVitalsReporter } from "@/components/observability/web-vitals-reporter"
import "./globals.css"

const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
})

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
})

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
    <html
      translate="no"
      className={`${sourceSerif.variable} ${ibmPlexSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full overflow-x-hidden notranslate" translate="no">
        <WebVitalsReporter />
        {children}
      </body>
    </html>
  )
}
