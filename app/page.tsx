import { notFound, redirect } from "next/navigation";
import { groups } from "@/inspector";

export default function IndexPage() {
  const group = groups[0];
  const entry = group?.entries[0];

  if (!group || !entry) notFound();

  redirect(`/c/${group.slug}?component=${entry.slug}`);
}
