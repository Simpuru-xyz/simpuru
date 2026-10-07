import type { Metadata } from "next";
import type { ReactNode } from "react";
import { fetchListingOrNull, formatAda } from "@/lib/api";

/** The listing's own title and description, so a shared link previews the prompt. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await fetchListingOrNull(id).catch(() => null);
  if (!listing) return { title: "Prompt" };
  const description = `${listing.description} ${formatAda(listing.priceLovelace)} tADA on Cardano preprod.`;
  return {
    title: listing.title,
    description,
    openGraph: { title: listing.title, description },
  };
}

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
