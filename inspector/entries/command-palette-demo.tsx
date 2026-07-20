"use client";

import {
  Archive,
  ArrowRight,
  ArrowUpDown,
  Bell,
  Copy,
  CornerDownLeft,
  FileText,
  FolderOpen,
  Home,
  Lock,
  ListFilter,
  Monitor,
  Moon,
  Palette,
  Pencil,
  Plus,
  Settings,
  SlidersHorizontal,
  Star,
  Sun,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Badge, type BadgeProps } from "@/registry/ui/badge/badge";
import { Button } from "@/registry/ui/button/button";
import { Checkbox } from "@/registry/ui/checkbox/checkbox";
import {
  CommandPalette,
  CommandPanelRow,
  CommandPanelAction,
  CommandPanelActions,
  CommandPanelBody,
  CommandPanelFooter,
  CommandPanelList,
  type CommandGroup,
  type CommandPanelHelpers,
} from "@/registry/ui/command-palette/command-palette";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSortTrigger,
  SelectTrigger,
  SelectValue,
} from "@/registry/ui/select/select";
import { Slider } from "@/registry/ui/slider/slider";
import { Switch } from "@/registry/ui/switch/switch";

function PaletteHeaderActions() {
  return (
    <>
      <Select<string, true> multiple defaultValue={[]}>
        <SelectSortTrigger
          icon={<ListFilter />}
          showValue={false}
          aria-label="Filter by status"
        />
        <SelectContent width="content" clearable autoFocusFirstItem={false} className="min-w-36">
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="paused">Paused</SelectItem>
          <SelectItem value="archived">Archived</SelectItem>
        </SelectContent>
      </Select>

      <Select<string> defaultValue="updated">
        <SelectSortTrigger
          icon={<ArrowUpDown />}
          aria-label="Sort projects"
        />
        <SelectContent width="content" autoFocusFirstItem={false} className="min-w-40">
          <SelectItem value="updated">Recently updated</SelectItem>
          <SelectItem value="name">Name</SelectItem>
          <SelectItem value="created">Recently created</SelectItem>
        </SelectContent>
      </Select>
    </>
  );
}

export function CommandPaletteDemo({
  shortcut,
  grouped,
}: {
  shortcut: boolean;
  grouped: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const run = (label: string) => () => setLastRun(label);

  const navigation: CommandGroup["items"] = [
    { id: "home", label: "Go to Home", description: "Your dashboard overview", icon: <Home />, shortcut: "G H", keywords: ["dashboard"], onSelect: run("Go to Home") },
    {
      id: "docs",
      label: "Open Documentation",
      icon: <FileText />,
      badge: (
        <Badge
          variant="outline"
          size="sm"
          status="info"
          showIcon={false}
        >
          Beta
        </Badge>
      ),
      keywords: ["help", "guide"],
      onSelect: run("Open Documentation"),
    },
    { id: "settings", label: "Open Settings", icon: <Settings />, shortcut: "⌘,", keywords: ["preferences", "prefs"], onSelect: run("Open Settings") },
  ];

  const actions: CommandGroup["items"] = [
    { id: "new", label: "New File", icon: <Plus />, shortcut: "⌘N", onSelect: run("New File") },
    { id: "copy", label: "Copy Link", icon: <Copy />, shortcut: "⌘C", onSelect: run("Copy Link") },
    {
      id: "rename",
      label: "Rename Project…",
      description: "A single-field form panel",
      icon: <Pencil />,
      panelInput: {
        type: "text",
        label: "Project name",
        placeholder: "Enter a project name…",
        defaultValue: "Untitled project",
        form: "rename-project-form",
        name: "name",
        required: true,
      },
      // A panel item: drills into a form with its own fields and action bar.
      panel: (helpers) => (
        <RenamePanel helpers={helpers} onDone={(name) => setLastRun(`Renamed to “${name}”`)} />
      ),
    },
    {
      id: "project-settings",
      label: "Project Settings…",
      description: "Select, badge, slider, checkboxes and switches in a panel",
      icon: <SlidersHorizontal />,
      keywords: ["visibility", "storage", "notifications"],
      panel: (helpers) => (
        <SettingsPanel helpers={helpers} onDone={(summary) => setLastRun(summary)} />
      ),
    },
    {
      id: "projects",
      label: "Projects…",
      description: "A list panel with its own ⌘J actions menu",
      icon: <FolderOpen />,
      keywords: ["switch", "workspace"],
      headerActions: <PaletteHeaderActions />,
      panel: (helpers) => (
        <ProjectsPanel helpers={helpers} onDone={(summary) => setLastRun(summary)} />
      ),
      panelInput: {
        type: "search",
        label: "Search projects",
        placeholder: "Search projects…",
      },
    },
    {
      id: "theme",
      label: "Change Theme…",
      description: "Light, dark, or match the system",
      icon: <Palette />,
      keywords: ["appearance", "dark", "light"],
      // A sub-list item (no onSelect): drills into a nested command list.
      items: [
        { id: "theme-light", label: "Light", icon: <Sun />, onSelect: run("Theme: Light") },
        { id: "theme-dark", label: "Dark", icon: <Moon />, onSelect: run("Theme: Dark") },
        { id: "theme-system", label: "System", icon: <Monitor />, onSelect: run("Theme: System") },
      ],
    },
    {
      id: "delete",
      label: "Delete Project",
      icon: <Trash2 />,
      keywords: ["remove"],
      destructive: true,
      onSelect: run("Delete Project"),
    },
  ];

  const groups: CommandGroup[] = grouped
    ? [
        { heading: "Navigation", items: navigation },
        { heading: "Actions", items: actions },
      ]
    : [{ items: [...navigation, ...actions] }];

  return (
    <div className="flex flex-col items-center gap-4">
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open palette
        <span className="ml-1 flex items-center gap-0.5 text-subtle-foreground">
          <kbd className="rounded-xs bg-muted px-1 py-0.5 font-mono text-2xs">⌘</kbd>
          <kbd className="rounded-xs bg-muted px-1 py-0.5 font-mono text-2xs">K</kbd>
        </span>
      </Button>

      <p className="flex h-5 items-center gap-1.5 text-sm text-muted-foreground">
        {lastRun ? (
          <>
            Ran <ArrowRight className="size-3.5" aria-hidden />
            <span className="font-medium text-foreground">{lastRun}</span>
          </>
        ) : (
          "Try a search, a sub-page (Theme), or a form (Rename / Project Settings)."
        )}
      </p>

      <CommandPalette
        // Remounted per toggle so the demo rebuilds cleanly.
        key={`${shortcut}-${grouped}`}
        groups={groups}
        shortcut={shortcut}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}

function RenamePanel({
  helpers,
  onDone,
}: {
  helpers: CommandPanelHelpers;
  onDone: (name: string) => void;
}) {
  return (
    // The form fills the panel and splits into a scrolling body and a pinned footer, so
    // the action bar sits outside the scroll area while `type="submit"` still submits.
    <form
      id="rename-project-form"
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        onDone(helpers.inputValue.trim());
        helpers.close();
      }}
    >
      <CommandPanelBody className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Enter the new project name in the text field above.
        </p>
      </CommandPanelBody>

      <CommandPanelFooter>
        <CommandPanelAction type="submit" keys={[<CornerDownLeft key="enter" className="size-2.5" />]}>
          Save
        </CommandPanelAction>
      </CommandPanelFooter>
    </form>
  );
}

const PROJECTS = ["Aurora", "Basecamp", "Cartography", "Deep Field", "Eventide"] as const;

function ProjectsPanel({
  helpers,
  onDone,
}: {
  helpers: CommandPanelHelpers;
  onDone: (summary: string) => void;
}) {
  const [selected, setSelected] = useState<string>(PROJECTS[0]);
  const query = helpers.query.trim();
  const normalizedQuery = query.toLowerCase();
  const visibleProjects = PROJECTS.filter((project) =>
    project.toLowerCase().includes(normalizedQuery),
  );

  // Contextual actions for whichever project is highlighted — the ⌘J menu in the footer.
  // Their keybinds also work while this panel is open, without opening the menu first.
  const actionGroups: CommandGroup[] = [
    {
      heading: "Project",
      items: [
        {
          id: "open",
          label: `Open ${selected}`,
          icon: <FolderOpen />,
          keybind: "mod+o",
          onSelect: () => {
            onDone(`Opened ${selected}`);
            helpers.close();
          },
        },
        {
          id: "rename",
          label: "Rename project",
          icon: <Pencil />,
          keybind: "mod+r",
          onSelect: () => onDone(`Rename ${selected}`),
        },
        {
          id: "duplicate",
          label: "Duplicate project",
          icon: <Copy />,
          keybind: "mod+d",
          onSelect: () => onDone(`Duplicated ${selected}`),
        },
      ],
    },
    {
      heading: "Sharing",
      items: [
        {
          id: "copy",
          label: "Copy project link",
          icon: <Copy />,
          keybind: "mod+l",
          onSelect: () => onDone(`Copied link to ${selected}`),
        },
      ],
    },
    {
      heading: "Danger zone",
      items: [
        {
          id: "archive",
          label: "Archive project",
          icon: <Archive />,
          keybind: "mod+shift+a",
          onSelect: () => onDone(`Archived ${selected}`),
        },
        {
          id: "delete",
          label: "Delete project",
          icon: <Trash2 />,
          keybind: "mod+shift+backspace",
          destructive: true,
          onSelect: () => {
            onDone(`Deleted ${selected}`);
            helpers.close();
          },
        },
      ],
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CommandPanelList autoFocus={false} className="flex flex-col gap-0">
        {visibleProjects.length > 0 ? (
          <>
            {!query && (
              <CommandPanelRow
                value="new-project"
                icon={<Plus />}
                onSelect={() =>
                  helpers.openPanel({
                    title: "New project",
                    panelInput: {
                      type: "text",
                      label: "Project name",
                      placeholder: "Enter a project name…",
                      defaultValue: "Untitled project",
                      form: "new-project-form",
                      name: "name",
                      required: true,
                    },
                    panel: (panelHelpers) => (
                      <NewProjectPanel
                        helpers={panelHelpers}
                        onDone={(name, visibility) => {
                          onDone(`Created “${name}” · ${VISIBILITY[visibility]}`);
                        }}
                      />
                    ),
                  })
                }
              >
                New project
              </CommandPanelRow>
            )}
            {visibleProjects.map((project) => (
              <CommandPanelRow
                key={project}
                icon={<FolderOpen />}
                badge={
                  project === selected ? (
                    <Badge
                      variant="outline"
                      size="sm"
                      status="success"
                      showIcon={false}
                    >
                      Current
                    </Badge>
                  ) : undefined
                }
                selected={project === selected}
                onSelect={() => setSelected(project)}
                checkbox
              >
                {project}
              </CommandPanelRow>
            ))}
            {!query && (
              <CommandPanelRow
                value="delete-selected-project"
                icon={<Trash2 />}
                destructive
                onSelect={() => {
                  onDone(`Deleted ${selected}`);
                  helpers.close();
                }}
              >
                Delete {selected}
              </CommandPanelRow>
            )}
          </>
        ) : query ? (
          <CommandPanelRow
            icon={<Plus />}
            onSelect={() => {
              onDone(`Created “${query}”`);
              helpers.close();
            }}
          >
            Create “{query}”
          </CommandPanelRow>
        ) : (
          <p className="px-2.5 py-8 text-center text-sm text-muted-foreground">
            No projects found.
          </p>
        )}
      </CommandPanelList>

      <CommandPanelFooter>
        <CommandPanelAction
          onClick={() => {
            onDone(`Opened ${selected}`);
            helpers.close();
          }}
          keys={[<CornerDownLeft key="enter" className="size-2.5" />]}
        >
          Open
        </CommandPanelAction>
        {/* Rightmost, so the menu hangs off the bottom-right corner. */}
        <CommandPanelActions groups={actionGroups} />
      </CommandPanelFooter>
    </div>
  );
}

type Visibility = "private" | "team" | "public";

const VISIBILITY: Record<Visibility, string> = {
  private: "Private",
  team: "Team",
  public: "Public",
};

const VISIBILITY_STATUS: Record<Visibility, BadgeProps["status"]> = {
  private: "neutral",
  team: "info",
  public: "success",
};

function NewProjectPanel({
  helpers,
  onDone,
}: {
  helpers: CommandPanelHelpers;
  onDone: (name: string, visibility: Visibility) => void;
}) {
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [notifications, setNotifications] = useState(true);

  return (
    <form
      id="new-project-form"
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        onDone(helpers.inputValue.trim(), visibility);
        helpers.close();
      }}
    >
      <CommandPanelBody className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-muted-foreground">Visibility</span>
          <Select
            items={VISIBILITY}
            value={visibility}
            onValueChange={(value) => setVisibility(value as Visibility)}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(VISIBILITY) as Visibility[]).map((value) => (
                <SelectItem key={value} value={value}>
                  {VISIBILITY[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm text-foreground">Notifications</span>
            <span className="text-xs text-muted-foreground">Send project updates</span>
          </div>
          <Switch checked={notifications} onCheckedChange={setNotifications} />
        </div>
      </CommandPanelBody>

      <CommandPanelFooter>
        <CommandPanelAction type="submit" keys={[<CornerDownLeft key="enter" className="size-2.5" />]}>
          Create
        </CommandPanelAction>
      </CommandPanelFooter>
    </form>
  );
}

const FEATURES = [
  { key: "favorite", label: "Favorite", icon: <Star className="size-4 text-subtle-foreground" /> },
  { key: "watch", label: "Watch", icon: <Bell className="size-4 text-subtle-foreground" /> },
  { key: "locked", label: "Lock", icon: <Lock className="size-4 text-subtle-foreground" /> },
] as const;

function SettingsPanel({
  helpers,
  onDone,
}: {
  helpers: CommandPanelHelpers;
  onDone: (summary: string) => void;
}) {
  const [visibility, setVisibility] = useState<Visibility>("team");
  const [storage, setStorage] = useState(20);
  const [notifs, setNotifs] = useState({ updates: true, digest: false, mentions: true });
  const [features, setFeatures] = useState({ favorite: true, watch: false, locked: false });

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        onDone(`Saved · ${VISIBILITY[visibility]}, ${storage} GB`);
        helpers.close();
      }}
    >
      <CommandPanelBody className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-muted-foreground">Visibility</span>
          <div className="flex items-center gap-2">
            <Select
              items={VISIBILITY}
              value={visibility}
              onValueChange={(value) => setVisibility(value as Visibility)}
            >
              {/* A fixed field width — the trigger is `w-full` by default, so without this
                  it stretched across the panel. The popup matches it via `--anchor-width`. */}
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(VISIBILITY) as Visibility[]).map((value) => (
                  <SelectItem key={value} value={value}>
                    {VISIBILITY[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge status={VISIBILITY_STATUS[visibility]} size="sm">
              {VISIBILITY[visibility]}
            </Badge>
          </div>
        </div>

        <Slider
          thumb="knob"
          size="sm"
          label="Storage limit (GB)"
          min={5}
          max={100}
          step={5}
          value={storage}
          onValueChange={setStorage}
        />

        <div className="flex flex-col gap-2.5">
          <span className="text-sm text-muted-foreground">Notifications</span>
          <Checkbox
            size="sm"
            label="Product updates"
            checked={notifs.updates}
            onCheckedChange={(checked) => setNotifs((n) => ({ ...n, updates: checked }))}
          />
          <Checkbox
            size="sm"
            label="Weekly digest"
            checked={notifs.digest}
            onCheckedChange={(checked) => setNotifs((n) => ({ ...n, digest: checked }))}
          />
          <Checkbox
            size="sm"
            label="Mentions"
            checked={notifs.mentions}
            onCheckedChange={(checked) => setNotifs((n) => ({ ...n, mentions: checked }))}
          />
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-sm text-muted-foreground">Features</span>
          {FEATURES.map(({ key, label, icon }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-sm text-foreground">
                {icon}
                {label}
              </span>
              <Switch
                checked={features[key]}
                onCheckedChange={(checked) => setFeatures((f) => ({ ...f, [key]: checked }))}
              />
            </div>
          ))}
        </div>
      </CommandPanelBody>

      <CommandPanelFooter>
        <CommandPanelAction type="submit" keys={[<CornerDownLeft key="enter" className="size-2.5" />]}>
          Save
        </CommandPanelAction>
      </CommandPanelFooter>
    </form>
  );
}
