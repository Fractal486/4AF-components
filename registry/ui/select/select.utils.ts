import { isValidElement, type ForwardedRef, type ReactNode } from "react";

/**
 * Whether two labels or icons say the same thing.
 *
 * The select's registries hold React nodes, and a node is rebuilt on every render — an
 * `<Icon />` written inline, or children like `Create {query}`, is a fresh object each
 * time even when nothing about it changed. Comparing those by identity meant the effect
 * that registers one saw a change every render, wrote a new Map, re-rendered the provider,
 * and got another fresh node: a render loop that hung the panel outright for anything but
 * a plain string child.
 *
 * So compare what a node *is* rather than which object it is: primitives by value, so a
 * label whose text actually changed still updates; elements by type and key, so the same
 * component written inline twice is the same icon; arrays element-wise, which is what JSX
 * hands over for `Create {query}`. Deliberately shallow — two elements of one type with
 * different props read as equal here, and the registries only need the node for display.
 */
export function isEquivalentNode(a: ReactNode, b: ReactNode): boolean {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((entry, index) => isEquivalentNode(entry, b[index]));
  }
  if (isValidElement(a) && isValidElement(b)) {
    return a.type === b.type && a.key === b.key;
  }
  return false;
}

type BaseUIEvent = { preventBaseUIHandler?: () => void };

export function preventBaseUIHandler(event: BaseUIEvent) {
  event.preventBaseUIHandler?.();
}

export function setForwardedRef<T>(ref: ForwardedRef<T>, value: T | null) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}

function enabledPanelOptions(list: HTMLElement, optionSelector = '[role="option"]') {
  return Array.from(list.querySelectorAll<HTMLElement>(optionSelector)).filter(
    (option) => {
      // Ignore search-hidden rows/groups inside the list. A hidden positioner outside
      // the list can be Base UI's temporary anchor-measurement state.
      const hidden = option.closest("[hidden]");
      return !(hidden && list.contains(hidden)) &&
        !option.hasAttribute("data-disabled") &&
        option.getAttribute("aria-disabled") !== "true" &&
        !(option instanceof HTMLButtonElement && option.disabled);
    },
  );
}

/**
 * An arrow key while focus rests on the panel itself — where Base UI leaves it once the pointer
 * has moved out — resumes from the active row instead of jumping back to the first. Returns
 * whether it moved focus, so the caller can keep Base UI from moving it again.
 */
export function resumeFromActiveRow(list: HTMLElement | null, key: string, optionSelector = '[role="option"]') {
  if (!list || (key !== "ArrowDown" && key !== "ArrowUp")) return false;
  const options = enabledPanelOptions(list, optionSelector);
  const focused = list.ownerDocument.activeElement;
  if (focused && options.some((option) => option.contains(focused))) return false;
  const index = options.findIndex((option) => option.hasAttribute("data-panel-active"));
  if (index < 0) return false;
  const next = Math.min(Math.max(index + (key === "ArrowDown" ? 1 : -1), 0), options.length - 1);
  options[next]?.focus();
  return true;
}

function enabledFooterButtons(footer: HTMLElement | null) {
  return footer ? Array.from(footer.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")) : [];
}

/**
 * ↓ from the last enabled row — focused, or marked active while the panel holds focus —
 * moves to the first enabled footer button. Returns whether it moved focus.
 */
export function focusFooterFromLastRow(list: HTMLElement | null, footer: HTMLElement | null, target: Node) {
  const first = enabledFooterButtons(footer)[0];
  if (!list || !first) return false;
  const options = enabledPanelOptions(list);
  const last = options.at(-1);
  if (!last) return false;
  const onLast = last.contains(target) || (!options.some((option) => option.contains(target)) &&
    !(target instanceof HTMLInputElement) && last.hasAttribute("data-panel-active"));
  if (!onLast) return false;
  first.focus();
  return true;
}

/** ←/→ along the footer row, ↑ back to the last enabled row. Returns whether it handled the key. */
export function moveFromFooter(list: HTMLElement | null, footer: HTMLElement | null, button: HTMLElement, key: string) {
  if (key === "ArrowUp") {
    const last = list ? enabledPanelOptions(list).at(-1) : undefined;
    last?.focus();
    return Boolean(last);
  }
  if (key === "ArrowDown") return true;
  if (key !== "ArrowLeft" && key !== "ArrowRight") return false;
  const buttons = enabledFooterButtons(footer);
  const index = buttons.indexOf(button as HTMLButtonElement);
  const rtl = getComputedStyle(button).direction === "rtl";
  const step = (key === "ArrowRight") !== rtl ? 1 : -1;
  buttons[Math.min(Math.max(index + step, 0), buttons.length - 1)]?.focus();
  return true;
}

export function focusPanelOption(
  list: HTMLElement | null,
  direction: "next" | "previous" | "active",
) {
  if (!list) return;

  const options = enabledPanelOptions(list);
  // `active` reads the mark off the DOM rather than recomputing which row it should be, so
  // the row that paints as active is provably the row that takes focus.
  const option =
    direction === "active"
      ? (options.find((candidate) => candidate.hasAttribute("data-panel-active")) ?? options[0])
      : direction === "next"
        ? options[0]
        : options.at(-1);
  option?.focus();
}

/**
 * The trigger edge that holds still while the trigger's text changes width: its end when the
 * trigger is pushed to the end of its row (a settings row's control, a toolbar's trailing
 * filter), its start otherwise, including a trigger that fills the row. A multi-select's
 * trigger grows and shrinks with each pick while the panel is open; a panel hung from the
 * other edge would slide sideways every time.
 */
export function stillEdge(trigger: HTMLElement): "start" | "end" {
  const row = trigger.parentElement;
  if (!row) return "start";
  const rowStyle = getComputedStyle(row);
  const rowBox = row.getBoundingClientRect();
  const box = trigger.getBoundingClientRect();
  const contentLeft = rowBox.left + parseFloat(rowStyle.borderLeftWidth) + parseFloat(rowStyle.paddingLeft);
  const contentRight = rowBox.right - parseFloat(rowStyle.borderRightWidth) - parseFloat(rowStyle.paddingRight);
  const atLeft = Math.abs(box.left - contentLeft) < 1;
  const atRight = Math.abs(box.right - contentRight) < 1;
  // Flush with both edges, it fills the row; with neither, nothing says which edge holds.
  if (atLeft === atRight) return "start";
  const rtl = getComputedStyle(trigger).direction === "rtl";
  return (rtl ? atLeft : atRight) ? "end" : "start";
}
