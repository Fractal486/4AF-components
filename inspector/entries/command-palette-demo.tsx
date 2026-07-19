"use client";

import {
  ArrowRight,
  Bell,
  Copy,
  CornerDownLeft,
  FileText,
  Home,
  Lock,
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
  CommandPanelAction,
  CommandPanelBody,
  CommandPanelFooter,
  type CommandGroup,
  type CommandPanelHelpers,
} from "@/registry/ui/command-palette/command-palette";
import { Input } from "@/registry/ui/input/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/ui/select/select";
import { Slider } from "@/registry/ui/slider/slider";
import { Switch } from "@/registry/ui/switch/switch";

export function CommandPaletteDemo({
  shortcut,
  grouped,
  create,
}: {
  shortcut: boolean;
  grouped: boolean;
  create: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const run = (label: string) => () => setLastRun(label);

  const navigation: CommandGroup["items"] = [
    { id: "home", label: "Go to Home", description: "Your dashboard overview", icon: <Home />, shortcut: "G H", keywords: ["dashboard"], onSelect: run("Go to Home") },
    { id: "docs", label: "Open Documentation", icon: <FileText />, keywords: ["help", "guide"], onSelect: run("Open Documentation") },
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
    { id: "delete", label: "Delete Project", icon: <Trash2 />, keywords: ["remove"], onSelect: run("Delete Project") },
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
        key={`${shortcut}-${grouped}-${create}`}
        groups={groups}
        shortcut={shortcut}
        onCreate={create ? (query) => setLastRun(`Create “${query}”`) : undefined}
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
  const [name, setName] = useState("Untitled project");

  return (
    // The form fills the panel and splits into a scrolling body and a pinned footer, so
    // the action bar sits outside the scroll area while `type="submit"` still submits.
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        onDone(name.trim() || "Untitled project");
        helpers.close();
      }}
    >
      <CommandPanelBody className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-muted-foreground">Project name</span>
          <Input
            autoFocus
            tone="accent"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
      </CommandPanelBody>

      <CommandPanelFooter>
        <CommandPanelAction type="submit" keys={[<CornerDownLeft key="enter" className="size-2.5" />]}>
          Save
        </CommandPanelAction>
      </CommandPanelFooter>
    </form>
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
