import { tabbable } from "tabbable";

/** Move focus out of closing inline content without stealing a deliberate focus change. */
export function moveFocusOutside(element: HTMLElement, {
  prefer,
  restoreFromBody = false,
}: {
  /** Prefer related controls (such as the other tags in a group) when any are tabbable. */
  prefer?: (candidate: Element) => boolean;
  /** For retained exits that began with focus inside and lost it when becoming inert. */
  restoreFromBody?: boolean;
} = {}) {
  const doc = element.ownerDocument;
  if (!element.contains(doc.activeElement) && !(restoreFromBody && doc.activeElement === doc.body)) return;
  const all = tabbable(doc.body).filter((node) => !element.contains(node));
  const preferred = prefer ? all.filter(prefer) : [];
  const candidates = preferred.length ? preferred : all;
  const next = candidates.find((node) => element.compareDocumentPosition(node) & element.DOCUMENT_POSITION_FOLLOWING);
  const previous = candidates.findLast((node) => element.compareDocumentPosition(node) & element.DOCUMENT_POSITION_PRECEDING);
  const target = next ?? previous;
  if (target) {
    target.focus({ preventScroll: true });
  } else {
    const oldTabIndex = doc.body.getAttribute("tabindex");
    doc.body.tabIndex = -1;
    doc.body.focus({ preventScroll: true });
    if (oldTabIndex === null) doc.body.removeAttribute("tabindex");
    else doc.body.setAttribute("tabindex", oldTabIndex);
  }
}
