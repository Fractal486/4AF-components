import { publicInstallCommand } from "./site.ts";

export interface ComponentReference {
  usage: string;
}

export const componentReferences = {
  "action-button": {
    usage: `import { ActionButton } from "@/components/ui/action-button";

<ActionButton
  action={() => saveChanges()}
  labels={{ success: "Saved", error: (error) => error instanceof Error ? error.message : "Failed" }}
  revertAfter={{ success: 2000, error: 4000 }}
>
  Save changes
</ActionButton>`,
  },
  "action-toggle": {
    usage: `import { ActionToggle } from "@/components/ui/action-toggle";

<ActionToggle
  pressed={following}
  action={(next) => saveFollowing(next)}
  onPressedChange={setFollowing}
  labels={{ pressed: "Following", error: (error) => error instanceof Error ? error.message : "Try again" }}
>
  Follow
</ActionToggle>`,
  },
  alert: {
    usage: `import { Alert, AlertTitle, AlertDescription, AlertClose } from "@/components/ui/alert";

<Alert variant="success" open={open} onOpenChange={setOpen}>
  <AlertTitle>Changes saved</AlertTitle>
  <AlertDescription>Your settings are up to date.</AlertDescription>
  <AlertClose />
</Alert>`,
  },
  "alert-dialog": {
    usage: `import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

<AlertDialog>
  <AlertDialogTrigger>Delete project</AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogBody>
      <AlertDialogHeader>
        <AlertDialogMedia variant="destructive"><Trash2 /></AlertDialogMedia>
        <AlertDialogTitle>Delete project?</AlertDialogTitle>
        <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
      </AlertDialogHeader>
    </AlertDialogBody>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction variant="destructive" onClick={() => deleteProject(projectId)}>
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`,
  },
  "ascii-loader": {
    usage: `import { AsciiLoader } from "@/components/ui/ascii-loader";

<AsciiLoader loading={isLoading} label="Loading" />`,
  },
  "matrix-loader": {
    usage: [
      'import { MatrixLoader } from "@/components/ui/matrix-loader";',
      "",
      '<MatrixLoader loading={isLoading} variant="twinkle" label="Loading" />',
    ].join("\n"),
  },
  "classic-loader": {
    usage: `import { ClassicLoader } from "@/components/ui/classic-loader";

<ClassicLoader loading={isLoading} size="md" speed={1} label="Loading results" />`,
  },
  breadcrumb: {
    usage: `import {
  Breadcrumb,
  BreadcrumbCollapse,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink render={<a href="/" />}>Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbCollapse open={pathExpanded} onOpenChange={setPathExpanded}>
      <BreadcrumbItem>
        <BreadcrumbLink href="/docs">Docs</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
    </BreadcrumbCollapse>
    <BreadcrumbItem>
      <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`,
  },
  "number-animation": {
    usage: `import { NumberAnimation } from "@/components/ui/number-animation";

<NumberAnimation value={total} locales="en-US" format={{ style: "currency", currency: "USD" }} />`,
  },
  badge: {
    usage: `import { CircleX } from "lucide-react";
import { Badge, BadgeClose, BadgeCount } from "@/components/ui/badge";

<Badge variant="solid" shape="pill">Approved</Badge>
<Badge render={<button type="button" />}>Follow</Badge>
<Badge status="loading">Syncing</Badge>
<Badge status="danger" icons={{ danger: <CircleX /> }}>Failed</Badge>
<Badge variant="outline" neutralText dot pulse>Live</Badge>
<Badge variant="filled" status="danger" showIcon={false}><BadgeCount animated value={unread} max={99} /></Badge>
<Badge open={open} onOpenChange={setOpen}>Design<BadgeClose id="remove-design" /></Badge>`,
  },
  button: {
    usage: `import { Button } from "@/components/ui/button";

<Button variant="primary">Deploy</Button>
<Button loading>Deploy</Button>
<Button variant="ghost" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>Actions</Button>`,
  },
  "button-group": {
    usage: `import { ButtonGroup } from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";

<ButtonGroup>
  <Button>Back</Button>
  <Button>Next</Button>
</ButtonGroup>`,
  },
  checkbox: {
    usage: `import { Checkbox, CheckboxGroup } from "@/components/ui/checkbox";

<CheckboxGroup aria-label="Notifications" allValues={["email", "push"]} defaultValue={["email"]}>
  <Checkbox parent label="Select all" />
  <Checkbox value="email" label="Email" />
  <Checkbox value="push" label="Push notifications" />
</CheckboxGroup>`,
  },
  collapsible: {
    usage: `import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

<Collapsible className="flex flex-col gap-2">
  <CollapsibleTrigger>Details</CollapsibleTrigger>
  <CollapsibleContent className="pt-0">More information.</CollapsibleContent>
</Collapsible>`,
  },
  "command-palette": {
    usage: `import { CommandPalette, CommandPanelBody, CommandPanelFooter } from "@/components/ui/command-palette";

<CommandPalette groups={[{ items: [{
  id: "project",
  label: "Project actions",
  panel: () => <>
    <CommandPanelBody>Manage this project.</CommandPanelBody>
    <CommandPanelFooter actions={{ items: [{
      id: "delete",
      label: "Delete project",
      keybind: "mod+shift+d",
      confirm: { label: "Confirm deletion?" },
      onSelect: deleteProject,
    }] }} />
  </>,
}] }]} />`,
  },
  "copy-button": {
    usage: `import { CopyButton } from "@/components/ui/copy-button";

<CopyButton value="Text to copy" size="md">Copy</CopyButton>`,
  },
  "delete-button": {
    usage: `import { DeleteButton } from "@/components/ui/delete-button";

<DeleteButton onDelete={() => removeItem(id)}>Delete</DeleteButton>`,
  },
  dialog: {
    usage: `import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

<Dialog>
  <DialogTrigger>Open dialog</DialogTrigger>
  {/* For a fixed height, use autoSize={false} className="h-[32rem]". */}
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit project</DialogTitle>
    </DialogHeader>
    <DialogBody>Project settings</DialogBody>
    <DialogFooter showCloseButton />
  </DialogContent>
</Dialog>`,
  },
  "context-menu": {
    usage: `import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

<ContextMenu>
  <ContextMenuTrigger className="rounded-xl border border-dashed border-border p-8">
    Right click here
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>
      Duplicate
      <ContextMenuShortcut keys="mod+d" />
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem variant="destructive">Delete</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`,
  },
  "dropdown-menu": {
    usage: `import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

<DropdownMenu>
  <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
  <DropdownMenuContent portalProps={{ keepMounted: true }} positionerProps={{ collisionPadding: 8 }}>
    <DropdownMenuItem>Edit</DropdownMenuItem>
    <DropdownMenuItem disabled disabledReason="Billing is available on the Pro plan.">
      Billing
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`,
  },
  empty: {
    usage: `import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty";

<Empty size="sm" animated render={<section aria-labelledby="empty-title" />}>
  <EmptyHeader>
    <EmptyTitle id="empty-title" render={<h2 />}>No projects yet</EmptyTitle>
    <EmptyDescription>
      <p>Create a project to get started.</p>
      <p>Read the <a href="/guide">setup guide</a> for help.</p>
    </EmptyDescription>
  </EmptyHeader>
</Empty>`,
  },
  "hover-card": {
    usage: `import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

<HoverCard>
  <HoverCardTrigger href="/people/alex">Alex Morgan</HoverCardTrigger>
  <HoverCardContent autoSize lockSide portalProps={{ keepMounted: true }}>
    Preview content
  </HoverCardContent>
</HoverCard>`,
  },
  input: {
    usage: `import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, InputCount } from "@/components/ui/input";

<Input
  aria-label="Name" value={name} onValueChange={setName}
  wrapperClassName="max-w-sm"
  maxLength={40} aria-describedby="name-count"
  endAction={name ? (
    <Button variant="ghost" size="icon-xs" aria-label="Clear name" onClick={() => setName("")}>
      <X />
    </Button>
  ) : undefined}
/>
<InputCount id="name-count" length={name.length} maxLength={40} />`,
  },
  kbd: {
    usage: `import { KbdGroup } from "@/components/ui/kbd";

<KbdGroup keys="mod+k" size="sm" />`,
  },
  menubar: {
    usage: `import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";

<Menubar aria-label="Editor">
  <MenubarMenu>
    <MenubarTrigger>File</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>
        New file
        <MenubarShortcut keys="mod+n" />
      </MenubarItem>
      <MenubarSeparator />
      <MenubarItem variant="destructive">Move to trash</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
  <MenubarMenu>
    <MenubarTrigger>Edit</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Undo</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`,
  },
  morph: {
    usage: `import { Check, Copy } from "lucide-react";
import { Morph } from "@/components/ui/morph";

<Morph
  activeKey={copied ? "done" : "idle"}
  items={{ idle: <Copy />, done: <Check /> }}
/>

<Morph
  sizing="fixed"
  className="size-4"
  activeKey={copied ? "done" : "idle"}
  items={{ idle: <Copy />, done: <Check /> }}
/>`,
  },
  "date-picker": {
    usage: `import { DatePicker, DateRangePicker } from "@/components/ui/date-picker";

<DatePicker value={date} onValueChange={setDate} name="due" clearable />
<DateRangePicker
  value={range}
  onValueChange={setRange}
  dateFormat="numeric"
  calendarProps={{ disabled: { before: new Date() }, min: 1, max: 7, excludeDisabled: true }}
/>`,
  },
  popover: {
    usage: `import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

<Popover>
  <PopoverTrigger>Open</PopoverTrigger>
  <PopoverContent autoSize portalProps={{ keepMounted: true }}>
    <PopoverTitle>Display options</PopoverTitle>
    Popover content
  </PopoverContent>
</Popover>`,
  },
  progress: {
    usage: `import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";

<Progress value={progress} color="var(--ring)" className="space-y-2">
  <div className="flex items-baseline justify-between text-sm">
    <ProgressLabel>Uploading files</ProgressLabel>
    <ProgressValue animated className="tabular-nums" />
  </div>
</Progress>`,
  },
  radio: {
    usage: `import { Radio, RadioGroup } from "@/components/ui/radio";

<RadioGroup aria-label="Density" defaultValue="comfortable">
  <Radio value="comfortable" label="Comfortable" className={({ checked }) => checked ? "shadow-border" : undefined} />
  <Radio value="compact" label="Compact" render={<span />} />
</RadioGroup>`,
  },
  select: {
    usage: `import {
  Select,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectGroupLabel,
  SelectSeparator,
  SelectSub,
  SelectSubContent,
  SelectSubTrigger,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

<Select size="xs" defaultValue="apple">
  <SelectTrigger variant="ghost" label="Fruit">
    <SelectValue />
  </SelectTrigger>
  <SelectContent clearable>
    <SelectGroup>
      <SelectGroupLabel>Popular</SelectGroupLabel>
      <SelectItem value="apple">Apple</SelectItem>
    </SelectGroup>
    <SelectSeparator />
    <SelectSub>
      <SelectSubTrigger>More fruit</SelectSubTrigger>
      <SelectSubContent>
        <SelectItem value="banana">Banana</SelectItem>
      </SelectSubContent>
    </SelectSub>
  </SelectContent>
</Select>`,
  },
  "select-aligned": {
    usage: `import {
  AlignedSelect,
  AlignedSelectContent,
  AlignedSelectItem,
  AlignedSelectTrigger,
} from "@/components/ui/select-aligned";

<AlignedSelect size="xs" value={city} onValueChange={setCity}>
  <AlignedSelectTrigger variant="ghost" label="City" placeholder="Pick a city"
    className={({ valid }) => valid === false ? "text-destructive" : undefined} />
  <AlignedSelectContent>
    <AlignedSelectItem value="Lisbon">Lisbon</AlignedSelectItem>
    <AlignedSelectItem value="Oslo">Oslo</AlignedSelectItem>
  </AlignedSelectContent>
</AlignedSelect>`,
  },
  "select-search": {
    usage: `import { SearchSelect, SearchSelectInput, SearchSelectContent, SearchSelectItem, SearchSelectGroup, SearchSelectGroupLabel, SearchSelectCollection } from "@/components/ui/select-search";

<SearchSelect items={groups}>
  <SearchSelectInput aria-label="Choose an option" placeholder="Search available options…" />
  <SearchSelectContent align="start" alignOffset={4}>
    {(group) => (
      <SearchSelectGroup key={group.label} items={group.items}>
        <SearchSelectGroupLabel>{group.label}</SearchSelectGroupLabel>
        <SearchSelectCollection>
          {(item) => <SearchSelectItem key={item.value} value={item}>{item.label}</SearchSelectItem>}
        </SearchSelectCollection>
      </SearchSelectGroup>
    )}
  </SearchSelectContent>
</SearchSelect>`,
  },
  "selection-toolbar": {
    usage: `import { SelectionToolbar, SelectionToolbarButton } from "@/components/ui/selection-toolbar";

<SelectionToolbar actions={
  <SelectionToolbarButton onAction={(text, range) => annotateSelection(text, range)}>
    Annotate
  </SelectionToolbarButton>
}>
  Selectable content
</SelectionToolbar>`,
  },
  "scroll-area": {
    usage: `import { ScrollArea } from "@/components/ui/scroll-area";

<ScrollArea className={({ scrolling }) =>
  "h-72 rounded-xl shadow-border" + (scrolling ? " bg-surface" : "")
}>
  <div className="p-4">{/* long content */}</div>
</ScrollArea>`,
  },
  separator: {
    usage: `import { Separator } from "@/components/ui/separator";

<Separator label="Or" align="center" />`,
  },
  sheet: {
    usage: `import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

<Sheet>
  <SheetTrigger>Open sheet</SheetTrigger>
  <SheetContent side="bottom">
    <SheetHeader>
      <SheetTitle>Edit project</SheetTitle>
    </SheetHeader>
    <SheetBody>Project settings</SheetBody>
  </SheetContent>
</Sheet>`,
  },
  sidebar: {
    usage: `import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuCollapsible,
  SidebarMenuCollapsibleContent,
  SidebarMenuCollapsibleTrigger,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

<SidebarProvider keyboardShortcut="mod+b">
  <Sidebar>
    <SidebarContent>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild><a href="/inbox">Inbox</a></SidebarMenuButton>
          <SidebarMenuBadge count={12} label="unread messages" />
          <SidebarMenuAction replacesBadge aria-label="More inbox actions">…</SidebarMenuAction>
        </SidebarMenuItem>
        <SidebarMenuCollapsible defaultOpen>
          {/* Page rows pass isActive and select via onClick; their chevron only toggles. */}
          <SidebarMenuCollapsibleTrigger>Projects</SidebarMenuCollapsibleTrigger>
          {/* Content unfolds with a fade and blur using the motion tokens. */}
          <SidebarMenuCollapsibleContent>Navigation</SidebarMenuCollapsibleContent>
        </SidebarMenuCollapsible>
      </SidebarMenu>
    </SidebarContent>
  </Sidebar>
  <main><SidebarTrigger />Page content</main>
</SidebarProvider>`,
  },
  "sidebar-layout": {
    usage: `import { Sidebar } from "@/components/ui/sidebar";
import { SidebarLayout } from "@/components/ui/sidebar-layout";

// Scroll restoration and locking target [data-slot="sidebar-layout-viewport"].
<SidebarLayout
  sidebar={<Sidebar />}
  title="Notes"
  headerContent={<nav aria-label="Page path">Workspace / Notes</nav>}
  headerActions={<button type="button">Save</button>}
>
  Page content
</SidebarLayout>`,
  },
  skeleton: {
    usage: `import { Skeleton } from "@/components/ui/skeleton";

<Skeleton loading={isLoading}>
  <span>Account details</span>
</Skeleton>`,
  },
  slider: {
    usage: `import { Slider } from "@/components/ui/slider";

<Slider aria-label="Volume" defaultValue={60} animateValue showValueTooltip />

<Slider label="Price" range draggableRange defaultValue={[20, 80]} showValueTooltip format={{ style: "currency", currency: "USD" }} thumbLabels={["Lowest price", "Highest price"]} />

<Slider label="Amount" min={0.5} max={10.5} step={1} defaultValue={3.5} />

<Slider label="Volume" defaultValue={60} inlineLabel />

<Slider label="Brightness" thumb="circle" variant="outline-ghost" defaultValue={40} />`,
  },
  "scrub-slider": {
    usage: `import { ScrubSlider } from "@/components/ui/scrub-slider";

<ScrubSlider label="Width" unit="px" min={0} max={2000} defaultValue={307} />

<ScrubSlider label="Scale" unit="×" min={0.1} max={4} step={0.01} defaultValue={1} />

<ScrubSlider label="Opacity" unit="%" value={opacity} onValueChange={setOpacity} size="sm" variant="outline-ghost" />`,
  },
  switch: {
    usage: `import { Switch } from "@/components/ui/switch";

<Switch
  aria-label="Enable notifications"
  icons
  onCheckedChange={(next, details) => {
    if (next && !canEnableNotifications) {
      details.cancel();
      return;
    }
    return saveNotifications(next);
  }}
/>`,
  },
  table: {
    usage: `import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Pinned columns automatically fade content scrolling behind their inner edges.
<Table wrap>
  <TableCaption>People</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead pinned="start">Name</TableHead>
      <TableHead align="center">Role</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {people.map((person) => (
      <TableRow key={person.id}>
        <TableHead scope="row" pinned="start">{person.name}</TableHead>
        <TableCell align="center">{person.role}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>`,
  },
  "data-table": {
    usage: `import {
  DataTable, DataTableContent, DataTableToolbar, DataTableSearch, DataTableFilter,
  DataTableViewOptions, DataTablePagination, createDataTableColumns, useDataTable,
} from "@/components/ui/data-table";

type Person = { id: string; name: string; role: string };
const helper = createDataTableColumns<Person>();
const columns = helper.columns([
  // Leaf-column pinning includes the selection gutter below grouped headings.
  helper.group({ id: "person", header: "Person", columns: helper.columns([
    helper.accessor("name", { header: "Name", enableHiding: false, meta: { rowHeader: true, pinned: "start" } }),
    helper.accessor("role", { header: "Role" }),
  ]) }),
]);

function PeopleTable({ people }: { people: Person[] }) {
  const table = useDataTable({
    data: people, columns, getRowId: (person) => person.id,
    enableMultiRowSelection: true, // Set false for single selection, including range gestures.
  });
  return (
    <DataTable table={table} selectable wrap>
      <DataTableToolbar>
        <DataTableSearch placeholder="Search people…" />
        <DataTableFilter column="role" />
        <DataTableViewOptions className="ms-auto" />
      </DataTableToolbar>
      <DataTableContent<Person> getRowLabel={(person) => person.name} />
      <DataTablePagination />
    </DataTable>
  );
}`,
  },
  "table-of-contents": {
    usage: `import { TableOfContents } from "@/components/ui/table-of-contents";

<TableOfContents
  ref={tocRef}
  items={headings}
  rootRef={articleRef}
  className="max-h-80"
/>`,
  },
  "table-of-contents-lines": {
    usage: `import { TableOfContentsLines } from "@/components/ui/table-of-contents-lines";

<TableOfContentsLines
  ref={tocRef}
  items={headings}
  rootRef={articleRef}
  className="max-h-80"
/>`,
  },
  tabs: {
    usage: `import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";

<Tabs orientation="vertical" defaultValue="account">
  <TabsList aria-label="Settings" className="max-h-48">
    <TabsTab value="account" className={({ active }) => active ? "font-semibold" : undefined}>
      Account
    </TabsTab>
    <TabsTab value="notifications">Notifications</TabsTab>
  </TabsList>
  <TabsPanel value="account" render={<section />}>Account settings</TabsPanel>
  <TabsPanel value="notifications" render={<section />}>Notification settings</TabsPanel>
</Tabs>`,
  },
  "text-shimmer": {
    usage: `import { TextShimmer } from "@/components/ui/text-shimmer";

<TextShimmer as="p" role="status" active={isSyncing} once={false} duration={2.5}>
  {isSyncing ? "Syncing changes…" : "Changes synced"}
</TextShimmer>`,
  },
  "scramble-text": {
    usage: `import { ScrambleText } from "@/components/ui/scramble-text";

<ScrambleText>Deploying changes…</ScrambleText>`,
  },
  "blur-text": {
    usage: `import { BlurText } from "@/components/ui/blur-text";

<BlurText as="h1">Minimal React components</BlurText>
<BlurText>Ready 👩‍💻</BlurText>
<BlurText by="word" delay={200}>Built on Base UI.</BlurText>`,
  },
  textarea: {
    usage: `import { Textarea } from "@/components/ui/textarea";

// Auto-grow uses layout width, including inside scaled containers.
<Textarea aria-label="Notes" placeholder="Write a note…" minRows={3} maxRows={10} />
<Textarea variant="plain" aria-label="Draft" placeholder="Write inside your own editor surface…" />`,
  },
  toggle: {
    usage: `import { Toggle } from "@/components/ui/toggle";

<Toggle aria-label="Pin item" fillBackground>Pin</Toggle>`,
  },
  tooltip: {
    usage: `import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";

<TooltipProvider>
  <Tooltip content="Save changes" trackCursorAxis="x">
    <button>Save</button>
  </Tooltip>
</TooltipProvider>`,
  },
} as const satisfies Record<string, ComponentReference>;

export type ComponentReferenceName = keyof typeof componentReferences;

export function componentReferenceMarkdown(name: string) {
  const reference = componentReferences[name as ComponentReferenceName];
  if (!reference) return undefined;

  return [
    "## Install",
    "",
    "```bash",
    publicInstallCommand(name),
    "```",
    "",
    "## Usage",
    "",
    "```tsx",
    reference.usage,
    "```",
  ].join("\n");
}
