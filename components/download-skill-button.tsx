import { Download } from "lucide-react";
import { buttonVariants } from "fumadocs-ui/components/ui/button";

export function DownloadSkillButton() {
  return (
    <a
      href="/api/agent-skill/download"
      download="4af-components-skill.zip"
      className={buttonVariants({
        color: "secondary",
        size: "sm",
        className: "gap-2",
      })}
    >
      <Download className="size-3.5" aria-hidden="true" />
      Download skill (.zip)
    </a>
  );
}
