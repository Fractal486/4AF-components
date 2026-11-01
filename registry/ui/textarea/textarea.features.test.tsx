import { Field } from "@base-ui/react/field";
import { createEvent, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { Textarea } from "./textarea";

describe("Textarea field integration", () => {
  it("connects the Field label, both descriptions, error, name, and ref", () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Field.Root name="notes" invalid>
      <Field.Label>Notes</Field.Label>
      <Textarea ref={ref} description="More context." aria-describedby="external-help" />
      <Field.Description>Shared help.</Field.Description>
      <Field.Error match>Invalid note.</Field.Error>
      <span id="external-help">External help.</span>
    </Field.Root>);
    const field = screen.getByRole("textbox", { name: "Notes" });
    expect(ref.current).toBe(field);
    expect(field.tagName).toBe("TEXTAREA");
    expect(field).toHaveAttribute("name", "notes");
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field).toHaveAttribute("data-invalid");
    for (const text of ["More context.", "Shared help.", "Invalid note.", "External help."]) {
      expect(field).toHaveAccessibleDescription(expect.stringContaining(text));
    }
  });

  it("inherits disabled and reports changes and validation through Field", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const view = (disabled: boolean) => <Field.Root disabled={disabled} validationMode="onBlur" validate={(value) => value === "bad" ? "Use a different note." : null}>
      <Field.Label>Notes</Field.Label>
      <Textarea onValueChange={onValueChange} />
      <Field.Error />
    </Field.Root>;
    const { rerender } = render(view(true));
    const field = screen.getByRole("textbox", { name: "Notes" });
    expect(field).toBeDisabled();
    rerender(view(false));
    await user.type(field, "bad");
    await user.tab();
    expect(onValueChange).toHaveBeenLastCalledWith("bad", expect.anything());
    await waitFor(() => expect(field).toHaveAttribute("aria-invalid", "true"));
    expect(screen.getByText("Use a different note.")).toBeVisible();
  });

  it("defaults to auto-grow, sanitizes row limits, and restores manual resizing", () => {
    const { rerender } = render(<Textarea aria-label="Notes" minRows={0} maxRows={-3} />);
    const field = screen.getByRole("textbox");
    expect(field).toHaveAttribute("data-autoresize");
    expect(field).toHaveAttribute("rows", "1");
    expect(screen.queryByRole("button", { name: "Resize" })).toBeNull();
    rerender(<Textarea aria-label="Notes" autoResize={false} rows={5} />);
    expect(field).not.toHaveAttribute("data-autoresize");
    expect(field).toHaveAttribute("rows", "5");
    expect(screen.getByRole("button", { name: "Resize" })).toBeVisible();
  });
});

describe("Textarea submit shortcut", () => {
  it.each(["ctrlKey", "metaKey"])("submits with %s+Enter and keeps ordinary Enter", (modifier) => {
    const submit = vi.fn((event) => event.preventDefault());
    render(<form onSubmit={submit}><Textarea aria-label="Notes" submitOnShortcut defaultValue="A note" /></form>);
    const field = screen.getByRole("textbox");
    fireEvent.keyDown(field, { key: "Enter" });
    expect(submit).not.toHaveBeenCalled();
    fireEvent.keyDown(field, { key: "Enter", [modifier]: true });
    expect(submit).toHaveBeenCalledOnce();
  });

  it("respects native validation, caller cancellation, and composition", () => {
    const submit = vi.fn((event) => event.preventDefault());
    const { rerender } = render(<form onSubmit={submit}><Textarea required submitOnShortcut /></form>);
    const field = screen.getByRole("textbox");
    fireEvent.keyDown(field, { key: "Enter", ctrlKey: true });
    expect(submit).not.toHaveBeenCalled();
    fireEvent.change(field, { target: { value: "Note" } });
    fireEvent.keyDown(field, { key: "Enter", ctrlKey: true, isComposing: true });
    fireEvent.keyDown(field, { key: "Enter", ctrlKey: true, keyCode: 229 });
    expect(submit).not.toHaveBeenCalled();
    rerender(<form onSubmit={submit}><Textarea submitOnShortcut onKeyDown={(event) => event.preventDefault()} /></form>);
    fireEvent.keyDown(field, { key: "Enter", ctrlKey: true });
    expect(submit).not.toHaveBeenCalled();
  });

  it("does not intercept the key when disabled by prop or outside a form", () => {
    const { rerender } = render(<Textarea submitOnShortcut />);
    let event = createEvent.keyDown(screen.getByRole("textbox"), { key: "Enter", ctrlKey: true, cancelable: true });
    fireEvent(screen.getByRole("textbox"), event);
    expect(event.defaultPrevented).toBe(false);
    rerender(<form><Textarea /></form>);
    event = createEvent.keyDown(screen.getByRole("textbox"), { key: "Enter", ctrlKey: true, cancelable: true });
    fireEvent(screen.getByRole("textbox"), event);
    expect(event.defaultPrevented).toBe(false);
  });
});
