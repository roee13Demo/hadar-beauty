import type { Metadata, Viewport } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import { he } from "@/lib/i18n/he";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileNav } from "@/components/layout/MobileNav";
import { QuickAddFAB } from "@/components/layout/QuickAddFAB";
import { Toaster } from "@/components/ui/toaster";
import {
  ThemeProvider,
  NO_FLASH_SCRIPT,
} from "@/components/providers/ThemeProvider";

const rubik = Rubik({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rubik",
  display: "swap",
});

export const metadata: Metadata = {
  title: he.app.name,
  description: he.app.tagline,
  // PWA / iOS home-screen appearance
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: he.app.name,
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#9C7A6F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={rubik.variable}
      suppressHydrationWarning
    >
      <head>
        {/* Apply the saved theme synchronously to prevent a flash of
            light mode on first paint. Runs before React hydrates. */}
        <script
          dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <ThemeProvider>
          <div className="flex min-h-screen">
            {/* Desktop sidebar — hidden on mobile */}
            <Sidebar />

            {/* Main content area */}
            <main className="flex min-h-screen flex-1 flex-col overflow-x-hidden">
              {/* Mobile-only top header */}
              <MobileHeader />

              {/* Page content — bottom padding clears the fixed mobile nav */}
              <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-32 sm:px-8 sm:py-8 md:pb-8 lg:px-10 lg:py-10">
                {children}
              </div>
            </main>
          </div>

          {/* Floating quick-add button — mobile only */}
          <QuickAddFAB />

          {/* Mobile-only bottom tab bar */}
          <MobileNav />

          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
