import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const TITLE = "Simpuru | pay per prompt, not per month";
const DESCRIPTION =
  "Buy design prompts one at a time with test ADA on Cardano preprod (testnet), yourself or through your agent. With protection, you're refunded if it never arrives.";

/**
 * Share previews: links pasted into X, Telegram, Discord or a submission form
 * show this title, description and the hero still in public/og.png (1200×630).
 */
export const metadata: Metadata = {
  metadataBase: new URL("https://simpuru.xyz"),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: "https://simpuru.xyz",
    siteName: "Simpuru",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      { url: "/og.png", width: 1200, height: 630, alt: "Simpuru: pay per prompt, not per month" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
