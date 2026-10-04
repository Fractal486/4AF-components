export interface ComponentReference {
  usage: string;
}

export const componentReferences = {
  "action-button": {
    usage: `import { ActionButton } from "@/components/ui/action-button";

<ActionButton
  action={() => saveChanges()}
  pendingMode="icon"
  labels={{ success: "Saved" }}
>
  Save changes
</ActionButton>`,
  },
  "action-toggle": {
    usage: `import { ActionToggle } from "@/components/ui/action-toggle";

<ActionToggle action={(following) => setFollowing(following)}>
  Follow
</ActionToggle>`,
  },
  alert: {
    usage: `import { Alert } from "@/components/ui/alert";

<Alert variant="success">Changes saved.</Alert>`,
  },
  "alert-dialog": {
    usage: `import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

<AlertDialog>
  <AlertDialogTrigger>Delete project</AlertDialogTrigger>
  <AlertDialogAction>Delete</AlertDialogAction>
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
  badge: {
    usage: `import { Badge } from "@/components/ui/badge";

<Badge variant="solid" shape="pill">Approved</Badge>`,
  },
  button: {
    usage: `import { Button } from "@/components/ui/button";

<Button variant="primary">Deploy</Button>`,
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
    usage: `import { CommandPalette } from "@/components/ui/command-palette";

<CommandPalette groups={groups} />`,
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
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

<Dialog>
  <DialogTrigger>Open dialog</DialogTrigger>
  <DialogContent>Dialog content</DialogContent>
</Dialog>`,
  },
  "dropdown-menu": {
    usage: `import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

<DropdownMenu>
  <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
  <DropdownMenuItem>Edit</DropdownMenuItem>
  <DropdownMenuItem disabled disabledReason="Billing is available on the Pro plan.">
    Billing
  </DropdownMenuItem>
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
  <HoverCardTrigger>Hover me</HoverCardTrigger>
  <HoverCardContent>Preview content</HoverCardContent>
</HoverCard>`,
  },
  input: {
    usage: `import { Input } from "@/components/ui/input";

<Input placeholder="Search…" />`,
  },
  morph: {
    usage: `import { Morph } from "@/components/ui/morph";

<Morph
  activeKey={copied ? "done" : "idle"}
  items={{ idle: <Copy />, done: <Check /> }}
/>`,
  },
  popover: {
    usage: `import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

<Popover>
  <PopoverTrigger>Open</PopoverTrigger>
  <PopoverContent>Popover content</PopoverContent>
</Popover>`,
  },
  progress: {
    usage: `import { Progress } from "@/components/ui/progress";

<Progress value={60} />`,
  },
  radio: {
    usage: `import { Radio, RadioGroup } from "@/components/ui/radio";

<RadioGroup defaultValue="comfortable">
  <Radio value="comfortable">Comfortable</Radio>
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

<Select size="xs" defaultValue="apple">
  <SelectTrigger variant="ghost" label="Fruit">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="apple">Apple</SelectItem>
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
  <AlignedSelectTrigger variant="ghost" label="City" placeholder="Pick a city" />
  <AlignedSelectContent>
    <AlignedSelectItem value="Lisbon">Lisbon</AlignedSelectItem>
    <AlignedSelectItem value="Oslo">Oslo</AlignedSelectItem>
  </AlignedSelectContent>
</AlignedSelect>`,
  },
  "select-motion": {
    usage: `import { Select } from "@/components/ui/select-motion";

<Select defaultValue="apple">…</Select>`,
  },
  "select-motion-search": {
    usage: `import { MotionSearchSelect } from "@/components/ui/select-motion-search";

<MotionSearchSelect items={items} />`,
  },
  "select-search": {
    usage: `import { SearchSelect } from "@/components/ui/select-search";

<SearchSelect items={items} />`,
  },
  "selection-toolbar": {
    usage: `import { SelectionToolbar } from "@/components/ui/selection-toolbar";

<SelectionToolbar actions={<Button>Archive</Button>}>
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
  SheetTrigger,
} from "@/components/ui/sheet";

<Sheet>
  <SheetTrigger>Open sheet</SheetTrigger>
  <SheetContent>Sheet content</SheetContent>
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
</SidebarProvider>`,
  },
  "sidebar-layout": {
    usage: `import { SidebarLayout } from "@/components/ui/sidebar-layout";

<SidebarLayout sidebar={<Sidebar />}>Page content</SidebarLayout>`,
  },
  skeleton: {
    usage: `import { Skeleton } from "@/components/ui/skeleton";

<Skeleton className="h-4 w-32" />`,
  },
  slider: {
    usage: `import { Slider } from "@/components/ui/slider";

<Slider aria-label="Volume" defaultValue={60} showValueTooltip />

<Slider aria-label="Price range" range defaultValue={[20, 80]} />

<Slider aria-label="Volume" label="Volume" defaultValue={60} inlineLabel />`,
  },
  switch: {
    usage: `import { Switch } from "@/components/ui/switch";

<Switch aria-label="Enable notifications" />`,
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
  items={headings}
  rootRef={articleRef}
  className="max-h-80"
/>`,
  },
  "table-of-contents-lines": {
    usage: `import { TableOfContentsLines } from "@/components/ui/table-of-contents-lines";

<TableOfContentsLines
  items={headings}
  rootRef={articleRef}
  className="max-h-80"
/>`,
  },
  tabs: {
    usage: `import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs";

<Tabs defaultValue="account">
  <TabsList>
    <TabsTab value="account">Account</TabsTab>
  </TabsList>
</Tabs>

<Tabs variant="pill" size="sm" defaultValue="account">
  <TabsList maxWidth={280}>
    <TabsTab value="account">Account</TabsTab>
    <TabsTab value="notifications">Notifications</TabsTab>
    <TabsTab value="billing">Billing</TabsTab>
    <TabsTab value="team">Team members</TabsTab>
    <TabsTab value="security">Security</TabsTab>
  </TabsList>
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
  textarea: {
    usage: `import { Textarea } from "@/components/ui/textarea";

<Textarea placeholder="Write a note…" />`,
  },
  toast: {
    usage: `import { ToastProvider, useToast } from "@/components/ui/toast";

function SaveButton() {
  const toast = useToast();
  return (
    <button onClick={() => toast.add({ title: "Changes saved", variant: "title-only" })}>
      Save
    </button>
  );
}

<ToastProvider>
  <SaveButton />
</ToastProvider>`,
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

  const install = `pnpm 4af install ${name} --project <absolute-target-project>`;
  return [
    "## Install",
    "",
    "```bash",
    install,
    "```",
    "",
    "## Usage",
    "",
    "```tsx",
    reference.usage,
    "```",
  ].join("\n");
}
