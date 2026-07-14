import { notFound } from "next/navigation";
import { getGroup, groups } from "@/inspector";
import { Inspector } from "@/inspector/inspector";

export function generateStaticParams() {
  return groups.map((group) => ({ slug: group.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const group = getGroup(slug);
  return { title: group ? `${group.name} — 4AF` : "Not found" };
}

export default async function ComponentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!getGroup(slug)) notFound();

  return (
    <div className="pt-8">
      <Inspector slug={slug} />
    </div>
  );
}
