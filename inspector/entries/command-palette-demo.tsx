"use client";

import {
  Archive,
  ArrowRight,
  ArrowUpDown,
  Bell,
  BellOff,
  Copy,
  FileText,
  FolderOpen,
  Home,
  Keyboard,
  Lock,
  ListFilter,
  Monitor,
  Moon,
  Palette,
  Pencil,
  Plus,
  Settings,
  SlidersHorizontal,
  RefreshCw,
  Star,
  Sun,
  Trash2,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge, type BadgeProps } from "@/registry/ui/badge/badge";
import { Button } from "@/registry/ui/button/button";
import { Checkbox } from "@/registry/ui/checkbox/checkbox";
import {
  CommandPalette,
  CommandPanelRow,
  CommandPanelBody,
  CommandPanelFooter,
  CommandPanelList,
  CommandPanelLoading,
  CommandPanelTab,
  CommandPanelTabList,
  CommandPanelTabPanel,
  CommandPanelTabs,
  Kbd,
  useCommandPanelHighlight,
  useCommandSearch,
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

const DEMO_SHORTCUT_KEY = "p";

// `items` doubles as the value→label map the sort chip reads to show "Recently updated"
// for its `defaultValue` before the panel is ever opened, and the source the rows render
// from — one place for both.
const SORT_OPTIONS = {
  updated: "Recently updated",
  name: "Name",
  created: "Recently created",
} as const;

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

      <Select<string> defaultValue="updated" items={SORT_OPTIONS}>
        <SelectSortTrigger
          icon={<ArrowUpDown />}
          aria-label="Sort projects"
        />
        <SelectContent width="content" autoFocusFirstItem={false} className="min-w-40">
          {Object.entries(SORT_OPTIONS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}

// A shared "network latency" for the async demos: resolves after `ms`, or rejects the
// moment a newer keystroke aborts the request — the same contract a real fetch honours.
function simulateLatency(signal: AbortSignal, ms: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("aborted", "AbortError"));
    });
  });
}

// A stand-in "server index" for the async-search demo — the sort of thing a real palette
// would query over the network rather than filter in memory.
const SEARCH_INDEX: { id: string; label: string; hint: string; icon: LucideIcon }[] = [
  { id: "s-annual", label: "Annual Report 2026.pdf", hint: "Document", icon: FileText },
  { id: "s-roadmap", label: "Product Roadmap", hint: "Document", icon: FileText },
  { id: "s-budget", label: "Q3 Budget Forecast", hint: "Spreadsheet", icon: FileText },
  { id: "s-onboard", label: "Onboarding Checklist", hint: "Document", icon: FileText },
  { id: "s-brand", label: "Brand Guidelines", hint: "Document", icon: FileText },
  { id: "s-archive", label: "Archived Releases", hint: "Folder", icon: Archive },
  { id: "s-invoices", label: "Invoices 2025", hint: "Folder", icon: FolderOpen },
  { id: "s-ada", label: "Ada Lovelace", hint: "Person", icon: Star },
  { id: "s-grace", label: "Grace Hopper", hint: "Person", icon: Star },
  { id: "s-alan", label: "Alan Turing", hint: "Person", icon: Star },
  { id: "s-notify", label: "Notification Settings", hint: "Setting", icon: Bell },
  { id: "s-security", label: "Security & Access", hint: "Setting", icon: Lock },
  { id: "s-billing", label: "Billing History", hint: "Setting", icon: FileText },
  { id: "s-display", label: "Display & Appearance", hint: "Setting", icon: Monitor },
];

// A second mock source, for the async *panel* demo (Find People…). A drilled-in panel
// runs its own `useCommandSearch` against this, exactly as the root does with `onSearch`.
interface Person {
  id: string;
  name: string;
  role: string;
}

const PEOPLE: Person[] = [
  { id: "p-ada", name: "Ada Lovelace", role: "Engineering" },
  { id: "p-grace", name: "Grace Hopper", role: "Engineering" },
  { id: "p-alan", name: "Alan Turing", role: "Research" },
  { id: "p-katherine", name: "Katherine Johnson", role: "Research" },
  { id: "p-margaret", name: "Margaret Hamilton", role: "Engineering" },
  { id: "p-barbara", name: "Barbara Liskov", role: "Research" },
  { id: "p-radia", name: "Radia Perlman", role: "Infrastructure" },
  { id: "p-donald", name: "Donald Knuth", role: "Research" },
  { id: "p-tim", name: "Tim Berners-Lee", role: "Platform" },
  { id: "p-linus", name: "Linus Torvalds", role: "Infrastructure" },
];
const PEOPLE_PAGE_SIZE = 4;

async function searchPeople(query: string, signal: AbortSignal): Promise<Person[]> {
  await simulateLatency(signal, 400);
  const needle = query.toLowerCase();
  return PEOPLE.filter(
    (person) =>
      person.name.toLowerCase().includes(needle) ||
      person.role.toLowerCase().includes(needle),
  );
}

// An async list panel: the header search field feeds `helpers.query` into the shared
// engine, which debounces, cancels superseded requests and reports `searching`. The panel
// just renders the rows and a `CommandPanelLoading` row — no async plumbing of its own.
function PeopleSearchPanel({
  helpers,
  onDone,
}: {
  helpers: CommandPanelHelpers;
  onDone: (summary: string) => void;
}) {
  const [pagination, setPagination] = useState({
    query: "",
    visibleCount: PEOPLE_PAGE_SIZE,
    loading: false,
  });
  const loadMoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentPagination =
    pagination.query === helpers.query
      ? pagination
      : {
          query: helpers.query,
          visibleCount: PEOPLE_PAGE_SIZE,
          loading: false,
        };
  const { visibleCount, loading: loadingMore } = currentPagination;
  const { results, searching } = useCommandSearch<Person[]>(helpers.query, searchPeople, {
    additionalRefreshing: loadingMore,
  });
  const allPeople = results ?? [];
  const people = allPeople.slice(0, visibleCount);
  const trimmed = helpers.query.trim();
  const lastVisibleId = people.at(-1)?.id;
  const hasMore = visibleCount < allPeople.length;

  useEffect(
    () => () => {
      if (loadMoreTimerRef.current) clearTimeout(loadMoreTimerRef.current);
    },
    [helpers.query],
  );

  const handleHighlight = (value: unknown) => {
    if (value !== lastVisibleId || !hasMore || loadingMore) return;
    const query = helpers.query;
    setPagination({ query, visibleCount, loading: true });
    loadMoreTimerRef.current = setTimeout(() => {
      setPagination((current) =>
        current.query === query
          ? {
              query,
              visibleCount: current.visibleCount + PEOPLE_PAGE_SIZE,
              loading: false,
            }
          : current,
      );
    }, 500);
  };
  useCommandPanelHighlight(handleHighlight);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CommandPanelList autoFocus={false} className="flex flex-col gap-0">
        {/* First load only — once results are on screen, refining shows the header's inline
            loader instead (from the palette), so the two never both appear. */}
        {searching && results === null && (
          <CommandPanelLoading>Searching people…</CommandPanelLoading>
        )}
        {people.map((person) => (
          <CommandPanelRow
            key={person.id}
            value={person.id}
            icon={<User />}
            badge={<span className="text-xs text-subtle-foreground">{person.role}</span>}
            onSelect={() => {
              onDone(`Opened ${person.name}`);
              helpers.close();
            }}
          >
            {person.name}
          </CommandPanelRow>
        ))}
        {!searching && trimmed === "" && (
          <p className="px-2.5 py-8 text-center text-sm text-muted-foreground">
            Type to search people.
          </p>
        )}
        {!searching && trimmed !== "" && people.length === 0 && (
          <p className="px-2.5 py-8 text-center text-sm text-muted-foreground">
            No people found.
          </p>
        )}
      </CommandPanelList>
    </div>
  );
}

export function CommandPaletteDemo({
  shortcut,
  grouped,
  search,
  tabs,
}: {
  shortcut: boolean;
  grouped: boolean;
  search: boolean;
  tabs: "fill" | "underline";
}) {
  const [open, setOpen] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const run = (label: string) => () => setLastRun(label);

  useEffect(() => {
    if (!shortcut) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== DEMO_SHORTCUT_KEY ||
        !event.shiftKey ||
        !(event.metaKey || event.ctrlKey)
      ) {
        return;
      }

      event.preventDefault();
      setOpen((current) => !current);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcut]);

  // A mock server search: waits out a latency, honours the abort signal so superseded
  // keystrokes cancel, and returns already-ranked results (here, a plain substring match).
  const searchSource = async (q: string, signal: AbortSignal): Promise<CommandGroup[]> => {
    await simulateLatency(signal, 450);
    const needle = q.toLowerCase();
    const hits = SEARCH_INDEX.filter((entry) => entry.label.toLowerCase().includes(needle));
    if (hits.length === 0) return [];
    return [
      {
        heading: "Results",
        items: hits.map((entry) => ({
          id: entry.id,
          label: entry.label,
          description: entry.hint,
          icon: <entry.icon />,
          onSelect: run(entry.label),
        })),
      },
    ];
  };

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
          // Static label in a list that filters/reorders — don't let it FLIP its own
          // position as the row moves.
          animateLayout={false}
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
      id: "find-people",
      label: "Find People…",
      description: "An async list panel backed by useCommandSearch",
      icon: <Users />,
      keywords: ["members", "team", "search", "directory"],
      panelInput: {
        type: "search",
        label: "Search people",
        placeholder: "Search people…",
      },
      panel: (helpers) => (
        <PeopleSearchPanel helpers={helpers} onDone={(summary) => setLastRun(summary)} />
      ),
    },
    {
      id: "shortcuts",
      label: "Keyboard Shortcuts…",
      description: "A panel with a tab row under its header",
      icon: <Keyboard />,
      keywords: ["keys", "hotkeys", "help", "tabs"],
      panelInput: {
        type: "search",
        label: "Search shortcuts",
        placeholder: "Search shortcuts…",
      },
      panel: (helpers) => <ShortcutsPanel query={helpers.query} variant={tabs} />,
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
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        aria-keyshortcuts="Control+Shift+P Meta+Shift+P"
      >
        Open palette
        <span className="ml-1 flex items-center gap-0.5 text-subtle-foreground">
          <kbd className="rounded-xs border border-current/50 px-1 py-0.5 font-mono text-2xs">⌘</kbd>
          <kbd className="rounded-xs border border-current/50 px-1 py-0.5 font-mono text-2xs">⇧</kbd>
          <kbd className="rounded-xs border border-current/50 px-1 py-0.5 font-mono text-2xs">P</kbd>
        </span>
      </Button>

      <p className="flex h-5 items-center gap-1.5 text-sm text-muted-foreground">
        {lastRun ? (
          <>
            Ran <ArrowRight className="size-3.5" aria-hidden />
            <span className="font-medium text-foreground">{lastRun}</span>
          </>
        ) : search ? (
          "Type to search a mock server (try “report”, “settings”, or a name). Clear it for the commands."
        ) : (
          "Try a search, a sub-page (Theme), or a form (Rename / Project Settings)."
        )}
      </p>

      <CommandPalette
        // Remounted per toggle so the demo rebuilds cleanly.
        key={`${shortcut}-${grouped}-${search}-${tabs}`}
        groups={groups}
        // With async on, the static groups become the resting state (shown while the query
        // is empty) and the mock server takes over the moment you type.
        onSearch={search ? searchSource : undefined}
        // The demo owns a separate shortcut so the component's default ⌘K binding does not
        // compete with the docs shell while this page is being inspected.
        shortcut={false}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}

const SHORTCUT_SECTIONS = [
  {
    id: "general",
    label: "General",
    shortcuts: [
      { keys: ["⌘", "K"], action: "Open the palette" },
      { keys: ["⌘", "J"], action: "Actions for the selected row" },
      { keys: ["?"], action: "Keyboard shortcuts" },
      { keys: ["Tab"], action: "Next panel tab" },
      { keys: ["Shift", "Tab"], action: "Previous panel tab" },
    ],
  },
  {
    id: "navigation",
    label: "Navigation",
    shortcuts: [
      { keys: ["G", "H"], action: "Go to Home" },
      { keys: ["J"], action: "Next item" },
      { keys: ["K"], action: "Previous item" },
    ],
  },
  {
    id: "editing",
    label: "Editing",
    shortcuts: [
      { keys: ["⌘", "N"], action: "New file" },
      { keys: ["⌘", "C"], action: "Copy link" },
      { keys: ["⌘", ","], action: "Open settings" },
    ],
  },
] as const;

// A tabbed panel: the tab row narrows to one section, and the header field filters within
// whichever is selected. The tabs only re-filter one list, so a single tab panel whose
// value follows the selection is all the wiring it needs.
function ShortcutsPanel({ query, variant }: { query: string; variant: "fill" | "underline" }) {
  const [tab, setTab] = useState("all");
  const needle = query.trim().toLowerCase();
  const sections = SHORTCUT_SECTIONS
    .filter((section) => tab === "all" || section.id === tab)
    .map((section) => ({
      ...section,
      shortcuts: section.shortcuts.filter((shortcut) => shortcut.action.toLowerCase().includes(needle)),
    }))
    .filter((section) => section.shortcuts.length > 0);

  return (
    <CommandPanelTabs value={tab} onValueChange={(next) => setTab(next as string)}>
      <CommandPanelTabList aria-label="Shortcut sections" variant={variant}>
        <CommandPanelTab value="all">All</CommandPanelTab>
        {SHORTCUT_SECTIONS.map((section) => (
          <CommandPanelTab key={section.id} value={section.id}>{section.label}</CommandPanelTab>
        ))}
      </CommandPanelTabList>
      <CommandPanelTabPanel value={tab}>
        <CommandPanelBody className="px-1.5 py-1.5">
          {sections.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No shortcuts match</p>
          ) : sections.map((section) => (
            <section key={section.id} className="mb-1 last:mb-0">
              {tab === "all" && (
                <h3 className="px-2.5 pt-2 pb-1 text-xs font-medium text-subtle-foreground">{section.label}</h3>
              )}
              <ul>
                {section.shortcuts.map((shortcut) => (
                  <li
                    key={shortcut.action}
                    className="flex min-h-9 items-center justify-between gap-4 px-2.5 py-1.5 text-sm text-foreground"
                  >
                    {shortcut.action}
                    <span className="flex items-center gap-0.5">
                      {shortcut.keys.map((key) => <Kbd key={key}>{key}</Kbd>)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </CommandPanelBody>
      </CommandPanelTabPanel>
      <CommandPanelFooter />
    </CommandPanelTabs>
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

      <CommandPanelFooter enter={{ label: "Save", type: "submit" }} />
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
      // The three rows that report in place instead of choosing and closing: one that
      // waits and confirms, one that waits and lands, one that just flips.
      heading: "In place",
      items: [
        {
          id: "sync",
          label: "Sync now",
          icon: <RefreshCw />,
          action: () => new Promise((resolve) => setTimeout(resolve, 1200)),
          labels: { pending: "Syncing…", success: "Synced" },
        },
        {
          id: "watch",
          label: "Watch project",
          icon: <Bell />,
          defaultChecked: false,
          action: () => new Promise((resolve) => setTimeout(resolve, 900)),
          labels: { pending: "Subscribing…", checked: "Watching" },
          icons: { checked: <BellOff /> },
        },
        {
          id: "star",
          label: "Star project",
          icon: <Star />,
          defaultChecked: false,
          labels: { checked: "Starred" },
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
          // Asks first: the row morphs to "Confirm?", and only the second press deletes
          // and closes the menu. Disarms on Escape, on the menu closing, or after 3s.
          confirm: { label: "Confirm?" },
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

      <CommandPanelFooter
        enter={{
          label: "Open",
          onClick: () => {
            onDone(`Opened ${selected}`);
            helpers.close();
          },
        }}
        actions={{ groups: actionGroups }}
      />
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

      <CommandPanelFooter enter={{ label: "Create", type: "submit" }} />
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
            label="Product updates"
            checked={notifs.updates}
            onCheckedChange={(checked) => setNotifs((n) => ({ ...n, updates: checked }))}
          />
          <Checkbox
            label="Weekly digest"
            checked={notifs.digest}
            onCheckedChange={(checked) => setNotifs((n) => ({ ...n, digest: checked }))}
          />
          <Checkbox
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

      <CommandPanelFooter enter={{ label: "Save", type: "submit" }} />
    </form>
  );
}
