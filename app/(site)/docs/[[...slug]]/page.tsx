import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { COMPONENT_CATALOG_URL, componentCatalogToc } from "@/components/component-catalog";
import { getMDXComponents } from "@/components/mdx";
import { InlineLink } from "@/components/inline-link";
import { ArticleColumn } from "@/components/site/article-column";
import { ComponentPlayground } from "@/components/site/component-playground";
import { NavIcon, hasNavIcon } from "@/components/site/nav-icons";
import { PageFrame } from "@/components/site/page-frame";
import { siblings } from "@/lib/site-nav";
import { source } from "@/lib/source";
import { pageAlternates, publicInstallCommand, SITE_URL } from "@/lib/site";
import { CopyButton } from "@/registry/ui/copy-button/copy-button";
import { Link as LinkIcon } from "lucide-react";
import { playgroundDemos } from "@/stories/demo-names";

interface DocsPageProps {
  params: Promise<{ slug?: string[] }>;
}

export const dynamicParams = false;

export default async function Page({ params }: DocsPageProps) {
  const { slug = [] } = await params;
  // The overview lives at `/`; the docs index stays as content for the Markdown export.
  if (slug.length === 0) redirect("/");
  const page = source.getPage(slug);
  if (!page) notFound();

  const MdxContent = page.data.body;
  const { previous, next } = siblings(page.url);
  const toc = [
    ...page.data.toc.map((entry) => ({
      id: entry.url.slice(1),
      title: entry.title,
      level: entry.depth,
    })),
    // The catalog's sections are rendered by a component, out of Fumadocs' sight.
    ...(page.url === COMPONENT_CATALOG_URL ? componentCatalogToc : []),
  ];

  const demos = slug.length === 1 ? playgroundDemos(slug[0]!, page.data.title) : [];
  if (demos.length > 0) {
    const link = (item?: { title: string; href: string }) =>
      item ? { title: item.title, href: item.href } : undefined;
    return (
      <ComponentPlayground
        // Each component starts from its own preview, not the last page's demo or view.
        key={page.url}
        title={page.data.title}
        description={page.data.description}
        demos={demos}
        previous={link(previous)}
        next={link(next)}
        toc={toc}
        installCommand={publicInstallCommand(slug[0]!)}
        markdownUrl={`${SITE_URL}${page.url}.md`}
        icon={hasNavIcon(page.url) ? <NavIcon href={page.url} className="size-5 text-muted-foreground" /> : undefined}
        fullscreenHref={page.url === "/docs/sidebar-layout" ? "/full/sidebar-layout" : undefined}
      >
        <MdxContent components={getMDXComponents()} />
      </ComponentPlayground>
    );
  }

  return (
    <ArticleColumn>
    <PageFrame toc={toc}>
      <article>
        <header className="mb-8 flex flex-col gap-3">
          <h1 className="flex items-center gap-3 text-[length:clamp(1.75rem,3vw,2.25rem)] leading-[1.15] font-semibold tracking-[-0.03em] text-balance">
            {hasNavIcon(page.url) ? <NavIcon href={page.url} className="size-[0.8em] text-muted-foreground" /> : null}
            {page.data.title}
          </h1>
          {page.data.description ? (
            <p className="max-w-[60ch] text-[17px] leading-[1.6] tracking-[-0.01em] text-pretty text-muted-foreground">
              {page.data.description}
            </p>
          ) : null}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-3">
              <CopyButton
                value={`${SITE_URL}${page.url}.md`}
                icon={<LinkIcon />}
                variant="outline"
                size="sm"
                iconPosition="start"
                swapLabel={false}
                className="cursor-default bg-background"
              >
                Copy link
              </CopyButton>
              <InlineLink
                href={`${page.url}.md`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View Markdown in a new tab"
                className="text-xs"
              >
                View ↗
              </InlineLink>
            </div>
          </div>
        </header>

        <div className="prose max-w-none">
          <MdxContent components={getMDXComponents()} />
        </div>

        {previous || next ? (
          <nav aria-label="Pages" className="mt-16 grid grid-cols-2 gap-3 border-t pt-6">
            {previous ? (
              <Link
                href={previous.href}
                className="flex flex-col gap-1 rounded-lg p-3 outline-none transition-[background-color] duration-(--duration-fast) hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex items-center gap-1 font-mono text-2xs text-subtle-foreground">
                  <ArrowLeft className="size-3" aria-hidden />
                  Previous
                </span>
                <span className="text-sm font-medium">{previous.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={next.href}
                className="flex flex-col items-end gap-1 rounded-lg p-3 text-right outline-none transition-[background-color] duration-(--duration-fast) hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex items-center gap-1 font-mono text-2xs text-subtle-foreground">
                  Next
                  <ArrowRight className="size-3" aria-hidden />
                </span>
                <span className="text-sm font-medium">{next.title}</span>
              </Link>
            ) : null}
          </nav>
        ) : null}
      </article>
    </PageFrame>
    </ArticleColumn>
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
    alternates: pageAlternates(slug.length === 0 ? "/" : page.url),
  };
}
