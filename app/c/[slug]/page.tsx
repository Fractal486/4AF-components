import { notFound } from "next/navigation";
import { entries, getEntry } from "@/inspector";
import { Inspector } from "@/inspector/inspector";

export function generateStaticParams() {
  return entries.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getEntry(slug);
  return { title: entry ? `${entry.name} — 4AF` : "Not found" };
}

export default async function ComponentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!getEntry(slug)) notFound();

  return (
    <div className="pt-8">
      <Inspector slug={slug} />
    </div>
  );
}
