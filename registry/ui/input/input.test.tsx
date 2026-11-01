import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Field } from "@base-ui/react/field";
import { createRef, useState } from "react";
import { Input } from "./input";

describe("Input", () => {
  it.each([undefined, null, "Helper"])("sizes the outer wrapper while preserving the input when actions change (description=%s)", (description) => {
    const ref = createRef<HTMLInputElement>();
    const props = { ref, description, wrapperClassName: "ml-auto w-48 max-w-full shrink-0", className: "text-right", defaultValue: "Ada", "aria-label": "Name" };
    const { container, rerender } = render(<Input {...props} />);
    const input = screen.getByRole("textbox");
    input.focus();
    expect(container.firstElementChild).toHaveClass("ml-auto", "w-48", "max-w-full", "shrink-0");
    expect(container.firstElementChild).not.toHaveClass("w-full");
    rerender(<Input {...props} endAction={<button>Clear</button>} />);
    expect(ref.current).toBe(input);
    expect(input).toHaveFocus();
    expect(input).toHaveValue("Ada");
    expect(input).toHaveClass("text-right");
    expect(input).not.toHaveClass("w-48");
  });

  it("mutes only the empty file message and restores it when the selection is cleared", async () => {
    const user = userEvent.setup();
    render(<Input type="file" aria-label="Attachment" />);
    const input = screen.getByLabelText("Attachment");
    expect(input).toHaveAttribute("data-file-empty");
    await user.upload(input, new File(["note"], "note.txt", { type: "text/plain" }));
    expect(input).not.toHaveAttribute("data-file-empty");
    await user.upload(input, []);
    expect(input).toHaveAttribute("data-file-empty");
  });

  it.each([false, true])("follows form reset unless it is canceled (%s)", async (preventReset) => {
    const user = userEvent.setup();
    render(<form onReset={(event) => { if (preventReset) event.preventDefault(); }}>
      <Input type="file" aria-label="Attachment" />
      <button type="reset">Reset</button>
    </form>);
    const input = screen.getByLabelText("Attachment");
    await user.upload(input, new File(["note"], "note.txt", { type: "text/plain" }));
    await user.click(screen.getByRole("button", { name: "Reset" }));
    await waitFor(() => {
      if (preventReset) expect(input).not.toHaveAttribute("data-file-empty");
      else expect(input).toHaveAttribute("data-file-empty");
    });
  });

  it("marks the file input empty again when switching away from file mode and back", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Input type="file" aria-label="Attachment" />);
    await user.upload(screen.getByLabelText("Attachment"), new File(["note"], "note.txt", { type: "text/plain" }));
    rerender(<Input type="text" aria-label="Attachment" />);
    expect(screen.getByLabelText("Attachment")).not.toHaveAttribute("data-file-empty");
    rerender(<Input type="file" aria-label="Attachment" />);
    expect(screen.getByLabelText("Attachment")).toHaveAttribute("data-file-empty");
  });

  it("supports native file selection, accept filters, multiple files, and the input ref", async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLInputElement>();
    const onFiles = vi.fn();
    render(<Input ref={ref} type="file" aria-label="Attachments" accept="image/*" multiple
      description="Choose images." onChange={(event) => onFiles(Array.from(event.currentTarget.files ?? []))} />);
    const first = new File(["first"], "first.png", { type: "image/png" });
    const second = new File(["second"], "second.jpg", { type: "image/jpeg" });
    const rejected = new File(["text"], "notes.txt", { type: "text/plain" });
    const input = screen.getByLabelText("Attachments");
    await user.upload(input, [first, second, rejected]);
    expect(ref.current).toBe(input);
    expect(Array.from(ref.current!.files!)).toEqual([first, second]);
    expect(onFiles).toHaveBeenCalledExactlyOnceWith([first, second]);
    expect(input).toHaveAccessibleDescription("Choose images.");
  });

  it("limits file selection to one by default and respects disabled", async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLInputElement>();
    const onChange = vi.fn();
    const { rerender } = render(<Input ref={ref} type="file" aria-label="Attachment" onChange={onChange} />);
    const first = new File(["first"], "first.txt", { type: "text/plain" });
    const second = new File(["second"], "second.txt", { type: "text/plain" });
    await user.upload(screen.getByLabelText("Attachment"), [first, second]);
    expect(Array.from(ref.current!.files!)).toEqual([first]);
    expect(onChange).toHaveBeenCalledOnce();
    rerender(<Input ref={ref} type="file" aria-label="Attachment" onChange={onChange} disabled />);
    await user.upload(screen.getByLabelText("Attachment"), second);
    expect(Array.from(ref.current!.files!)).toEqual([first]);
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("links its description alongside caller and Base UI field descriptions", () => {
    render(
      <Field.Root>
        <Field.Label>Name</Field.Label>
        <Input description="Use your full name." aria-describedby="name-error" />
        <Field.Description>Visible to your team.</Field.Description>
        <span id="name-error">Name is required.</span>
      </Field.Root>,
    );
    const input = screen.getByRole("textbox", { name: "Name" });
    const ids = input.getAttribute("aria-describedby")!.split(" ");
    expect(ids).toContain("name-error");
    expect(ids).toContain(screen.getByText("Use your full name.").id);
    expect(ids).toContain(screen.getByText("Visible to your team.").id);
  });

  it("keeps its value, ref, and number controls when description content is hidden", () => {
    const ref = createRef<HTMLInputElement>();
    const props = { "aria-label": "Quantity", type: "number", defaultValue: "2", ref };
    const { rerender } = render(<Input {...props} description={<strong>Items to order.</strong>} />);
    const input = screen.getByRole("spinbutton", { name: "Quantity" });
    expect(input).toHaveAccessibleDescription("Items to order.");
    fireEvent.click(screen.getByRole("button", { name: "Increase value" }));
    rerender(<Input {...props} description={null} />);
    expect(ref.current).toBe(input);
    expect(input).toHaveValue(3);
    expect(input).not.toHaveAttribute("aria-describedby");
  });

  it("gives separate inputs unique description IDs", () => {
    render(<><Input aria-label="First" description="First help" /><Input aria-label="Second" description="Second help" /></>);
    expect(screen.getByRole("textbox", { name: "First" })).toHaveAccessibleDescription("First help");
    expect(screen.getByRole("textbox", { name: "Second" })).toHaveAccessibleDescription("Second help");
    expect(screen.getByText("First help").id).not.toBe(screen.getByText("Second help").id);
  });

  it("renders a native input with the library state attributes", () => {
    render(<Input aria-label="Name" placeholder="Your name" />);

    const input = screen.getByRole("textbox", { name: "Name" });
    expect(input).toHaveAttribute("data-slot", "input");
    expect(input).toHaveAttribute("data-variant", "default");
    expect(input).toHaveAttribute("autocomplete", "off");
    expect(input.className).toContain("border-border");
    expect(input.className).not.toContain("ring-ring");
  });

  it("supports the plain variant and native input events", () => {
    const onChange = vi.fn();
    render(<Input aria-label="Search" variant="plain" onChange={onChange} />);

    const input = screen.getByRole("textbox", { name: "Search" });
    expect(input.className).toContain("bg-transparent");
    fireEvent.change(input, { target: { value: "hello" } });
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("uses the shared 34px medium field geometry", () => {
    render(<Input aria-label="Name" />);

    expect(screen.getByRole("textbox", { name: "Name" })).toHaveClass("h-[34px]", "rounded-[8px]");
  });

  it("supports an underline-only variant and a disabled cursor", () => {
    render(<Input aria-label="Title" variant="underline" disabled />);

    const input = screen.getByRole("textbox", { name: "Title" });
    expect(input.className).toContain("border-b");
    expect(input.className).toContain("border-b-border");
    expect(input.className).toContain("cursor-not-allowed");
    expect(input).toBeDisabled();
  });

  it("renders an optional decorative leading icon and steps the text aside", () => {
    render(
      <Input
        aria-label="Search"
        startIcon={<svg data-testid="search-glyph" />}
        placeholder="Search"
      />,
    );

    const input = screen.getByRole("textbox", { name: "Search" });
    expect(input).toHaveAttribute("data-icon-start", "true");
    expect(input.className).toContain("data-[icon-start]:ps-9");

    const icon = screen.getByTestId("search-glyph").parentElement;
    expect(icon).toHaveAttribute("aria-hidden", "true");
    // The glyph must never swallow the click that focuses the field.
    expect(icon?.className).toContain("pointer-events-none");
  });

  it("pulls the leading icon flush on the underline variant", () => {
    render(<Input aria-label="Title" variant="underline" startIcon={<svg data-testid="glyph" />} />);

    const input = screen.getByRole("textbox", { name: "Title" });
    expect(input.className).toContain("data-[icon-start]:ps-6");
    expect(screen.getByTestId("glyph").parentElement?.className).toContain("start-0");
  });

  it("omits the icon slot when no icon is given", () => {
    const { container } = render(<Input aria-label="Name" />);

    expect(container.querySelector("[data-slot=input-icon]")).toBeNull();
    expect(screen.getByRole("textbox", { name: "Name" })).not.toHaveAttribute("data-icon-start");
  });

  it.each([false, true])("keeps focus, value, and ref as a trailing action appears and disappears (controlled=%s)", async (controlled) => {
    const user = userEvent.setup();
    const ref = createRef<HTMLInputElement>();
    function ClearableInput() {
      const [value, setValue] = useState("");
      return <Input aria-label="Search" ref={ref} value={controlled ? value : undefined}
        onValueChange={setValue} endAction={value ? <button type="button">Clear</button> : undefined} />;
    }
    render(<ClearableInput />);
    const input = screen.getByRole("textbox", { name: "Search" });
    await user.type(input, "abc");
    expect(input).toHaveValue("abc");
    expect(input).toHaveFocus();
    expect(ref.current).toBe(input);
    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
    await user.keyboard("{Control>}a{/Control}{Backspace}");
    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
    expect(ref.current).toBe(input);
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
    await user.keyboard("xyz");
    expect(input).toHaveValue("xyz");
  });

  it("pins an interactive trailing action and steps the text aside", async () => {
    const onClear = vi.fn();
    const { container } = render(
      <Input aria-label="Search" endAction={<button type="button" aria-label="Clear" onClick={onClear} />} />,
    );

    const input = screen.getByRole("textbox", { name: "Search" });
    expect(input).toHaveAttribute("data-action-end", "true");
    expect(input.className).toContain("data-[action-end]:pe-[calc(var(--input-action-width,24px)+13px)]");

    const wrapper = container.querySelector("[data-slot=input-wrapper]");
    expect(wrapper).toHaveAttribute("data-action-end", "true");
    expect(wrapper).toHaveClass("group/input");

    const slot = container.querySelector("[data-slot=input-action]");
    expect(slot).not.toHaveAttribute("aria-hidden");
    expect(slot?.className).toContain("end-[5px]");

    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("pulls the trailing action flush on the underline variant", () => {
    const { container } = render(
      <Input aria-label="Title" variant="underline" endAction={<button type="button" aria-label="Clear" />} />,
    );

    expect(screen.getByRole("textbox", { name: "Title" }).className).toContain(
      "data-[action-end]:pe-[calc(var(--input-action-width,24px)+8px)]",
    );
    expect(container.querySelector("[data-slot=input-action]")?.className).toContain("end-0");
  });

  it("pads the text to the measured action width as it changes", () => {
    let width = 24;
    let notify: ResizeObserverCallback = () => {};
    const offsetWidth = vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockImplementation(() => width);
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: ResizeObserverCallback) {
          notify = callback;
        }
        observe() {}
        disconnect() {}
      },
    );

    try {
      const { container } = render(
        <Input aria-label="Coupon" endAction={<button type="button">Apply</button>} />,
      );
      const wrapper = container.querySelector<HTMLElement>("[data-slot=input-wrapper]");
      expect(wrapper?.style.getPropertyValue("--input-action-width")).toBe("24px");

      width = 64;
      notify([], {} as ResizeObserver);
      expect(wrapper?.style.getPropertyValue("--input-action-width")).toBe("64px");
    } finally {
      offsetWidth.mockRestore();
      vi.unstubAllGlobals();
    }
  });

  it("ignores the trailing action on number and file inputs", () => {
    const { container } = render(
      <>
        <Input aria-label="Amount" type="number" endAction={<button type="button" aria-label="Clear" />} />
        <Input aria-label="Upload" type="file" endAction={<button type="button" aria-label="Remove" />} />
      </>,
    );

    expect(container.querySelector("[data-slot=input-action]")).toBeNull();
    expect(screen.queryByRole("button", { name: "Clear" })).toBeNull();
    expect(screen.getByRole("spinbutton", { name: "Amount" })).not.toHaveAttribute("data-action-end");
  });

  it("adds accessible custom steppers for number inputs", () => {
    const onChange = vi.fn();
    render(
      <Input
        aria-label="Quantity"
        type="number"
        defaultValue="2"
        min="0"
        max="5"
        step="1"
        onChange={onChange}
      />,
    );

    const input = screen.getByRole("spinbutton", { name: "Quantity" });
    expect(input).toHaveAttribute("data-number-stepper", "true");
    expect(screen.getByRole("button", { name: "Increase value" })).toHaveClass("rounded-[6px]");
    expect(screen.getByRole("button", { name: "Decrease value" })).toHaveClass("rounded-[6px]");
    expect(screen.getByRole("button", { name: "Increase value" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Decrease value" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Increase value" }));
    expect(input).toHaveValue(3);
    expect(onChange).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: "Decrease value" }));
    expect(input).toHaveValue(2);
  });

  it("composes a leading icon with the number steppers in one wrapper", () => {
    const { container } = render(
      <Input aria-label="Amount" type="number" startIcon={<svg data-testid="glyph" />} />,
    );

    const wrapper = container.querySelector("[data-slot=input-wrapper]");
    expect(wrapper).toHaveAttribute("data-icon-start", "true");
    expect(wrapper).toHaveAttribute("data-number-stepper", "true");
    expect(wrapper).toContainElement(screen.getByTestId("glyph"));
    expect(screen.getByRole("button", { name: "Increase value" })).toBeInTheDocument();
  });
});
