"use client";

import { CompositeItem, CompositeRoot, type CompositeMetadata } from "@base-ui/react/internals/composite";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Children, createContext, useContext, useMemo, useState, useSyncExternalStore, type ComponentProps, type ReactElement, type ReactNode } from "react";
import { cn } from "@/registry/lib/cn";
import { DialogFooter } from "@/registry/ui/ui/dialog.shared";

const FooterContext = createContext(false);
export const useAlertDialogFooter = () => useContext(FooterContext);
export function AlertDialogFooterScope({ children }: { children: ReactNode }) {
  return <FooterContext.Provider value={false}>{children}</FooterContext.Provider>;
}
const mobileQuery = "(max-width: 639px)";
function subscribeMobile(change: () => void) {
  const query = window.matchMedia(mobileQuery);
  query.addEventListener("change", change);
  return () => query.removeEventListener("change", change);
}
const mobileSnapshot = () => window.matchMedia(mobileQuery).matches;
const serverSnapshot = () => false;
type ItemMetadata = { disabled: boolean; focusableWhenDisabled: boolean };

/** Register another button or link in the footer's Base UI keyboard navigation. */
export function AlertDialogFooterItem({ children, disabled, focusableWhenDisabled }: {
  children: ReactElement<{ disabled?: boolean; focusableWhenDisabled?: boolean; tabIndex?: number }>;
  disabled?: boolean;
  focusableWhenDisabled?: boolean;
}) {
  const isDisabled = disabled ?? children.props.disabled ?? false;
  const focusable = focusableWhenDisabled ?? children.props.focusableWhenDisabled ?? false;
  const metadata = useMemo(() => ({ disabled: isDisabled, focusableWhenDisabled: focusable }), [isDisabled, focusable]);
  // Add Base UI arrow navigation while retaining ordinary Tab access to every button.
  return <CompositeItem render={children} metadata={metadata} props={[{ tabIndex: children.props.tabIndex ?? 0 }]} />;
}

export function AlertDialogFooter({ children, className, ref, dir, ...props }: ComponentProps<"div">) {
  const mobile = useSyncExternalStore(subscribeMobile, mobileSnapshot, serverSnapshot);
  const [items, setItems] = useState<Map<Node, CompositeMetadata<ItemMetadata>>>(new Map());
  const disabledIndices = useMemo(() => Array.from(items.values())
    .filter(item => item.disabled && !item.focusableWhenDisabled).map(item => item.index), [items]);
  // The mobile design reverses the row visually. Reverse its DOM order too so Base UI's
  // arrow navigation follows the same order without replacing its focus management.
  const controls = Children.toArray(children);
  const ordered = mobile ? controls.reverse() : controls;
  const footer = (
    <FooterContext.Provider value={true}>
      <CompositeRoot<ItemMetadata, Record<string, never>>
        orientation="both" loopFocus enableHomeAndEndKeys
        disabledIndices={disabledIndices} onMapChange={setItems}
        render={<DialogFooter ref={ref} dir={dir} {...props} className={cn("flex-col sm:flex-row", className)} />}
      >
        {ordered}
      </CompositeRoot>
    </FooterContext.Provider>
  );
  return dir === "rtl" || dir === "ltr" ? <DirectionProvider direction={dir}>{footer}</DirectionProvider> : footer;
}
