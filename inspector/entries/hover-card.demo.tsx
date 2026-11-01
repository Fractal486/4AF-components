"use client";

import { useState } from "react";
import {
  HoverCard, HoverCardContent, HoverCardTrigger, createHoverCardHandle, type HoverCardContentProps,
} from "@/registry/ui/hover-card/hover-card";

const people = [
  { name: "Alex Morgan", handle: "alexmorgan", initials: "AM", bio: "Product designer working on thoughtful, accessible interfaces." },
  { name: "Taylor Chen", handle: "taylorchen", initials: "TC", bio: "Engineer building tools for creative teams. Interested in typography, interaction design, and making everyday work simpler." },
] as const;

type Person = typeof people[number];

export function HoverCardDemo({ side, delay, loading, content, shared, autoSize, lockSide }: {
  side: HoverCardContentProps["side"];
  delay: number;
  loading: boolean;
  content: "short" | "long";
  shared: boolean;
  autoSize: boolean;
  lockSide: boolean;
}) {
  const [handle] = useState(() => createHoverCardHandle<Person>());
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {(shared ? people : people.slice(0, 1)).map(person => (
        <HoverCardTrigger key={person.handle} handle={handle} payload={person} delay={delay}
          className="rounded-xs font-medium text-foreground underline decoration-border-strong decoration-1 underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-2 focus-visible:ring-ring"
          href="#" onClick={event => event.preventDefault()}>
          @{person.handle}
        </HoverCardTrigger>
      ))}
      <HoverCard handle={handle}>
        {({ payload = people[0] }) => (
          <HoverCardContent side={side} loading={loading} autoSize={autoSize} lockSide={lockSide}>
            <div className="flex gap-3">
              <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                {payload.initials}
              </span>
              <div className="min-w-0 space-y-1">
                <p className="font-semibold text-foreground">{payload.name}</p>
                <p className="text-muted-foreground">@{payload.handle}</p>
                <p className="text-pretty text-muted-foreground">{payload.bio}</p>
              </div>
            </div>
            {(expanded || content === "long") && (
              <div className="mt-3 space-y-2 text-muted-foreground">
                <p>Recent work: https://example.com/people/{payload.handle}/projects/accessible-design-system-and-component-library</p>
                {content === "long" && Array.from({ length: 18 }, (_, i) => (
                  <p key={i}>Project {i + 1}: small improvements to the tools people use every day.</p>
                ))}
              </div>
            )}
            <button type="button" className="mt-3 cursor-pointer text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
              aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
              {expanded ? "Less about this person" : "More about this person"}
            </button>
          </HoverCardContent>
        )}
      </HoverCard>
    </div>
  );
}
