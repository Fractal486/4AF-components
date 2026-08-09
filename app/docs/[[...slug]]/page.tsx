import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import { buttonVariants } from "fumadocs-ui/components/ui/button";
import { getMDXComponents } from "@/components/mdx";
import { DownloadSkillButton } from "@/components/download-skill-button";
import { source } from "@/lib/source";

interface DocsPageProps {
  params: Promise<{ slug?: string[] }>;
}

export default async function Page({ params }: DocsPageProps) {
  const { slug = [] } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  const MdxContent = page.data.body;
  const markdownUrl = `${page.url}.md`;
  const isAgentSkillOverview = page.url === "/docs/reference/agent-skill";

  return (
    <DocsPage toc={page.data.toc}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
      <div className="not-prose -mt-1 mb-8">
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={markdownUrl}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({
              color: "secondary",
              size: "sm",
              className: "gap-2",
            })}
          >
            <FileText className="size-3.5" aria-hidden="true" />
            View as Markdown
          </a>
          {isAgentSkillOverview ? <DownloadSkillButton /> : null}
        </div>
        <div role="separator" className="mt-4 border-t border-fd-border/60" />
      </div>
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
