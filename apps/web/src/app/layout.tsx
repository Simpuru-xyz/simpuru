import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import Nav from "@/components/Nav";
import SessionProvider from "@/components/SessionProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DESCRIPTION =
  "Design prompts you and your AI agents buy in tADA on Cardano preprod, with buyer protection: protected purchases wait in escrow and refund automatically if delivery fails.";

export const metadata: Metadata = {
  metadataBase: new URL("https://app.simpuru.xyz"),
  title: { default: "Simpuru · prompts with buyer protection", template: "%s · Simpuru" },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "Simpuru",
    title: "Simpuru · prompts with buyer protection",
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <SessionProvider>
          {/* One nav for every page, so it survives navigation and its highlight can glide. */}
          <Nav />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
