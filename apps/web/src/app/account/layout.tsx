import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Account",
  description: "Your Simpuru wallet, purchases and sales on Cardano preprod.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
