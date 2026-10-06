import { redirect } from "next/navigation";

/** Marketing lives in apps/landing; the app opens on the catalogue. */
export default function Home() {
  redirect("/listings");
}
