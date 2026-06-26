import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AppErrorBoundary } from "@/components/app-error-boundary"
import RootLayoutClient from "@/components/root-layout-client"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
})

export const metadata: Metadata = {
  title: "LeadGen OS",
  description: "Lead generation command center for Nigerian businesses",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen antialiased`}>
        <ThemeProvider>
          <AppErrorBoundary>
            <RootLayoutClient>
              {children}
            </RootLayoutClient>
          </AppErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}
