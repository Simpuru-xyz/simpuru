import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Sell a prompt",
  description: "Anyone can sell design prompts on Simpuru and get paid in tADA on Cardano preprod.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
