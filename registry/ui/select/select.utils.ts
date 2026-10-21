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

export function focusPanelOption(
  list: HTMLElement | null,
  direction: "next" | "previous" | "active",
) {
  if (!list) return;

  const options = Array.from(list.querySelectorAll<HTMLElement>('[role="option"]')).filter(
    (option) =>
      !option.hidden &&
      option.getAttribute("aria-disabled") !== "true" &&
      !(option instanceof HTMLButtonElement && option.disabled),
  );
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
