import { notFound } from "next/navigation";
import { getGroup, groups } from "@/inspector";
import { FullView } from "@/inspector/full-view";

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
  return { title: `${entry?.name ?? group?.name ?? "Not found"} — full screen` };
}

export default async function FullScreenPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const resolved = await searchParams;
  if (!getGroup(slug)) notFound();

  return <FullView slug={slug} params={resolved} />;
}
