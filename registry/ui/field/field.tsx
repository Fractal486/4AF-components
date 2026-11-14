"use client";

import { Field as BaseField } from "@base-ui/react/field";
import { Fieldset as BaseFieldset } from "@base-ui/react/fieldset";
import { CircleCheck, OctagonAlert } from "lucide-react";
import {
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { cn } from "@/registry/lib/cn";
import { composeRefs } from "@/registry/lib/refs";
import {
  fieldContentVariants,
  fieldDescriptionVariants,
  fieldErrorVariants,
  fieldGroupVariants,
  fieldLabelVariants,
  fieldLegendVariants,
  fieldMarkerVariants,
  fieldSetVariants,
  fieldStatusIconVariants,
  fieldStatusVariants,
  fieldVariants,
} from "./field.variants";

/**
 * A labelled form field: Base UI's Field, which ties the label, description, and error to
 * whatever control sits inside it (Input, Textarea, Select, Checkbox, Slider, …) and carries
 * its validity, disabled, and touched state. `FieldSet` and `FieldGroup` gather fields, and
 * set the marker convention for every field inside them.
 *
 * The label marks whether the field must be filled. It reads that from the control itself —
 * its `required`, or `aria-required` on custom controls — so it is declared once, where the
 * browser enforces it. `indicator` picks the convention: mark the required fields with `*`, or
 * the optional ones with "(optional)". Use one per form, marking whichever is the minority.
 */

export type FieldIndicator = "required" | "optional" | "none";

interface MarkerSettings {
  indicator: FieldIndicator;
  optionalText: ReactNode;
}

const MarkerContext = createContext<MarkerSettings>({ indicator: "required", optionalText: "(optional)" });

/** Whether a part sits inside a `Field`; Base UI's field parts throw outside one. */
const InFieldContext = createContext(false);

/** Lets a `FieldDescription` placed directly in a `FieldSet` describe the fieldset. */
const FieldSetDescriptionContext = createContext<((id: string | undefined) => void) | null>(null);

/** The marker settings a part passes down: its own where given, otherwise its container's. */
function useMarkerSettings(indicator: FieldIndicator | undefined, optionalText: ReactNode | undefined) {
  const inherited = useContext(MarkerContext);
  return {
    indicator: indicator ?? inherited.indicator,
    optionalText: optionalText ?? inherited.optionalText,
  };
}

interface MarkerProps {
  /**
   * Which fields the label marks: `required` adds `*` to fields whose control is required,
   * `optional` adds "(optional)" to fields whose control is not, `none` marks neither.
   * Inherited from the nearest `FieldGroup` or `FieldSet`; `required` at the top.
   */
  indicator?: FieldIndicator;
  /** The text `indicator="optional"` adds. Inherited like `indicator`; `"(optional)"` at the top. */
  optionalText?: ReactNode;
}

/** A copy of a part's props without the ones only its Base UI form understands. */
function withoutKeys<T extends object>(props: T, keys: readonly string[]) {
  const copy = { ...props } as Record<string, unknown>;
  for (const key of keys) delete copy[key];
  return copy;
}

/** Classes stay a string or `(state) => string`, as Base UI accepts. */
function withClass<State>(base: string, className: string | ((state: State) => string | undefined) | undefined) {
  return typeof className === "function"
    ? (state: State) => cn(base, className(state))
    : cn(base, className);
}

export interface FieldProps extends ComponentProps<typeof BaseField.Root>, MarkerProps {
  /**
   * `vertical` stacks the label over the control. `horizontal` puts the control first and a
   * `FieldContent` beside it, for a Switch, Checkbox, or Radio with its label and description.
   */
  orientation?: "vertical" | "horizontal";
}

export function Field({ indicator, optionalText, orientation = "vertical", className, ...props }: FieldProps) {
  const markers = useMarkerSettings(indicator, optionalText);
  return (
    <MarkerContext.Provider value={markers}>
      <InFieldContext.Provider value>
        <BaseField.Root
          data-slot="field"
          data-indicator={markers.indicator}
          data-orientation={orientation}
          className={withClass(fieldVariants({ orientation }), className)}
          {...props}
        />
      </InFieldContext.Provider>
    </MarkerContext.Provider>
  );
}

/** The label, description, and error beside the control of a horizontal field. */
export function FieldContent({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="field-content" className={cn(fieldContentVariants(), className)} {...props} />;
}

/** Fields stacked with room between them, sharing a marker convention. */
export function FieldGroup({ indicator, optionalText, className, ...props }: ComponentProps<"div"> & MarkerProps) {
  const markers = useMarkerSettings(indicator, optionalText);
  return (
    <MarkerContext.Provider value={markers}>
      <div data-slot="field-group" className={cn(fieldGroupVariants(), className)} {...props} />
    </MarkerContext.Provider>
  );
}

/**
 * A `<fieldset>` for related fields, such as a checkbox or radio group or a form section,
 * named by its `FieldLegend`. `disabled` disables every field and control inside it.
 */
export function FieldSet({
  indicator,
  optionalText,
  className,
  ...props
}: ComponentProps<typeof BaseFieldset.Root> & MarkerProps) {
  const markers = useMarkerSettings(indicator, optionalText);
  const [descriptionId, setDescriptionId] = useState<string>();
  return (
    <MarkerContext.Provider value={markers}>
      {/* Fields inside are a new scope: their descriptions describe them, not the set. */}
      <InFieldContext.Provider value={false}>
        <FieldSetDescriptionContext.Provider value={setDescriptionId}>
          <BaseFieldset.Root
            data-slot="field-set"
            aria-describedby={descriptionId}
            className={withClass(fieldSetVariants(), className)}
            {...props}
          />
        </FieldSetDescriptionContext.Provider>
      </InFieldContext.Provider>
    </MarkerContext.Provider>
  );
}

export interface FieldLegendProps extends ComponentProps<typeof BaseFieldset.Legend> {
  /** `legend` titles a section; `label` matches a field label, for a group of options. */
  variant?: "legend" | "label";
}

export function FieldLegend({ variant = "legend", className, ...props }: FieldLegendProps) {
  return (
    <BaseFieldset.Legend
      data-slot="field-legend"
      data-variant={variant}
      className={withClass(fieldLegendVariants({ variant }), className)}
      {...props}
    />
  );
}

/** Whether the field's control is required, kept in step with its attributes. */
function useControlRequired(label: HTMLElement | null, override: boolean | undefined) {
  const [detected, setDetected] = useState(false);

  useLayoutEffect(() => {
    if (override !== undefined || !label) return;
    const field = label.closest('[data-slot="field"]');
    if (!field) return;
    const read = () =>
      setDetected(field.querySelector('[required], [aria-required="true"]') !== null);
    read();
    // A control can become required later, or be swapped for another one.
    const observer = new MutationObserver(read);
    observer.observe(field, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["required", "aria-required"],
    });
    return () => observer.disconnect();
  }, [label, override]);

  return override ?? detected;
}

export interface FieldLabelProps extends ComponentProps<typeof BaseField.Label> {
  /**
   * Overrides what the label reads from the control. Detection runs after mount, so a
   * server-rendered page can pass this to draw the marker in its first paint.
   */
  required?: boolean;
  /** Overrides the inherited text `indicator="optional"` adds. */
  optionalText?: ReactNode;
}

/**
 * Outside a `Field` there is no control to read or link, so the label renders as a plain
 * `<label>` in the same style, for a label that wraps its own control.
 */
export function FieldLabel(props: FieldLabelProps) {
  if (useContext(InFieldContext)) return <FieldLabelInField {...props} />;
  const { className, ...rest } = props;
  return (
    <label
      data-slot="field-label"
      className={typeof className === "function" ? fieldLabelVariants() : cn(fieldLabelVariants(), className)}
      {...(withoutKeys(rest, ["required", "optionalText", "render", "nativeLabel"]) as ComponentProps<"label">)}
    />
  );
}

function FieldLabelInField({ required, optionalText, className, children, ref, ...props }: FieldLabelProps) {
  const markers = useMarkerSettings(undefined, optionalText);
  const [element, setElement] = useState<HTMLElement | null>(null);
  const isRequired = useControlRequired(element, required);
  const marker =
    markers.indicator === "required" && isRequired
      ? "required"
      : markers.indicator === "optional" && !isRequired
        ? "optional"
        : null;

  return (
    <BaseField.Label
      ref={composeRefs<HTMLElement>(ref, (node) => setElement(node))}
      data-slot="field-label"
      data-required={isRequired ? "" : undefined}
      className={withClass(fieldLabelVariants(), className)}
      {...props}
    >
      {children}
      {/* The `*` is hidden from assistive technology, which already announces the
          control's `required`; "(optional)" has no attribute to stand in for it, so it is read. */}
      {marker === "required" && (
        <span aria-hidden data-slot="field-marker" className={fieldMarkerVariants({ indicator: "required" })}>
          *
        </span>
      )}
      {/* A real space, so the name reads "Nickname (optional)"; the gap is only visual. */}
      {marker === "optional" && " "}
      {marker === "optional" && (
        <span data-slot="field-marker" className={fieldMarkerVariants({ indicator: "optional" })}>
          {markers.optionalText}
        </span>
      )}
    </BaseField.Label>
  );
}

/**
 * Describes its field's control. Placed directly in a `FieldSet` instead, it describes the
 * fieldset; anywhere else outside a `Field`, it is a paragraph in the same style.
 */
export function FieldDescription(props: ComponentProps<typeof BaseField.Description>) {
  if (useContext(InFieldContext)) return <FieldDescriptionInField {...props} />;
  return <FieldDescriptionOutside {...props} />;
}

function FieldDescriptionInField({ className, ...props }: ComponentProps<typeof BaseField.Description>) {
  return (
    <BaseField.Description
      data-slot="field-description"
      className={withClass(fieldDescriptionVariants(), className)}
      {...props}
    />
  );
}

function FieldDescriptionOutside({ className, id, ...rest }: ComponentProps<typeof BaseField.Description>) {
  const props = withoutKeys(rest, ["render"]);
  const generated = useId();
  const descriptionId = id ?? generated;
  const describe = useContext(FieldSetDescriptionContext);
  useLayoutEffect(() => {
    if (!describe) return;
    describe(descriptionId);
    return () => describe(undefined);
  }, [describe, descriptionId]);
  return (
    <p
      id={descriptionId}
      data-slot="field-description"
      className={typeof className === "function" ? fieldDescriptionVariants() : cn(fieldDescriptionVariants(), className)}
      {...(props as ComponentProps<"p">)}
    />
  );
}

type ErrorEntry = string | { message?: string } | null | undefined;

export interface FieldErrorProps extends ComponentProps<typeof BaseField.Error> {
  /**
   * Errors from a form library or a server. Empty entries and repeats are dropped; one
   * message shows as text, several as a list. Any message shows the error without `match`;
   * set `invalid` on the `Field` too, so the control is marked invalid.
   */
  errors?: readonly ErrorEntry[];
}

/**
 * The error message. Shown while the field is invalid: from the control's own validation
 * (with `match` to pick a validity state), a `validate` function on `Field`, `invalid`, or an
 * `errors` list. Without children it shows the browser's, `validate`'s, or `errors`' message.
 */
export function FieldError({ errors, match, children, className, ...props }: FieldErrorProps) {
  const messages = [
    ...new Set(
      (errors ?? [])
        .map((entry) => (typeof entry === "string" ? entry : entry?.message))
        .filter((message): message is string => Boolean(message)),
    ),
  ];
  const listed =
    messages.length === 1 ? (
      messages[0]
    ) : messages.length > 1 ? (
      <ul className="flex list-disc flex-col gap-0.5 ps-4">
        {messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    ) : undefined;

  return (
    <BaseField.Error
      data-slot="field-error"
      match={match ?? (messages.length > 0 ? true : undefined)}
      className={withClass(fieldErrorVariants(), className)}
      {...props}
    >
      {children ?? listed}
    </BaseField.Error>
  );
}

/**
 * A small mark of the field's validity, for a control's trailing edge (such as Input's
 * `endAction`): a check once an edited field passes, an alert while it fails. It follows the
 * field's `validationMode`, so a check appears on blur or as you type. Decorative: the error
 * text says the same to assistive technology.
 */
export function FieldStatus({ className, ...props }: ComponentProps<"span">) {
  return (
    <span aria-hidden data-slot="field-status" className={cn(fieldStatusVariants(), className)} {...props}>
      <CircleCheck className={fieldStatusIconVariants({ status: "valid" })} />
      {/* The library's error mark, as in Alert and Badge. */}
      <OctagonAlert className={fieldStatusIconVariants({ status: "invalid" })} />
    </span>
  );
}
