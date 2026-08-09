import { notFound } from "next/navigation";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import { getMDXComponents } from "@/components/mdx";
import { source } from "@/lib/source";

interface DocsPageProps {
  params: Promise<{ slug?: string[] }>;
}

export default async function Page({ params }: DocsPageProps) {
  const { slug = [] } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  const MdxContent = page.data.body;

  return (
    <DocsPage toc={page.data.toc}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MdxContent components={getMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({ params }: DocsPageProps) {
  const { slug = [] } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  return {
    title: `${page.data.title} — 4AF`,
    description: page.data.description,
  };
}
