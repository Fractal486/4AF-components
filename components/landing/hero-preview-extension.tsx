import type { ReactNode } from "react";
import { Archive, Check, Copy, FolderOpen, Link2, Plus, Search, Users } from "lucide-react";
import { Alert } from "@/registry/ui/alert/alert";
import { Badge } from "@/registry/ui/badge/badge";
import { Button } from "@/registry/ui/button/button";
import { Checkbox } from "@/registry/ui/checkbox/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/registry/ui/collapsible/collapsible";
import { Kbd } from "@/registry/ui/command-palette/command-palette.chrome";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/registry/ui/empty/empty";
import { Input } from "@/registry/ui/input/input";
import { Progress, ProgressLabel, ProgressValue } from "@/registry/ui/progress/progress";
import { Radio, RadioGroup } from "@/registry/ui/radio/radio";
import { Skeleton } from "@/registry/ui/skeleton/skeleton";
import { Slider } from "@/registry/ui/slider/slider";
import { Switch } from "@/registry/ui/switch/switch";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/registry/ui/tabs/tabs";
import { Textarea } from "@/registry/ui/textarea/textarea";
import { Panel } from "./hero-preview-panel";
import { MonthYearPreviewContent } from "./hero-month-year-preview";
import styles from "./hero-component-preview.module.css";

type Area = "reading" | "workspace" | "team" | "assetsTop" | "assetsBottom" | "aboveLeft" | "aboveRight" | "reviewTools" | "teamTools" | "exportFormat";
type Preview = { name: string; content: ReactNode; className?: string };

const title = "mb-3 text-xs font-medium";
const row = "flex items-center justify-between gap-3 text-xs";
const surface = "rounded-md bg-surface p-4 shadow-border";

/** Additional vignettes stay inside the artwork's inert boundary. Hoisted content and
 * existing components keep this a still illustration, with no extra effects or timers. */
const previews: Record<Area, Preview[]> = {
  reading: [
    { name: "month-year-picker-upper", content: <MonthYearPreviewContent /> },
    { name: "digest-settings", content: <>
      <p className={title}>Your weekly digest</p>
      <RadioGroup defaultValue="friday" size="sm" aria-label="Digest delivery">
        <Radio value="monday" label="Monday morning" />
        <Radio value="friday" label="Friday afternoon" />
      </RadioGroup>
    </> },
    { name: "review-status", className: "self-end w-52", content: <Alert variant="success" className="mt-0">All reviews complete.</Alert> },
    { name: "new-collection", content: <div className={surface}>
      <FolderOpen className="mb-4 size-5 text-muted-foreground" />
      <p className={title}>A place for your ideas</p>
      <Input defaultValue="Field notes" aria-label="Collection name" readOnly tabIndex={-1} />
      <Button size="sm" className="mt-3 w-full"><Plus />Create collection</Button>
    </div> },
    { name: "reading-progress", content: <Progress value={68} locale="en-US">
      <div className="mb-3 flex justify-between text-xs"><ProgressLabel>Reading goal</ProgressLabel><ProgressValue /></div>
    </Progress> },
    { name: "quiet-hours", content: <>
      <div className={row}><span>Quiet hours</span><Switch defaultChecked aria-label="Quiet hours" /></div>
      <p className="mt-2 text-2xs text-muted-foreground">Every evening, 8 pm – 8 am</p>
    </> },
    { name: "archive-empty", content: <Empty className="p-2">
      <EmptyHeader><EmptyMedia variant="icon"><Archive /></EmptyMedia><EmptyTitle>Room for something new</EmptyTitle><EmptyDescription>Your archive is clear.</EmptyDescription></EmptyHeader>
    </Empty> },
    { name: "reading-shortcuts", className: "w-52", content: <>
      <div className={row}><span>Save for later</span><Kbd>S</Kbd></div>
      <div className={`${row} mt-3`}><span>Next article</span><Kbd>J</Kbd></div>
    </> },
  ],
  workspace: [
    { name: "workspace-picker", content: <div className={surface}>
      <p className="mb-3 text-2xs text-muted-foreground">Switch workspace</p>
      <div className={`${row} rounded-sm bg-muted p-2`}><span className="flex items-center gap-2"><Users className="size-3.5" />Studio North</span><Check className="size-3.5" /></div>
      <div className={`${row} p-2`}><span>Personal projects</span><Kbd>2</Kbd></div>
      <Button variant="plain" size="sm" className="mt-2"><Plus />New workspace</Button>
    </div> },
    { name: "project-labels", content: <>
      <p className={title}>Labels</p>
      <div className="flex flex-wrap gap-2"><Badge>Research</Badge><Badge status="info">In progress</Badge><Badge status="success">Approved</Badge><Badge>Design</Badge></div>
    </> },
    { name: "launch-checklist", content: <>
      <p className={title}>Before we launch</p>
      <div className="space-y-3">
        <Checkbox defaultChecked label="Check the small screens" />
        <Checkbox defaultChecked label="Review the empty states" />
        <Checkbox label="Send the release notes" />
      </div>
    </> },
    { name: "share-link", content: <>
      <p className={title}>Anyone with the link</p>
      <Input defaultValue="studio.design/preview" startIcon={<Link2 />} aria-label="Preview link" readOnly tabIndex={-1} />
      <div className="mt-3 flex justify-end"><Button variant="outline" size="sm"><Copy />Copy link</Button></div>
    </> },
    { name: "review-comment", className: "relative -top-12", content: <div className={surface}>
      <p className="mb-1 text-xs font-medium">Alex left a note</p>
      <p className="text-xs leading-relaxed text-muted-foreground">The quieter toolbar feels right. Ready for one more look on mobile.</p>
      <div className="mt-4 flex items-center justify-between"><span className="text-2xs text-subtle-foreground">12 minutes ago</span><Badge size="sm">Review</Badge></div>
    </div> },
  ],
  reviewTools: [
    { name: "image-quality", content: <Slider defaultValue={85} label="Export quality" showValue thumb="circle" /> },
    { name: "version-history", content: <Collapsible defaultOpen>
      <CollapsibleTrigger className="text-xs">Earlier versions</CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 px-3 pb-3 text-xs text-muted-foreground">
        <div className={row}><span>Navigation update</span><span>Today</span></div>
        <div className={row}><span>First exploration</span><span>Oct 9</span></div>
      </CollapsibleContent>
    </Collapsible> },
    { name: "publish-actions", className: "self-end w-60", content: <>
      <p className={title}>Ready to share?</p>
      <div className="flex gap-2"><Button variant="outline" size="sm">Preview</Button><Button size="sm">Publish changes</Button></div>
    </> },
  ],
  team: [
    { name: "team-availability", content: <>
      <p className={title}>Around the studio</p>
      <div className="space-y-3">
        <div className={row}><span>Nora Patel</span><Badge size="sm" status="success">Available</Badge></div>
        <div className={row}><span>Eli Brooks</span><Badge size="sm" status="warning">Focusing</Badge></div>
        <div className={row}><span>June Park</span><Badge size="sm">Away</Badge></div>
      </div>
    </> },
    { name: "meeting-note", content: <>
      <p className={title}>Notes from the review</p>
      <Textarea defaultValue={"Keep the navigation simple.\nGive the content room to breathe.\nTry the smaller toolbar."} rows={3} resizable={false} aria-label="Review notes" readOnly tabIndex={-1} />
    </> },
    { name: "notification-inbox", content: <Tabs defaultValue="unread" size="sm" appearance="outline">
      <TabsList aria-label="Notification filter"><TabsTab value="unread">Unread</TabsTab><TabsTab value="all">All updates</TabsTab></TabsList>
      <TabsPanel value="unread" className="space-y-3 pt-2 text-xs">
        <p>June shared a new exploration</p><p className="text-muted-foreground">Nora resolved your comment</p>
      </TabsPanel>
    </Tabs> },
    { name: "invite-sent", className: "self-end w-60", content: <Alert variant="success" className="mt-0">Invite sent to Nora.</Alert> },
    { name: "delivery-options", content: <>
      <p className={title}>Keep me in the loop</p>
      <div className={`${row} mb-4`}><span>Email summaries</span><Switch defaultChecked aria-label="Email summaries" /></div>
      <div className={row}><span>Desktop alerts</span><Switch aria-label="Desktop alerts" /></div>
    </> },
  ],
  teamTools: [
    { name: "team-capacity", content: <div className={surface}>
      <p className="text-2xs text-muted-foreground">This sprint</p>
      <p className="mt-2 text-2xl font-medium tracking-tight">18 <span className="text-xs font-normal text-muted-foreground">of 24 tasks done</span></p>
      <Progress value={75} aria-label="Sprint completion" className="mt-4" />
      <p className="mt-3 text-2xs text-muted-foreground">A little closer to launch.</p>
    </div> },
    { name: "member-search", content: <Input placeholder="Find a teammate…" startIcon={<Search />} aria-label="Find a teammate" readOnly tabIndex={-1} /> },
    { name: "feedback-form", content: <div className={surface}>
      <p className={title}>What could feel better?</p>
      <Textarea placeholder="One small thing…" rows={2} resizable={false} aria-label="Feedback" readOnly tabIndex={-1} />
      <Button size="sm" className="mt-3">Send feedback</Button>
    </div> },
  ],
  exportFormat: [
    { name: "export-format", content: <>
      <p className={title}>Export as</p>
      <RadioGroup defaultValue="svg" size="sm" aria-label="Export format">
        <Radio value="svg" label="SVG · Scalable" /><Radio value="png" label="PNG · High resolution" /><Radio value="pdf" label="PDF · Ready to print" />
      </RadioGroup>
    </> },
  ],
  assetsTop: [
    { name: "export-size", content: <Slider defaultValue={75} label="Image size" showValue showTicks step={25} thumb="bar" /> },
    { name: "download-ready", content: <div className={surface}>
      <div className={row}><span className="font-medium">Your files are ready</span><Check className="size-4" /></div>
      <p className="mt-2 text-2xs text-muted-foreground">6 assets · 2.4 MB</p>
      <Button variant="outline" size="sm" className="mt-4 w-full">Download assets</Button>
    </div> },
    { name: "asset-tags", className: "w-60", content: <>
      <p className={title}>Asset library</p>
      <div className="flex flex-wrap gap-2"><Badge>Icons · 24</Badge><Badge>Logos · 6</Badge><Badge>Illustrations · 12</Badge></div>
    </> },
  ],
  assetsBottom: [
    { name: "file-upload", content: <Progress value={92} locale="en-US">
      <div className="mb-3 flex justify-between text-xs"><ProgressLabel>Uploading brand assets</ProgressLabel><ProgressValue /></div>
    </Progress> },
    { name: "asset-preview", content: <div className={surface}>
      <Skeleton className="h-20 w-full animate-none rounded-sm" />
      <Skeleton className="mt-4 h-2 w-28 animate-none rounded-xs" />
      <Skeleton className="mt-2 h-2 w-20 animate-none rounded-xs" />
    </div> },
    { name: "export-warning", content: <Alert variant="warning" className="mt-0">Two assets need a name.</Alert> },
    { name: "duplicate-asset", className: "self-end w-56", content: <>
      <div className={row}><span>Duplicate selection</span><Kbd>⌘ D</Kbd></div>
      <Button size="sm" variant="outline" className="mt-4"><Copy />Make a copy</Button>
    </> },
  ],
  aboveLeft: [
    { name: "daily-plan", className: "relative -top-6", content: <>
      <p className={title}>A good day starts here</p>
      <div className="space-y-3"><Checkbox defaultChecked label="Clear the inbox" /><Checkbox label="Make time to explore" /></div>
    </> },
    { name: "focus-setting", className: "relative -top-6", content: <div className="relative flex justify-end">
      <div className="absolute right-0 bottom-full mb-3 flex flex-col gap-3">
        <Switch tone="fixed" defaultChecked={false} aria-label="Fixed switch one" />
        <Switch tone="fixed" defaultChecked={false} aria-label="Fixed switch two" />
      </div>
      <Switch defaultChecked aria-label="Focus mode" />
    </div> },
  ],
  aboveRight: [
    { name: "project-summary", content: <div className={surface}>
      <Badge size="sm" status="info">In review</Badge>
      <p className="mt-3 text-sm font-medium">A fresh start</p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">A calmer home for the things your team is working on.</p>
      <div className="mt-4 flex items-center gap-2 text-2xs text-muted-foreground"><Users className="size-3.5" />4 collaborators</div>
    </div> },
    { name: "project-access", content: <>
      <p className={title}>Link access</p>
      <RadioGroup defaultValue="invited" size="sm" aria-label="Link access"><Radio value="invited" label="Only invited people" /><Radio value="link" label="Anyone with the link" /></RadioGroup>
    </> },
    { name: "project-reminder", content: <Alert className="mt-0">Next review: Thursday at 10.</Alert> },
    { name: "project-budget", content: <Slider defaultValue={45} label="Time allocated" showValue thumb="knob" /> },
    { name: "project-bookmark", className: "w-52", content: <>
      <p className={title}>Keep it close</p>
      <Button variant="outline" size="sm"><Plus />Add to favourites</Button>
    </> },
  ],
};

export function PreviewExtension({ area, portion }: { area: Area; portion?: "top" | "bottom" }) {
  const cards = portion === "top" ? previews[area].slice(0, 4)
    : portion === "bottom" ? previews[area].slice(4) : previews[area];
  return cards.map(({ name, content, className }, index) => {
    const panel = (
      <Panel key={name} name={name} lift={4 + (index % 4) * 4} className={className}>
        {content}
      </Panel>
    );
    // Anchor the small review stack beside Link access without shifting its neighbours.
    return name === "project-access" ? (
      <div key={name} className={styles.anchored}>
        {panel}
        <div className={styles.beside}>
          <PreviewExtension area="reviewTools" />
          <PreviewExtension area="teamTools" />
        </div>
      </div>
    ) : panel;
  });
}
