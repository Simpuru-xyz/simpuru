import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Catalogue",
  description:
    "Design prompts on Simpuru, each with a recording of what it builds. Buy in tADA on Cardano preprod; protected buys refund if delivery fails.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
