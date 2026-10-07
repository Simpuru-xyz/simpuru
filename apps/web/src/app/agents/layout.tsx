import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Connect an agent",
  description:
    "Let Claude or Cursor buy prompts on Simpuru over x402, within spending limits you set. Cardano preprod.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
