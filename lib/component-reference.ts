export interface ComponentReference {
  importName: string;
  usage: string;
}

export const componentReferences = {
  "action-button": {
    importName: "ActionButton",
    usage: `import { ActionButton } from "@/components/ui/action-button";

<ActionButton action={() => saveChanges()}>Save changes</ActionButton>`,
  },
  "action-toggle": {
    importName: "ActionToggle",
    usage: `import { ActionToggle } from "@/components/ui/action-toggle";

<ActionToggle action={(following) => setFollowing(following)}>
  Follow
</ActionToggle>`,
  },
  alert: {
    importName: "Alert",
    usage: `import { Alert } from "@/components/ui/alert";

<Alert variant="success">Changes saved.</Alert>`,
  },
  "alert-dialog": {
    importName: "AlertDialog",
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
    importName: "AsciiLoader",
    usage: `import { AsciiLoader } from "@/components/ui/ascii-loader";

<AsciiLoader label="Loading" />`,
  },
  badge: {
    importName: "Badge",
    usage: `import { Badge } from "@/components/ui/badge";

<Badge variant="solid">Approved</Badge>`,
  },
  button: {
    importName: "Button",
    usage: `import { Button } from "@/components/ui/button";

<Button variant="primary">Deploy</Button>`,
  },
  "button-group": {
    importName: "ButtonGroup",
    usage: `import { ButtonGroup } from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";

<ButtonGroup>
  <Button>Back</Button>
  <Button>Next</Button>
</ButtonGroup>`,
  },
  checkbox: {
    importName: "Checkbox",
    usage: `import { Checkbox } from "@/components/ui/checkbox";

<Checkbox label="Accept terms and conditions" />`,
  },
  collapsible: {
    importName: "Collapsible",
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
    importName: "CommandPalette",
    usage: `import { CommandPalette } from "@/components/ui/command-palette";

<CommandPalette groups={groups} />`,
  },
  "copy-button": {
    importName: "CopyButton",
    usage: `import { CopyButton } from "@/components/ui/copy-button";

<CopyButton value="Text to copy" />`,
  },
  "delete-button": {
    importName: "DeleteButton",
    usage: `import { DeleteButton } from "@/components/ui/delete-button";

<DeleteButton onDelete={() => removeItem(id)}>Delete</DeleteButton>`,
  },
  dialog: {
    importName: "Dialog",
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
    importName: "DropdownMenu",
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
    importName: "Empty",
    usage: `import { Empty, EmptyTitle } from "@/components/ui/empty";

<Empty>
  <EmptyTitle>No projects yet</EmptyTitle>
</Empty>`,
  },
  "hover-card": {
    importName: "HoverCard",
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
    importName: "Input",
    usage: `import { Input } from "@/components/ui/input";

<Input placeholder="Search…" />`,
  },
  morph: {
    importName: "Morph",
    usage: `import { Morph } from "@/components/ui/morph";

<Morph
  activeKey={copied ? "done" : "idle"}
  items={{ idle: <Copy />, done: <Check /> }}
/>`,
  },
  popover: {
    importName: "Popover",
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
    importName: "Progress",
    usage: `import { Progress } from "@/components/ui/progress";

<Progress value={60} />`,
  },
  radio: {
    importName: "RadioGroup",
    usage: `import { Radio, RadioGroup } from "@/components/ui/radio";

<RadioGroup defaultValue="comfortable">
  <Radio value="comfortable">Comfortable</Radio>
</RadioGroup>`,
  },
  select: {
    importName: "Select",
    usage: `import {
  Select,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

<Select defaultValue="apple">
  <SelectTrigger />
  <SelectItem value="apple">Apple</SelectItem>
</Select>`,
  },
  "select-motion": {
    importName: "Select",
    usage: `import { Select } from "@/components/ui/select-motion";

<Select defaultValue="apple">…</Select>`,
  },
  "select-motion-search": {
    importName: "MotionSearchSelect",
    usage: `import { MotionSearchSelect } from "@/components/ui/select-motion-search";

<MotionSearchSelect items={items} />`,
  },
  "select-search": {
    importName: "SearchSelect",
    usage: `import { SearchSelect } from "@/components/ui/select-search";

<SearchSelect items={items} />`,
  },
  "selection-toolbar": {
    importName: "SelectionToolbar",
    usage: `import { SelectionToolbar } from "@/components/ui/selection-toolbar";

<SelectionToolbar actions={<Button>Archive</Button>}>
  Selectable content
</SelectionToolbar>`,
  },
  separator: {
    importName: "Separator",
    usage: `import { Separator } from "@/components/ui/separator";

<Separator />`,
  },
  sheet: {
    importName: "Sheet",
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
    importName: "Sidebar",
    usage: `import { Sidebar } from "@/components/ui/sidebar";

<Sidebar>
  <SidebarContent>Navigation</SidebarContent>
</Sidebar>`,
  },
  "sidebar-layout": {
    importName: "SidebarLayout",
    usage: `import { SidebarLayout } from "@/components/ui/sidebar-layout";

<SidebarLayout sidebar={<Sidebar />}>Page content</SidebarLayout>`,
  },
  skeleton: {
    importName: "Skeleton",
    usage: `import { Skeleton } from "@/components/ui/skeleton";

<Skeleton className="h-4 w-32" />`,
  },
  slider: {
    importName: "Slider",
    usage: `import { Slider } from "@/components/ui/slider";

<Slider aria-label="Volume" defaultValue={60} showValueTooltip />`,
  },
  switch: {
    importName: "Switch",
    usage: `import { Switch } from "@/components/ui/switch";

<Switch aria-label="Enable notifications" />`,
  },
  "table-of-contents": {
    importName: "TableOfContents",
    usage: `import { TableOfContents } from "@/components/ui/table-of-contents";

<TableOfContents items={headings} />`,
  },
  "table-of-contents-lines": {
    importName: "TableOfContentsLines",
    usage: `import { TableOfContentsLines } from "@/components/ui/table-of-contents-lines";

<TableOfContentsLines items={headings} />`,
  },
  tabs: {
    importName: "Tabs",
    usage: `import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs";

<Tabs defaultValue="account">
  <TabsList>
    <TabsTab value="account">Account</TabsTab>
  </TabsList>
</Tabs>`,
  },
  "text-shimmer": {
    importName: "TextShimmer",
    usage: `import { TextShimmer } from "@/components/ui/text-shimmer";

<TextShimmer>Syncing changes…</TextShimmer>`,
  },
  textarea: {
    importName: "Textarea",
    usage: `import { Textarea } from "@/components/ui/textarea";

<Textarea placeholder="Write a note…" />`,
  },
  toast: {
    importName: "ToastProvider, useToast",
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
    importName: "Toggle",
    usage: `import { Toggle } from "@/components/ui/toggle";

<Toggle aria-label="Pin item">Pin</Toggle>`,
  },
  tooltip: {
    importName: "Tooltip",
    usage: `import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";

<Tooltip>
  <TooltipTrigger>Hover me</TooltipTrigger>
</Tooltip>`,
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
