"use client";

import { Autocomplete } from "@base-ui/react/autocomplete";
import { Combobox } from "@base-ui/react/combobox";
import { Toolbar as BaseToolbar } from "@base-ui/react/toolbar";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Archive,
  Bell,
  Bold,
  Copy,
  CopyPlus,
  CornerDownLeft,
  FolderOpen,
  House,
  Inbox,
  Italic,
  Link2,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Palette,
  Pencil,
  Plus,
  Search,
  Strikethrough,
  Trash2,
  Type,
  Underline,
  Users,
} from "lucide-react";
import type { CSSProperties } from "react";
import { publicInstallCommand } from "@/lib/site";
import { cn } from "@/registry/lib/cn";
import { Alert } from "@/registry/ui/alert/alert";
import { Badge } from "@/registry/ui/badge/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/registry/ui/breadcrumb/breadcrumb";
import { ActionButton } from "@/registry/ui/action-button/action-button";
import { AsciiLoader } from "@/registry/ui/ascii-loader/ascii-loader";
import { ActionToggle } from "@/registry/ui/action-toggle/action-toggle";
import { BlurText } from "@/registry/ui/blur-text/blur-text";
import { Button } from "@/registry/ui/button/button";
import { ClassicLoader } from "@/registry/ui/classic-loader/classic-loader";
import { ButtonGroup } from "@/registry/ui/button-group/button-group";
import { Checkbox } from "@/registry/ui/checkbox/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/registry/ui/collapsible/collapsible";
import { CommandIcon, Hint, Kbd } from "@/registry/ui/command-palette/command-palette.chrome";
import { CommandRow } from "@/registry/ui/command-palette/command-palette.panels";
import type { CommandGroup, CommandItem } from "@/registry/ui/command-palette/command-palette.types";
import { CopyButton } from "@/registry/ui/copy-button/copy-button";
import { Calendar } from "@/registry/ui/date-picker/calendar";
import { DeleteButton } from "@/registry/ui/delete-button/delete-button";
import { itemBase } from "@/registry/ui/dropdown-menu/dropdown-menu.shared";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/registry/ui/empty/empty";
import { Input } from "@/registry/ui/input/input";
import { MatrixLoader } from "@/registry/ui/matrix-loader/matrix-loader";
import { Progress, ProgressLabel, ProgressValue } from "@/registry/ui/progress/progress";
import { Radio, RadioGroup } from "@/registry/ui/radio/radio";
import { ScrambleText } from "@/registry/ui/scramble-text/scramble-text";
import { ScrollArea } from "@/registry/ui/scroll-area/scroll-area";
import { Select, SelectTrigger, SelectValue } from "@/registry/ui/select/select";
import { SelectionToolbarButton, SelectionToolbarSeparator } from "@/registry/ui/selection-toolbar/selection-toolbar.controls";
import { selectionToolbarVariants } from "@/registry/ui/selection-toolbar/selection-toolbar.variants";
import { SearchSelect, SearchSelectInput, SearchSelectItem } from "@/registry/ui/select/select-search";
import { Skeleton } from "@/registry/ui/skeleton/skeleton";
import { Slider } from "@/registry/ui/slider/slider";
import { Switch } from "@/registry/ui/switch/switch";
import { DataTable, DataTableHead, DataTableRow, DataTableRowActions } from "@/registry/ui/data-table/data-table";
import { TableBody, TableCell, TableHeader } from "@/registry/ui/table/table";
import { TableOfContents } from "@/registry/ui/table-of-contents/table-of-contents";
import { TableOfContentsLines } from "@/registry/ui/table-of-contents-lines/table-of-contents-lines";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/registry/ui/tabs/tabs";
import { TextShimmer } from "@/registry/ui/text-shimmer/text-shimmer";
import { Textarea } from "@/registry/ui/textarea/textarea";
import { Toggle } from "@/registry/ui/toggle/toggle";
import styles from "./hero-component-preview.module.css";
import { Panel, PEAK_LIFT, enterDelay } from "./hero-preview-panel";
import { PreviewExtension } from "./hero-preview-extension";
import { MonthYearPreview } from "./hero-month-year-preview";

const groups: CommandGroup[] = [
  {
    heading: "Workspace",
    items: [
      { id: "overview", label: "Overview", icon: <House />, shortcut: "G H" },
      { id: "projects", label: "Projects", icon: <FolderOpen />, shortcut: "G P" },
      { id: "people", label: "Team members", icon: <Users /> },
    ],
  },
  {
    heading: "Actions",
    items: [
      { id: "create", label: "Create project", icon: <Plus />, shortcut: "⌘ N" },
      { id: "appearance", label: "Change appearance", icon: <Palette /> },
    ],
  },
];

const previewMonth = new Date(2026, 9, 1);
const previewToday = new Date(2026, 9, 12);
const previewRange = { from: previewToday, to: new Date(2026, 9, 16) };
const noop = () => {};
const projects = [
  { value: "website", label: "Website redesign", icon: <FolderOpen /> },
  { value: "mobile", label: "Mobile app", icon: <FolderOpen /> },
  { value: "design", label: "Design system", icon: <FolderOpen /> },
];
const tocItems = [
  { id: "hero-toc-overview", title: "Overview" },
  { id: "hero-toc-install", title: "Installation" },
  { id: "hero-toc-usage", title: "Usage", level: 3 },
  { id: "hero-toc-composition", title: "Composition", level: 3 },
  { id: "hero-toc-api", title: "API reference" },
  { id: "hero-toc-accessibility", title: "Accessibility" },
  { id: "hero-toc-motion", title: "Motion" },
];
const releaseNotes = [
  "Added Scroll Area",
  "Sidebar tabs",
  "Data table sorting",
  "Calendar month heights",
  "Command palette tabs",
  "Morph sizing",
  "Select search highlight",
  "Tooltip delay groups",
];
// The overlays always open in a portal, which can't sit on the tilted plane, so their
// surfaces are drawn in place from each component's own classes, without the positioning.
const OVERLAY_MENU = "flex min-w-50 flex-col rounded-md border border-border bg-surface p-1 text-foreground shadow-overlay-drop";
const OVERLAY_TOOLTIP = "flex w-fit items-center gap-2 rounded-md bg-surface px-2.5 py-1 text-xs font-medium text-foreground shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_10px_24px_-8px_rgba(0,0,0,0.18)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_14px_30px_-12px_rgba(0,0,0,0.6)]";
const OVERLAY_CARD = "rounded-md border border-border bg-surface p-4 text-sm text-foreground shadow-overlay-drop";
const OVERLAY_DIALOG = "flex flex-col overflow-hidden rounded-md border border-border bg-surface-raised shadow-overlay-drop";

const fonts = [
  { value: "sans", label: "Sans-serif", icon: <Type /> },
  { value: "mono", label: "Monospace", icon: <Type /> },
];
const people = [
  { name: "Alex Kim", role: "Design engineer", status: "Active", tone: "success", projects: 12, active: "2m ago" },
  { name: "Maya Chen", role: "Product designer", status: "Active", tone: "success", projects: 8, active: "1h ago" },
  { name: "Sam Rivera", role: "Engineer", status: "Away", tone: "warning", projects: 5, active: "Yesterday" },
  { name: "Jordan Lee", role: "Researcher", status: "Invited", tone: "neutral", projects: 0, active: "—" },
] as const;
const deployments = [
  { name: "Production", status: "Live", tone: "success" },
  { name: "Docs", status: "Updated", tone: "info" },
  { name: "Preview", status: "Queued", tone: "neutral" },
  { name: "Canary", status: "Building", tone: "loading" },
  { name: "Sandbox", status: "Paused", tone: "warning" },
  { name: "Staging", status: "Failed", tone: "danger" },
] as const;

function SelectSearchPreview() {
  return (
    <Panel name="select-search" lift={30}>
      <p className="mb-3 text-xs font-medium">Choose a project</p>
      <SearchSelect items={projects} defaultValue={projects[0]} open>
        <SearchSelectInput aria-label="Search projects" placeholder="Search projects…" readOnly tabIndex={-1} />
        {/* Keep the real list and items inside the inert artwork. A positioned portal
            would escape both the 3D plane and the artwork's focus boundary. */}
        <Combobox.List className="mt-1.5 rounded-md border border-border bg-surface p-1">
          {(project: (typeof projects)[number]) => (
            <SearchSelectItem
              key={project.value}
              value={project}
              icon={project.icon}
              className="data-[selected]:bg-muted"
            >
              {project.label}
            </SearchSelectItem>
          )}
        </Combobox.List>
      </SearchSelect>
    </Panel>
  );
}

/** The real palette rows and chrome, without the modal, portal, or global shortcut.
 * The entire artwork is inert; these controls are a visual sample, not a second UI.
 */
function PalettePreview() {
  return (
    <div data-preview-panel="command" className={cn(styles.panel, styles.palette)} style={{ "--lift": `${PEAK_LIFT}px`, "--enter-delay": enterDelay(PEAK_LIFT) } as CSSProperties}>
      <Autocomplete.Root
        inline
        open
        items={groups}
        filter={null}
        itemToStringValue={(item: CommandItem) => item.label}
        autoHighlight="always"
        {...({ keepHighlight: true } as Record<string, unknown>)}
      >
        <div className="flex h-12 items-center gap-2.5 border-b border-border pl-4 pr-3">
          <CommandIcon className="text-subtle-foreground"><Search /></CommandIcon>
          <Autocomplete.Input
            aria-label="Search commands"
            placeholder="Search for anything…"
            readOnly
            tabIndex={-1}
            className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-subtle-foreground"
          />
          <Kbd>⌘ K</Kbd>
        </div>
        <Autocomplete.List className="p-1.5">
          {(group: CommandGroup) => (
            <Autocomplete.Group key={group.heading} items={group.items} className="mb-1 last:mb-0">
              <Autocomplete.GroupLabel className="px-2.5 pt-2 pb-1 text-2xs font-medium text-subtle-foreground">
                {group.heading}
              </Autocomplete.GroupLabel>
              <Autocomplete.Collection>
                {(item: CommandItem) => <CommandRow key={item.id} item={item} query="" onRun={noop} />}
              </Autocomplete.Collection>
            </Autocomplete.Group>
          )}
        </Autocomplete.List>
        <div className="flex items-center justify-between border-t border-border px-1.5 py-2">
          <div className="flex items-center gap-3">
            <Hint keys={["esc"]}>Close</Hint>
            <Hint keys={["↑", "↓"]}>Navigate</Hint>
          </div>
          <Hint trailingKeys keys={[<CornerDownLeft key="enter" className="size-2.5" />]}>Open</Hint>
        </div>
      </Autocomplete.Root>
    </div>
  );
}

/**
 * A responsive, transparent hero illustration built from the library's components.
 * `entrance` assembles it sample by sample once the landing page's RevealGate opens.
 */
export function HeroComponentPreview({ className, entrance = false }: { className?: string; entrance?: boolean }) {
  return (
    <div
      data-hero-preview
      data-hero-entrance={entrance || undefined}
      role="img"
      aria-label="A command palette raised at the centre of a tilted field of component examples, including a calendar, a data table, menus, dialogs, a searchable select, tabs, form fields, buttons, badges, loaders, and status messages."
      className={cn(styles.artwork, className)}
    >
      <div aria-hidden="true" inert className={styles.stage}>
        <div className={styles.grid}>
          <div className={cn(styles.column, styles.colA, "lg:invisible")}>
            <div className={styles.anchored}>
              <div className={styles.above}><PreviewExtension area="aboveLeft" /></div>
              <Panel name="badges" lift={4}>
                <p className="mb-3 text-xs font-medium">Deployments</p>
                <div className="flex flex-col gap-2.5 text-xs text-muted-foreground">
                  {deployments.map(({ name, status, tone }) => (
                    <div key={name} className="flex items-center justify-between">
                      <span>{name}</span><Badge status={tone} size="sm">{status}</Badge>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
            <div className={styles.anchored}>
              <div className={styles.besideLeft}>
                <MonthYearPreview />
                <PreviewExtension area="exportFormat" />
              </div>
              <div className={styles.stack}>
                <Panel name="loaders" lift={2}>
                  <p className="mb-3 text-xs font-medium">Loading</p>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <ClassicLoader size="md" />
                    <MatrixLoader />
                    {/* Held on its first frame like the CSS loaders beside it. It runs on a timer the
                        artwork's animation pause can't reach, so its cycle is set past any visit:
                        about 28 hours a frame, still under the browser's timer limit. */}
                    <AsciiLoader speed={1_000_000} />
                  </div>
                </Panel>
                <Panel name="sheet" lift={2}>
                  <div className={cn(OVERLAY_CARD, "h-56 w-full")}>
                    <p className="text-sm font-semibold">Edit profile</p>
                    <p className="mt-1 text-xs text-muted-foreground">Changes save when you close.</p>
                    <Skeleton className="mt-5 h-7 w-full animate-none rounded-md" />
                    <Skeleton className="mt-3 h-7 w-full animate-none rounded-md" />
                  </div>
                </Panel>
              </div>
            </div>
            <div className={styles.below}><PreviewExtension area="reading" portion="bottom" /></div>
          </div>

          <div className={cn(styles.column, styles.colB)}>

            {/* Hung above the column's head, out of the flow, so the field grows upward and
                nothing below moves. */}
            <div className={styles.anchored}>
              <div className={styles.above}>
                <PreviewExtension area="workspace" portion="top" />
                <Panel name="dropdown-menu" lift={4}>
                  <div className={OVERLAY_MENU}>
                    {[["Edit", <Pencil key="i" />, "⌘ E"], ["Duplicate", <CopyPlus key="i" />, "⌘ D"], ["Archive", <Archive key="i" />, null]].map(([label, icon, keys]) => (
                      <div key={label as string} className={cn(itemBase, label === "Edit" && "bg-muted")}>
                        {icon}{label}
                        {keys ? <span className="ml-auto text-2xs text-subtle-foreground">{keys}</span> : null}
                      </div>
                    ))}
                    <div className="-mx-1 my-1 h-px bg-border" />
                    <div className={cn(itemBase, "text-destructive [&>svg]:text-destructive")}><Trash2 />Delete</div>
                  </div>
                </Panel>
                <Panel name="tooltip" lift={6} className="flex flex-col items-start gap-2">
                  <div className={OVERLAY_TOOLTIP}>Copy link <Kbd>⌘ C</Kbd></div>
                  <Button variant="outline" size="icon-sm" aria-label="Copy link"><Link2 /></Button>
                </Panel>
              </div>
              <Panel name="storage" lift={10}>
                <Progress value={42} locale="en-US">
                  <div className="mb-3 flex items-center justify-between text-xs">
                    <ProgressLabel className="font-medium">Storage</ProgressLabel>
                    <ProgressValue className="text-muted-foreground tabular-nums" />
                  </div>
                </Progress>
              </Panel>
            </div>

            <Panel name="progress" lift={8}>
              <Progress value={75} locale="en-US">
                <div className="mb-3 flex items-center justify-between text-xs">
                  <ProgressLabel className="font-medium">Project setup</ProgressLabel>
                  <ProgressValue className="text-muted-foreground tabular-nums" />
                </div>
              </Progress>
            </Panel>

            <Panel name="calendar" lift={28} className={styles.calendar}>
              <Calendar
                mode="range"
                month={previewMonth}
                today={previewToday}
                selected={previewRange}
                animate={false}
              />
            </Panel>

            <Panel name="buttons" lift={36}>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-medium">Your next idea</span>
                <Badge status="success" size="sm">Ready</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" className="flex-1"><Plus />Create project</Button>
                <Button variant="outline" size="icon-sm" aria-label="More actions"><MoreHorizontal /></Button>
              </div>
            </Panel>

            <Panel name="scroll-area" lift={30}>
              <p className="mb-3 text-xs font-medium">Release notes</p>
              <ScrollArea scrollbar="always" className="h-32 rounded-md shadow-border" viewportClassName="px-3 py-2">
                <ul className="flex flex-col gap-2 text-xs text-muted-foreground">
                  {releaseNotes.map((note) => <li key={note}>{note}</li>)}
                </ul>
              </ScrollArea>
            </Panel>

            <Panel name="selection-toolbar" lift={22}>
              {/* The bar drawn in place: Base UI's toolbar root with the component's own surface and
                  real items. The live component positions it in a portal over the selection. */}
              <BaseToolbar.Root aria-label="Selection" className={cn(selectionToolbarVariants(), "mb-2")}>
                <SelectionToolbarButton><Copy />Copy</SelectionToolbarButton>
                <SelectionToolbarButton><MessageSquare />Comment</SelectionToolbarButton>
                <SelectionToolbarSeparator />
                <SelectionToolbarButton variant="destructive" aria-label="Delete"><Trash2 /></SelectionToolbarButton>
              </BaseToolbar.Root>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Make every <span className="rounded-xs bg-muted px-0.5 text-foreground">detail feel</span> considered.
              </p>
            </Panel>
            <Panel name="toc-lines" lift={10}>
              <p className="mb-2 text-xs font-medium">On this page</p>
              {/* Ids no heading on the page uses, so the sample tracks nothing real. */}
              <TableOfContentsLines items={tocItems} activeId="hero-toc-install" />
            </Panel>
            <Panel name="empty" lift={8} className="relative -top-18">
              <Empty className="p-2">
                <EmptyHeader>
                  <EmptyMedia variant="icon"><Inbox /></EmptyMedia>
                  <EmptyTitle>No messages</EmptyTitle>
                  <EmptyDescription>You&apos;re all caught up.</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button variant="outline" size="sm">Refresh</Button>
                </EmptyContent>
              </Empty>
            </Panel>



          </div>

          <div className={cn(styles.column, styles.colC)}>

            <div className={styles.row}>
              {/* The left half stacks two samples; the profile beside them keeps its place. */}
              <div className={styles.stack}>
                {/* Two closed rows hang above the open one, out of the flow like the sliders. */}
                <div className={styles.anchored}>
                  <div className={styles.above}>
                    <PreviewExtension area="reading" portion="top" />
                    <Panel name="collapsed-rows" lift={18} className="flex flex-col gap-1 p-2">
                      {["Can I use it without Tailwind?", "How do updates work?"].map((question) => (
                        <Collapsible key={question}>
                          <CollapsibleTrigger className="text-xs font-medium">{question}</CollapsibleTrigger>
                          <CollapsibleContent className="px-3 pb-2 text-xs text-muted-foreground">—</CollapsibleContent>
                        </Collapsible>
                      ))}
                    </Panel>
                  </div>
                  <Panel name="collapsible" lift={24} className="p-2">
                    <Collapsible defaultOpen>
                      <CollapsibleTrigger className="text-xs font-medium">Does it work with my theme?</CollapsibleTrigger>
                      <CollapsibleContent className="px-3 pb-2 text-xs text-muted-foreground">
                        Components read semantic tokens, so they follow your colours in light and dark.
                      </CollapsibleContent>
                    </Collapsible>
                  </Panel>
                </div>
                <Panel name="dialog-actions" lift={32}>
                  <p className="mb-1 text-xs font-medium">Discard changes?</p>
                  <p className="mb-4 text-2xs text-muted-foreground">Your edits will be lost.</p>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">Cancel</Button>
                    <Button variant="destructive" size="sm">Discard</Button>
                  </div>
                </Panel>
              </div>
              {/* The sliders hang from the foot of the row, level with Discard changes, out of the flow,
                  so they add no height to the row and nothing around them moves. */}
              <div className={cn(styles.anchored, "self-end")}>
                <div className={styles.above}>
                  <PreviewExtension area="team" portion="top" />
                  <Panel name="circle-slider" lift={18}>
                    <Slider defaultValue={40} label="Brightness" showValue thumb="circle" />
                  </Panel>
                  <Panel name="knob-slider" lift={24}>
                    <Slider defaultValue={70} label="Contrast" showValue thumb="knob" />
                  </Panel>
                </div>
                <Panel name="textarea" lift={32}>
                  <p className="mb-3 text-xs font-medium">A note for the team</p>
                  <Textarea
                    aria-label="Team note"
                    defaultValue={"A little less noise.\nA little more attention to detail."}
                    rows={2}
                    resizable={false}
                    readOnly
                    tabIndex={-1}
                  />
                </Panel>
              </div>
            </div>

            <div className={styles.row}>
              <Panel name="radio" lift={46}>
                <p className="mb-3 text-xs font-medium">Who can see this?</p>
                <RadioGroup defaultValue="team" size="sm" aria-label="Project visibility">
                  <Radio value="everyone" label="Everyone" />
                  <Radio value="team" label="Team only" />
                  <Radio value="private" label="Only me" />
                </RadioGroup>
              </Panel>
              <Panel name="switches" lift={46}>
                <div className="mb-5 flex items-center gap-2 text-xs font-medium">
                  <Bell className="size-3.5 text-subtle-foreground" />Preferences
                </div>
                <div className="flex items-center justify-between gap-4 text-xs">
                  <span>Notifications</span><Switch defaultChecked aria-label="Notifications" />
                </div>
                <div className="mt-4 flex items-center justify-between gap-4 text-xs">
                  <span>Auto updates</span><Switch aria-label="Auto updates" />
                </div>
              </Panel>
            </div>

            <PalettePreview />


            <Panel name="data-table" lift={30}>
              <DataTable
                selectable
                actionColumn
                stickyHeader={false}
                rows={people.map(({ name }) => name)}
                defaultValue={["Maya Chen"]}
                defaultSort={{ column: "name", direction: "asc" }}
              >
                <TableHeader>
                  <DataTableRow>
                    <DataTableHead sortKey="name">Name</DataTableHead>
                    <DataTableHead>Role</DataTableHead>
                    <DataTableHead>Status</DataTableHead>
                    <DataTableHead className="text-right">Projects</DataTableHead>
                    <DataTableHead>Last active</DataTableHead>
                  </DataTableRow>
                </TableHeader>
                <TableBody>
                  {people.map(({ name, role, status, tone, projects: count, active }) => (
                    <DataTableRow
                      key={name}
                      value={name}
                      selectLabel={`Select ${name}`}
                      actions={<DataTableRowActions label={`Actions for ${name}`}>{null}</DataTableRowActions>}
                    >
                      <TableCell className="font-medium">{name}</TableCell>
                      <TableCell className="text-muted-foreground">{role}</TableCell>
                      <TableCell><Badge status={tone} size="sm">{status}</Badge></TableCell>
                      <TableCell className="text-right tabular-nums">{count}</TableCell>
                      <TableCell className="text-muted-foreground">{active}</TableCell>
                    </DataTableRow>
                  ))}
                </TableBody>
              </DataTable>
            </Panel>
            {/* Alerts and a half-width dialog share the row below the table. */}
            <div className={cn(styles.row, "-mt-16 items-start")}>
              <Panel name="alerts" lift={10} className="mt-6">
                <div className="flex flex-col gap-3">
                  <Alert variant="success" className="mt-0">Changes saved.</Alert>
                  <Alert variant="warning" className="mt-0">Your trial ends in 3 days.</Alert>
                  <Alert variant="error" className="mt-0">Couldn&apos;t save your changes.</Alert>
                  <Alert variant="info" className="mt-0">A new version is available.</Alert>
                  <Alert variant="loading" className="mt-0">Syncing your workspace…</Alert>
                </div>
              </Panel>
              <Panel name="dialog" lift={12}>
                <div className={OVERLAY_DIALOG}>
                  <div className="flex flex-col gap-4 p-6">
                    <div>
                      <p className="text-sm font-semibold">Rename project</p>
                      <p className="mt-1 text-xs text-muted-foreground">Visible to everyone in the workspace.</p>
                    </div>
                    <Input defaultValue="Website redesign" aria-label="Project name" readOnly tabIndex={-1} />
                  </div>
                  <div className="flex justify-end gap-2 border-t border-border px-6 py-3">
                    <Button variant="outline" size="sm">Cancel</Button>
                    <Button size="sm">Save</Button>
                  </div>
                </div>
              </Panel>
            </div>

            <div className={styles.below}>
              <div className={styles.row}>
                <div className={styles.stack}><PreviewExtension area="workspace" portion="bottom" /></div>
                <div className={styles.stack}><PreviewExtension area="team" portion="bottom" /></div>
              </div>
            </div>
          </div>

          <div className={cn(styles.column, styles.colD)}>

            {/* Hung above the column's head, out of the flow, so the field grows upward and
                nothing below moves. */}
            <div className={styles.anchored}>
              <div className={styles.above}>
                <PreviewExtension area="assetsTop" />
                <Panel name="hover-card" lift={4}>
                  <div className={OVERLAY_CARD}>
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-2xs font-medium">MC</span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium">Maya Chen</p>
                        <p className="truncate text-2xs text-muted-foreground">@maya · Product designer</p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">Designing calm interfaces for busy people.</p>
                  </div>
                </Panel>
                <Panel name="select" lift={6}>
                  <p className="mb-3 text-xs font-medium">Font</p>
                  <Select items={fonts} defaultValue="sans">
                    <SelectTrigger aria-label="Font"><SelectValue /></SelectTrigger>
                  </Select>
                </Panel>
              </div>
              <Panel name="search" lift={10}>
                <Input placeholder="Search…" aria-label="Search" startIcon={<Search />} readOnly tabIndex={-1} />
              </Panel>
            </div>

            <Panel name="button-group" lift={12}>
              <p className="mb-3 text-xs font-medium">Text alignment</p>
              <ButtonGroup variant="outline" size="icon-sm" aria-label="Text alignment">
                <Button aria-label="Align left"><AlignLeft /></Button>
                <Button aria-label="Align center"><AlignCenter /></Button>
                <Button aria-label="Align right"><AlignRight /></Button>
              </ButtonGroup>
            </Panel>

            <SelectSearchPreview />

            <Panel name="tabs" lift={36}>
              <Tabs defaultValue="overview" appearance="outline" size="sm" className="gap-10">
                <TabsList aria-label="Workspace view">
                  <TabsTab value="overview">Overview</TabsTab>
                  <TabsTab value="activity">Activity</TabsTab>
                  <TabsTab value="settings">Settings</TabsTab>
                </TabsList>
                <TabsPanel value="overview">
                  <Breadcrumb>
                    <BreadcrumbList size="sm">
                      <BreadcrumbItem><BreadcrumbLink asChild><span>Home</span></BreadcrumbLink></BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem><BreadcrumbLink asChild><span>Projects</span></BreadcrumbLink></BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem><BreadcrumbPage>Website</BreadcrumbPage></BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                </TabsPanel>
                <TabsPanel value="activity" className="text-xs text-muted-foreground">No new activity.</TabsPanel>
                <TabsPanel value="settings" className="text-xs text-muted-foreground">Make it feel like yours.</TabsPanel>
              </Tabs>
            </Panel>

            <Panel name="slider" lift={30} className="py-0 [&_[data-slot=slider-ticks]]:opacity-100">
              <Slider defaultValue={65} label="Volume" showValue showTicks step={5} thumb="bar" />
            </Panel>

            <Panel name="tasks" lift={22}>
              <p className="mb-4 text-xs font-medium">This week</p>
              <div className="flex flex-col gap-3.5">
                {([["Ship the sidebar", true], ["Write the docs", true], ["Review motion", false]] as const).map(([label, done]) => (
                  <div key={label} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <Checkbox defaultChecked={done} aria-label={label} /><span>{label}</span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel name="install" lift={16}>
              <p className="mb-3 text-xs font-medium">Install</p>
              <div className="flex items-center justify-between gap-2 rounded-md bg-muted py-1 pr-1 pl-3">
                <code className="truncate font-mono text-2xs text-muted-foreground">{publicInstallCommand("button")}</code>
                <CopyButton value={publicInstallCommand("button")} aria-label="Copy command" tabIndex={-1} />
              </div>
            </Panel>
            <Panel name="toggle" lift={6}>
              <p className="mb-3 text-xs font-medium">Text formatting</p>
              <div className="flex items-center gap-2">
                <Toggle size="icon-sm" defaultPressed pressScale={false} aria-label="Bold"><Bold /></Toggle>
                <Toggle size="icon-sm" pressScale={false} aria-label="Italic"><Italic /></Toggle>
                <Toggle size="icon-sm" pressScale={false} aria-label="Underline"><Underline /></Toggle>
                <Toggle size="icon-sm" pressScale={false} aria-label="Strikethrough"><Strikethrough /></Toggle>
              </div>
            </Panel>

          </div>

          <div className={cn(styles.column, styles.colE)}>
            <div className={styles.anchored}>
              <div className={styles.above}><PreviewExtension area="aboveRight" /></div>
              <Panel name="shortcuts" lift={4}>
                <p className="mb-3 text-xs font-medium">Shortcuts</p>
                <div className="flex flex-col gap-2.5 text-xs text-muted-foreground">
                  {[["Search", "⌘ K"], ["New project", "⌘ N"], ["Toggle sidebar", "⌘ B"]].map(([label, keys]) => (
                    <div key={label} className="flex items-center justify-between">
                      <span>{label}</span><Kbd>{keys}</Kbd>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
            <Panel name="invite" lift={6}>
              <p className="mb-3 text-xs font-medium">Invite a teammate</p>
              <Input type="email" placeholder="name@example.com" aria-label="Teammate email" startIcon={<Mail />} readOnly tabIndex={-1} />
            </Panel>
            <Panel name="actions" lift={4} className="flex flex-wrap items-center gap-2">
              <ActionButton action={noop} size="sm" labels={{ success: "Saved" }}>Save changes</ActionButton>
              <ActionToggle action={noop} defaultPressed size="sm" labels={{ pressed: "Following" }}>Follow</ActionToggle>
              <DeleteButton variant="outline" size="sm">Delete</DeleteButton>
            </Panel>
            <Panel name="skeleton" lift={4}>
              <div className="flex items-center gap-3">
                <Skeleton className="size-8 shrink-0 animate-none rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-2 w-24 animate-none rounded-xs" />
                  <Skeleton className="h-1.5 w-16 animate-none rounded-xs" />
                </div>
              </div>
              <Skeleton className="mt-4 h-2 w-full animate-none rounded-xs" />
              <Skeleton className="mt-2 h-2 w-3/4 animate-none rounded-xs" />
            </Panel>
            <Panel name="toc" lift={4}>
              <p className="mb-2 text-xs font-medium">Contents</p>
              <TableOfContents aria-label="Contents" items={tocItems} activeId="hero-toc-api" />
            </Panel>
            <Panel name="text-effects" lift={2} className="flex flex-col gap-2 text-sm">
              {/* All three are held mid-effect. The shimmer's sweep starts partway through (see
                  the stylesheet). The scramble's revealed half is plain text and the rest a
                  ScrambleText whose timer never fires, so it stays scrambled. The blur's letters
                  are shifted back by their whole spread: the first is sharp, the last still hidden. */}
              <TextShimmer>Generating summary…</TextShimmer>
              <span>Decrypt<ScrambleText intervalMs={2_000_000_000}>ing payload</ScrambleText></span>
              <BlurText delay={-300}>Hello there.</BlurText>
            </Panel>
            <Panel name="alert-dialog" lift={2}>
              <div className={OVERLAY_DIALOG}>
                <div className="p-4">
                  <p className="text-sm font-semibold">Delete project?</p>
                  <p className="mt-1 text-xs text-muted-foreground">This can&apos;t be undone.</p>
                </div>
                <div className="flex justify-end gap-2 border-t border-border p-3">
                  <Button variant="outline" size="sm">Cancel</Button>
                  <Button variant="destructive" size="sm">Delete</Button>
                </div>
              </div>
            </Panel>
            <div className={styles.below}><PreviewExtension area="assetsBottom" /></div>
          </div>
        </div>
      </div>
    </div>
  );
}
