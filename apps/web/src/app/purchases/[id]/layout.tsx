import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Purchase",
  description: "The escrow timeline of a Simpuru purchase on Cardano preprod.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
