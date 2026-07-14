import { notFound } from "next/navigation";
import { getGroup, groups } from "@/inspector";
import { Inspector } from "@/inspector/inspector";

export function generateStaticParams() {
  return groups.map((group) => ({ slug: group.slug }));
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ component?: string }>;
}) {
  const { slug } = await params;
  const { component } = await searchParams;
  const group = getGroup(slug);
  const entry = group?.entries.find((candidate) => candidate.slug === component);
  return { title: entry ? `${entry.name} — 4AF` : group ? `${group.name} — 4AF` : "Not found" };
}

export default async function ComponentPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ component?: string }>;
}) {
  const { slug } = await params;
  const { component } = await searchParams;
  if (!getGroup(slug)) notFound();

  return (
    <div className="pt-8">
      <Inspector slug={slug} entrySlug={component} />
    </div>
  );
}
