import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Creator",
  description: "A Simpuru creator's prompts, sales and reputation on Cardano preprod.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
