import type { ReactNode } from "react";
import type { ComponentDemoName } from "@/stories/demo-names";
import { NavIcon } from "@/components/site/nav-icons";

const FILLED = { fill: "currentColor", fillOpacity: 0.3 } as const;
const TONE = { fill: "currentColor", fillOpacity: 0.3, stroke: "none" } as const;
const SOLID = { fill: "currentColor", stroke: "none" } as const;
const FAINT = { strokeOpacity: 0.4 } as const;

/**
 * `wide` draws on a 32x16 grid at the row's icon height, for shapes that read as long rails. Its
 * `data-wide-icon` lets the dropdown widen the row's square icon slot to fit.
 */
function Icon({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <svg viewBox={wide ? "0 0 32 16" : "0 0 16 16"} fill="none" stroke="currentColor" strokeWidth={1.25}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" data-wide-icon={wide || undefined}>
      {children}
    </svg>
  );
}

/**
 * Icons for the variants in the playground's narrow-screen variant dropdown. Each draws what sets
 * its variant apart; a page's own demo keeps its sidebar drawing where that already does.
 * 16px, 1.25px strokes, two-tone: surfaces at 30%, secondary lines at 40%.
 */
export const DEMO_ICONS: Partial<Record<ComponentDemoName, ReactNode>> = {
  checkbox: <NavIcon href="/docs/checkbox" />,
  // A checked row over an unchecked one.
  "checkbox-group": (
    <Icon>
      <rect x="1.5" y="2" width="5" height="5" rx="1.25" {...FILLED} />
      <path d="m2.75 4.5 1 1 1.5-1.75" />
      <path d="M9 4.5h5.5" />
      <rect x="1.5" y="9" width="5" height="5" rx="1.25" {...FAINT} />
      <path d="M9 11.5h4" {...FAINT} />
    </Icon>
  ),
  // A mixed parent box, its checked child indented beneath it.
  "checkbox-nested": (
    <Icon>
      <rect x="1.5" y="1.5" width="6" height="6" rx="1.5" {...FILLED} />
      <path d="M3.5 4.5h2" />
      <path d="M4.5 9v1.5a1 1 0 0 0 1 1H7" {...FAINT} />
      <rect x="8.5" y="8.5" width="6" height="6" rx="1.5" {...FILLED} />
      <path d="m10 11.5 1 1 2-2.25" />
    </Icon>
  ),
  // The trigger's up-down chevrons on their own.
  // Dropdown Menu's row types: each row's own mark.
  // Rows led by icons.
  "dropdown-menu": <Icon><circle cx="3" cy="4" r="1.25" {...SOLID} /><path d="M6 4h8" /><path d="M6 8h6M6 12h7M2.5 8h1M2.5 12h1" {...FAINT} /></Icon>,
  // A checked row over an unchecked one.
  "dropdown-menu-checkboxes": <Icon><path d="M2 4.5h7" /><path d="m11 4.5 1.25 1.25 2.25-2.5" /><path d="M2 11.5h6" {...FAINT} /></Icon>,
  // The toggle row's bookmark, filled.
  "dropdown-menu-toggles": <Icon><path d="M4 2.5h8v11l-4-3-4 3Z" {...FILLED} /></Icon>,
  // A selected radio over an empty one.
  "dropdown-menu-radio": <Icon><circle cx="3.5" cy="4.5" r="2" /><circle cx="3.5" cy="4.5" r="0.75" {...SOLID} /><path d="M8 4.5h6.5" /><circle cx="3.5" cy="11.5" r="2" {...FAINT} /><path d="M8 11.5h4.5" {...FAINT} /></Icon>,
  // A row confirming its outcome in place.
  "dropdown-menu-actions": <Icon><rect x="1.5" y="4.5" width="13" height="7" rx="2" {...FILLED} /><path d="m4 8 1.25 1.25L7.5 6.75" /><path d="M10 8h2" {...FAINT} /></Icon>,
  // A submenu panel opening beside the menu.
  "dropdown-menu-panels": <Icon><rect x="1.5" y="1.5" width="8" height="9" rx="1.5" {...FAINT} /><rect x="6.5" y="5.5" width="8" height="9" rx="1.5" {...FILLED} /><path d="M9 9h3" /><path d="M9 11.5h2" {...FAINT} /></Icon>,
  select: (
    <Icon>
      <path d="M5 6l3-3 3 3M5 10l3 3 3-3" />
    </Icon>
  ),
  // Rows shortening down the list, beside a descending arrow.
  "select-sort": (
    <Icon>
      <path d="M2 4h6" />
      <path d="M2 8h4.5M2 12h3" {...FAINT} />
      <path d="M12 3v10M9.75 10.75 12 13l2.25-2.25" />
    </Icon>
  ),
  "select-filter": (
    <Icon>
      <path d="M2 3h12l-4.5 5.25v4.25l-3 1.5V8.25Z" {...FILLED} />
    </Icon>
  ),
  // Each thumb on its own rail, the filled part shaded deeper: the Thumb setting's old tabs.
  slider: (
    <Icon wide>
      <rect x="1.5" y="3" width="29" height="10" rx="2.5" {...TONE} />
      <rect x="1.5" y="3" width="17.5" height="10" rx="2.5" {...TONE} />
      <path d="M16 5.5v5" />
    </Icon>
  ),
  "slider-circle": (
    <Icon wide>
      <rect x="1.5" y="4" width="29" height="8" rx="4" {...TONE} />
      <rect x="1.5" y="4" width="18.5" height="8" rx="4" {...TONE} />
      <circle cx="16" cy="8" r="2.5" {...SOLID} />
    </Icon>
  ),
  "slider-knob": (
    <Icon wide>
      <path d="M1.5 8h29" {...FAINT} />
      <path d="M1.5 8H17" />
      <circle cx="18" cy="8" r="2.25" {...SOLID} />
    </Icon>
  ),
  // The Shape setting's old tabs: a bar part-filled, and a ring part-drawn (centred on the wide
  // grid, so both rows' labels line up).
  progress: (
    <Icon wide>
      <rect x="1.5" y="6" width="29" height="4" rx="2" {...TONE} />
      <rect x="1.5" y="6" width="18" height="4" rx="2" {...SOLID} />
    </Icon>
  ),
  "progress-circle": (
    <Icon wide>
      <g transform="translate(8 0)">
        <circle cx="8" cy="8" r="6" strokeWidth={2} {...FAINT} />
        <path d="M8 2a6 6 0 1 1-3.53 10.85" strokeWidth={2} />
      </g>
    </Icon>
  ),
  skeleton: <NavIcon href="/docs/skeleton" />,
  "skeleton-text": (
    <Icon>
      <rect x="1.5" y="3" width="13" height="1.75" rx="0.875" {...TONE} />
      <rect x="1.5" y="7.125" width="13" height="1.75" rx="0.875" {...TONE} />
      <rect x="1.5" y="11.25" width="8" height="1.75" rx="0.875" {...TONE} />
    </Icon>
  ),
  // A placeholder taking the shape of the control it covers.
  "skeleton-wrap": (
    <Icon>
      <rect x="1.5" y="4.5" width="13" height="7" rx="2" {...FAINT} />
      <rect x="3.5" y="6.5" width="9" height="3" rx="1" {...TONE} />
    </Icon>
  ),
  // A placeholder sitting in a line of text.
  "skeleton-inline": (
    <Icon>
      <path d="M1.5 4.5h13M1.5 11.5h7" {...FAINT} />
      <path d="M1.5 8h3M12.5 8h2" />
      <rect x="6" y="7" width="5" height="2" rx="1" {...TONE} />
    </Icon>
  ),
};
