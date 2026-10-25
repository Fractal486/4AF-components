import { publicInstallCommand } from "./site.ts";

export interface ComponentReference {
  usage: string;
}

export const componentReferences = {
  "action-button": {
    usage: `import { ActionButton } from "@/components/ui/action-button";

// Pending keeps keyboard focus; completion callbacks also run after unmount.
// Idle sizing copies reserve the loader's space without mounting its animation.
<ActionButton
  action={() => saveChanges()}
  labels={{ success: "Saved" }}
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
  labels={{ pressed: "Following" }}
>
  Follow
</ActionToggle>`,
  },
  alert: {
    usage: `import { Alert } from "@/components/ui/alert";

<Alert variant="success">Changes saved.</Alert>
<Alert variant="loading">Checking availability…</Alert>`,
  },
  "alert-dialog": {
    usage: `import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

<AlertDialog>
  <AlertDialogTrigger>Delete project</AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogTitle>Delete project?</AlertDialogTitle>
    <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction variant="destructive">Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`,
  },
  "ascii-loader": {
    usage: `import { AsciiLoader } from "@/components/ui/ascii-loader";

<AsciiLoader label="Loading" />`,
  },
  "matrix-loader": {
    usage: [
      'import { MatrixLoader } from "@/components/ui/matrix-loader";',
      "",
      '<MatrixLoader variant="twinkle" label="Loading" />',
    ].join("\n"),
  },
  "classic-loader": {
    usage: `import { ClassicLoader } from "@/components/ui/classic-loader";

<ClassicLoader size="md" speed={1} label="Loading results" />`,
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
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbCollapse>
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
  badge: {
    usage: `import { CircleX } from "lucide-react";
import { Badge } from "@/components/ui/badge";

<Badge variant="solid" shape="pill">Approved</Badge>
<Badge status="loading">Syncing</Badge>
<Badge status="danger" icons={{ danger: <CircleX /> }}>Failed</Badge>
<Badge color="oklch(0.7 0.15 250 / 0.15)">Beta</Badge>`,
  },
  button: {
    usage: `import { Button } from "@/components/ui/button";

<Button variant="primary">Deploy</Button>
// Keeps keyboard focus and blocks activation; inherits LoaderProvider's indicator.
<Button loading>Deploy</Button>`,
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
    usage: `import { Checkbox } from "@/components/ui/checkbox";

<Checkbox label="Accept terms and conditions" />`,
  },
  collapsible: {
    usage: `import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

<Collapsible>
  <CollapsibleTrigger>Details</CollapsibleTrigger>
  <CollapsibleContent>More information.</CollapsibleContent>
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
}] }]} />
// The shortcut opens the actions menu and arms confirmation before it can delete.`,
  },
  "copy-button": {
    usage: `import { CopyButton } from "@/components/ui/copy-button";

// Async values keep keyboard focus while copying and block repeat activation.
<CopyButton value="Text to copy" size="md">Copy</CopyButton>`,
  },
  "delete-button": {
    usage: `import { DeleteButton } from "@/components/ui/delete-button";

<DeleteButton onDelete={() => removeItem(id)}>Delete</DeleteButton>`,
  },
  dialog: {
    usage: `import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

<Dialog>
  <DialogTrigger>Open dialog</DialogTrigger>
  <DialogContent>
    <DialogTitle>Edit project</DialogTitle>
    Project settings
  </DialogContent>
</Dialog>`,
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
  <DropdownMenuContent>
    <DropdownMenuItem>Edit</DropdownMenuItem>
    <DropdownMenuItem disabled disabledReason="Billing is available on the Pro plan.">
      Billing
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`,
  },
  empty: {
    usage: `import { Empty, EmptyTitle } from "@/components/ui/empty";

<Empty>
  <EmptyTitle>No projects yet</EmptyTitle>
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
  <HoverCardContent>Preview content</HoverCardContent>
</HoverCard>`,
  },
  input: {
    usage: `import { Input } from "@/components/ui/input";

<Input aria-label="Search" placeholder="Search…" />`,
  },
  morph: {
    usage: `import { Check, Copy } from "lucide-react";
import { Morph } from "@/components/ui/morph";

// LoadingIndicator slots keep their size in hidden copies without mounting a loader.
<Morph
  activeKey={copied ? "done" : "idle"}
  items={{ idle: <Copy />, done: <Check /> }}
/>

// A swap inside a known box mounts only the showing item: no sizing copies at all.
<Morph
  sizing="fixed"
  className="size-4"
  activeKey={copied ? "done" : "idle"}
  items={{ idle: <Copy />, done: <Check /> }}
/>`,
  },
  "date-picker": {
    usage: `import { DatePicker, DateRangePicker } from "@/components/ui/date-picker";

{/* Both pickers use a popover with 34px calendar cells on every device. */}
<DatePicker value={date} onValueChange={setDate} name="due" clearable />
{/* Today returns to the current month without selecting; Clear resets the value. */}
{/* Use showToday={false} and clearable={false} to omit the footer. */}
{/* The calendar shows only the weeks needed for each month. */}
{/* dateFormat="numeric" shows 19 / 10 / 2026 in every locale. */}
{/* calendarProps.timeZone keeps labels, submitted dates, and the grid in the same zone. */}
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
  <PopoverContent>
    <PopoverTitle>Display options</PopoverTitle>
    Popover content
  </PopoverContent>
</Popover>`,
  },
  progress: {
    usage: `import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";

<Progress value={60} className="space-y-2">
  <div className="flex items-baseline justify-between text-sm">
    <ProgressLabel>Uploading files</ProgressLabel>
    <ProgressValue className="tabular-nums" />
  </div>
</Progress>`,
  },
  radio: {
    usage: `import { Radio, RadioGroup } from "@/components/ui/radio";

<RadioGroup aria-label="Density" defaultValue="comfortable">
  <Radio value="comfortable" label="Comfortable" />
</RadioGroup>`,
  },
  select: {
    usage: `import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectSub,
  SelectSubContent,
  SelectSubTrigger,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// The opening row is the selection, then the first enabled option in rendered order.
<Select size="xs" defaultValue="apple">
  <SelectTrigger variant="ghost" label="Fruit">
    <SelectValue />
  </SelectTrigger>
  <SelectContent clearable>
    <SelectItem value="apple">Apple</SelectItem>
    <SelectSeparator />
    <SelectSub>
      <SelectSubTrigger>More fruit</SelectSubTrigger>
      <SelectSubContent>
        <SelectItem value="banana">Banana</SelectItem>
      </SelectSubContent>
    </SelectSub>
  </SelectContent>
</Select>
// Clear reports null (or [] for multiple) to onValueChange(value, details).
// Call details.cancel() in that callback to keep the selection.`,
  },
  "select-aligned": {
    usage: `import {
  AlignedSelect,
  AlignedSelectContent,
  AlignedSelectItem,
  AlignedSelectTrigger,
} from "@/components/ui/select-aligned";

// Dynamic option updates preserve rendered order for opening and search highlights.
<AlignedSelect size="xs" value={city} onValueChange={setCity}>
  <AlignedSelectTrigger variant="ghost" label="City" placeholder="Pick a city" />
  <AlignedSelectContent>
    <AlignedSelectItem value="Lisbon">Lisbon</AlignedSelectItem>
    <AlignedSelectItem value="Oslo">Oslo</AlignedSelectItem>
  </AlignedSelectContent>
</AlignedSelect>`,
  },
  "select-search": {
    usage: `import { SearchSelect, SearchSelectInput, SearchSelectContent, SearchSelectItem } from "@/components/ui/select-search";

// Focusing dims the selection; clicking a row commits it and unfocuses the field.
<SearchSelect items={items} defaultValue={items[0]}>
  <SearchSelectInput aria-label="Choose an option" placeholder="Search…" />
  <SearchSelectContent>
    {(item) => <SearchSelectItem key={item.value} value={item}>{item.label}</SearchSelectItem>}
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
  separator: {
    usage: `import { Separator } from "@/components/ui/separator";

<Separator />`,
  },
  sheet: {
    usage: `import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

<Sheet>
  <SheetTrigger>Open sheet</SheetTrigger>
  <SheetContent>
    <SheetTitle>Edit project</SheetTitle>
    Project settings
  </SheetContent>
</Sheet>`,
  },
  sidebar: {
    usage: `import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuCollapsible,
  SidebarMenuCollapsibleContent,
  SidebarMenuCollapsibleTrigger,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

<SidebarProvider>
  <Sidebar>
    <SidebarContent>
      <SidebarMenu>
        <SidebarMenuCollapsible defaultOpen>
          <SidebarMenuCollapsibleTrigger>Projects</SidebarMenuCollapsibleTrigger>
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

<Skeleton className="h-4 w-32" />`,
  },
  slider: {
    usage: `import { Slider } from "@/components/ui/slider";

<Slider aria-label="Volume" defaultValue={60} showValueTooltip />

<Slider label="Price" range defaultValue={[20, 80]} thumbLabels={["Lowest price", "Highest price"]} />

// Typed values snap to the grid starting at 0.5, preserving its decimal precision.
<Slider label="Amount" min={0.5} max={10.5} step={1} defaultValue={3.5} />

<Slider label="Volume" defaultValue={60} inlineLabel />`,
  },
  switch: {
    usage: `import { Switch } from "@/components/ui/switch";

<Switch
  aria-label="Enable notifications"
  onCheckedChange={(next, details) => {
    if (next && !canEnableNotifications) details.cancel();
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

<Table>
  <TableCaption>People</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Role</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {people.map((person) => (
      <TableRow key={person.id}>
        <TableCell>{person.name}</TableCell>
        <TableCell>{person.role}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>`,
  },
  "data-table": {
    usage: `import {
  DataTable,
  DataTableHead,
  DataTableRow,
  DataTableRowActions,
  TableBody,
  TableCell,
  TableHeader,
} from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

<DataTable
  selectable
  selectionBar
  actionColumn
  rows={people.map((person) => person.id)}
  value={selected}
  onValueChange={setSelected}
  sort={sort}
  onSortChange={setSort}
  selectionActions={<Button size="xs" variant="ghost">Export</Button>}
>
  <TableHeader>
    <DataTableRow>
      <DataTableHead sortKey="name">Name</DataTableHead>
      <DataTableHead>Role</DataTableHead>
    </DataTableRow>
  </TableHeader>
  <TableBody>
    {sortPeople(people, sort).map((person) => (
      <DataTableRow
        key={person.id}
        value={person.id}
        selectLabel={\`Select \${person.name}\`}
        actions={
          <DataTableRowActions label={\`Actions for \${person.name}\`}>
            <DropdownMenuItem>Edit</DropdownMenuItem>
          </DataTableRowActions>
        }
      >
        <TableCell>{person.name}</TableCell>
        <TableCell>{person.role}</TableCell>
      </DataTableRow>
    ))}
  </TableBody>
</DataTable>`,
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

<Tabs defaultValue="account">
  <TabsList>
    <TabsTab value="account">Account</TabsTab>
  </TabsList>
  <TabsPanel value="account">Account settings</TabsPanel>
</Tabs>

<Tabs variant="pill" size="sm" defaultValue="account">
  <TabsList maxWidth={280}>
    <TabsTab value="account">Account</TabsTab>
    <TabsTab value="notifications">Notifications</TabsTab>
    <TabsTab value="billing">Billing</TabsTab>
    <TabsTab value="team">Team members</TabsTab>
    <TabsTab value="security">Security</TabsTab>
  </TabsList>
  <TabsPanel value="account">Account settings</TabsPanel>
  <TabsPanel value="notifications">Notification settings</TabsPanel>
  <TabsPanel value="billing">Billing settings</TabsPanel>
  <TabsPanel value="team">Team members</TabsPanel>
  <TabsPanel value="security">Security settings</TabsPanel>
</Tabs>`,
  },
  "text-shimmer": {
    usage: `import { TextShimmer } from "@/components/ui/text-shimmer";

<TextShimmer duration={2.5}>Syncing changes…</TextShimmer>`,
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

<Textarea aria-label="Notes" placeholder="Write a note…" />
<Textarea variant="plain" aria-label="Draft" placeholder="Write inside your own editor surface…" />`,
  },
  toggle: {
    usage: `import { Toggle } from "@/components/ui/toggle";

<Toggle aria-label="Pin item">Pin</Toggle>`,
  },
  tooltip: {
    usage: `import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";

<TooltipProvider>
  <Tooltip content="Save changes">
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
