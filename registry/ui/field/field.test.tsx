import { Form } from "@base-ui/react/form";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Checkbox } from "@/registry/ui/checkbox/checkbox";
import { Input } from "@/registry/ui/input/input";
import { Switch } from "@/registry/ui/switch/switch";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldStatus,
} from "./field";

const marker = (container: HTMLElement) => container.querySelector('[data-slot="field-marker"]');

describe("Field", () => {
  it("marks a required control with a hidden asterisk, read from the control", () => {
    const { container } = render(
      <Field>
        <FieldLabel>Email</FieldLabel>
        <Input type="email" required />
      </Field>,
    );
    expect(marker(container)).toHaveTextContent("*");
    expect(marker(container)).toHaveAttribute("aria-hidden");
    expect(screen.getByRole("textbox", { name: "Email" })).toBeRequired();
    expect(container.querySelector('[data-slot="field-label"]')).toHaveAttribute("data-required");
  });

  it("leaves an optional control unmarked by default", () => {
    const { container } = render(
      <Field>
        <FieldLabel>Nickname</FieldLabel>
        <Input />
      </Field>,
    );
    expect(marker(container)).toBeNull();
  });

  it("marks optional controls instead with indicator=\"optional\", read aloud", () => {
    const { container, rerender } = render(
      <Field indicator="optional">
        <FieldLabel>Nickname</FieldLabel>
        <Input />
      </Field>,
    );
    expect(marker(container)).toHaveTextContent("(optional)");
    expect(marker(container)).not.toHaveAttribute("aria-hidden");
    expect(screen.getByRole("textbox", { name: "Nickname (optional)" })).toBeInTheDocument();

    rerender(
      <Field indicator="optional">
        <FieldLabel>Nickname</FieldLabel>
        <Input required />
      </Field>,
    );
    return waitFor(() => expect(marker(container)).toBeNull());
  });

  it("follows a control that becomes required, and honours an explicit override", async () => {
    const { container, rerender } = render(
      <Field>
        <FieldLabel>Email</FieldLabel>
        <Input />
      </Field>,
    );
    expect(marker(container)).toBeNull();
    rerender(
      <Field>
        <FieldLabel>Email</FieldLabel>
        <Input required />
      </Field>,
    );
    await waitFor(() => expect(marker(container)).toHaveTextContent("*"));

    rerender(
      <Field>
        <FieldLabel required={false}>Email</FieldLabel>
        <Input required />
      </Field>,
    );
    expect(marker(container)).toBeNull();
  });

  it("marks nothing with indicator=\"none\"", () => {
    const { container } = render(
      <Field indicator="none">
        <FieldLabel>Email</FieldLabel>
        <Input required />
      </Field>,
    );
    expect(marker(container)).toBeNull();
  });

  it("reads aria-required on custom controls such as Checkbox", () => {
    const { container } = render(
      <Field>
        <FieldLabel>Accept terms</FieldLabel>
        <Checkbox required />
      </Field>,
    );
    expect(marker(container)).toHaveTextContent("*");
  });

  it("describes the control and shows the error while invalid", () => {
    const { rerender } = render(
      <Field>
        <FieldLabel>Email</FieldLabel>
        <Input />
        <FieldDescription>We never share it.</FieldDescription>
        <FieldError>Enter an email address.</FieldError>
      </Field>,
    );
    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input).toHaveAccessibleDescription("We never share it.");
    expect(screen.queryByText("Enter an email address.")).not.toBeInTheDocument();

    rerender(
      <Field invalid>
        <FieldLabel>Email</FieldLabel>
        <Input />
        <FieldDescription>We never share it.</FieldDescription>
        <FieldError match>Enter an email address.</FieldError>
      </Field>,
    );
    expect(screen.getByText("Enter an email address.")).toHaveAttribute("data-slot", "field-error");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("shows the error for a failed required check when its Form is submitted", async () => {
    const user = userEvent.setup();
    render(
      <Form onSubmit={(event) => event.preventDefault()}>
        <Field name="email">
          <FieldLabel>Email</FieldLabel>
          <Input required />
          <FieldError match="valueMissing">Email is required.</FieldError>
        </Field>
        <button type="submit">Send</button>
      </Form>,
    );
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText("Email is required.")).toBeInTheDocument();
  });

  it("disables its label and control together", () => {
    const { container } = render(
      <Field disabled>
        <FieldLabel>Email</FieldLabel>
        <Input />
      </Field>,
    );
    expect(container.querySelector('[data-slot="field"]')).toHaveAttribute("data-disabled");
    expect(screen.getByRole("textbox", { name: "Email" })).toBeDisabled();
  });
});

describe("Field groups and sets", () => {
  it("inherits the marker convention and text from a FieldGroup, overridable per field", () => {
    const { container } = render(
      <FieldGroup indicator="optional" optionalText="(not required)">
        <Field>
          <FieldLabel>Nickname</FieldLabel>
          <Input />
        </Field>
        <Field indicator="none">
          <FieldLabel>Website</FieldLabel>
          <Input />
        </Field>
      </FieldGroup>,
    );
    const markers = container.querySelectorAll('[data-slot="field-marker"]');
    expect(markers).toHaveLength(1);
    expect(markers[0]).toHaveTextContent("(not required)");
    expect(screen.getByRole("textbox", { name: "Nickname (not required)" })).toBeInTheDocument();
  });

  it("names a fieldset by its legend, passes its indicator down, and disables its fields", () => {
    const { container } = render(
      <FieldSet indicator="optional" disabled>
        <FieldLegend>Contact</FieldLegend>
        <Field>
          <FieldLabel>Phone</FieldLabel>
          <Input />
        </Field>
      </FieldSet>,
    );
    expect(screen.getByRole("group", { name: "Contact" })).toHaveAttribute("data-slot", "field-set");
    expect(container.querySelector('[data-slot="field-marker"]')).toHaveTextContent("(optional)");
    expect(screen.getByRole("textbox", { name: "Phone (optional)" })).toBeDisabled();
    expect(container.querySelector('[data-slot="field-legend"]')).toHaveAttribute("data-variant", "legend");
  });
});

describe("Field horizontal", () => {
  it("puts the control beside its content, still labelled and described", () => {
    const { container } = render(
      <Field orientation="horizontal">
        <Switch />
        <FieldContent>
          <FieldLabel>Email updates</FieldLabel>
          <FieldDescription>A weekly summary.</FieldDescription>
        </FieldContent>
      </Field>,
    );
    expect(container.querySelector('[data-slot="field"]')).toHaveAttribute("data-orientation", "horizontal");
    const toggle = screen.getByRole("switch", { name: "Email updates" });
    expect(toggle).toHaveAccessibleDescription("A weekly summary.");
  });
});

describe("FieldError errors", () => {
  it("shows one message as text and several as a deduplicated list", () => {
    const { rerender } = render(
      <Field invalid>
        <FieldLabel>Handle</FieldLabel>
        <Input />
        <FieldError errors={[{ message: "Taken." }, undefined, "Taken."]} />
      </Field>,
    );
    expect(screen.getByText("Taken.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();

    rerender(
      <Field invalid>
        <FieldLabel>Handle</FieldLabel>
        <Input />
        <FieldError errors={["Taken.", { message: "Too short." }, { message: "Taken." }]} />
      </Field>,
    );
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Taken.", "Too short."]);
  });
});

describe("FieldStatus", () => {
  it("is decorative, and its field reports the dirty and valid state it shows", async () => {
    const user = userEvent.setup();
    const { container } = render(
      // jsdom has no `minLength` check, so a `validate` function stands in for it.
      <Field validationMode="onChange" validate={(value) => (String(value ?? "").length < 3 ? "Too short." : null)}>
        <FieldLabel>Code</FieldLabel>
        <Input endAction={<FieldStatus />} />
      </Field>,
    );
    const status = container.querySelector('[data-slot="field-status"]')!;
    expect(status).toHaveAttribute("aria-hidden");
    expect(status.querySelectorAll("svg")).toHaveLength(2);

    const field = container.querySelector('[data-slot="field"]')!;
    await user.type(screen.getByRole("textbox", { name: "Code" }), "ab");
    expect(field).toHaveAttribute("data-invalid");
    await user.type(screen.getByRole("textbox", { name: "Code" }), "c");
    await waitFor(() => expect(field).toHaveAttribute("data-valid"));
    expect(field).toHaveAttribute("data-dirty");
  });
});

describe("Field parts outside a Field", () => {
  it("describes a fieldset with a description placed directly in it", () => {
    render(
      <FieldSet>
        <FieldLegend>Contact</FieldLegend>
        <FieldDescription>How we reach you.</FieldDescription>
        <Field>
          <FieldLabel>Email</FieldLabel>
          <Input />
          <FieldDescription>We only use it to reply.</FieldDescription>
        </Field>
      </FieldSet>,
    );
    expect(screen.getByRole("group", { name: "Contact" })).toHaveAccessibleDescription("How we reach you.");
    // The field's own description still describes its control, not the set.
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAccessibleDescription("We only use it to reply.");
  });

  it("renders a plain description and label anywhere else, without throwing", () => {
    const { container } = render(
      <div>
        <FieldLabel htmlFor="free">Free label</FieldLabel>
        <input id="free" />
        <FieldDescription>Loose text.</FieldDescription>
      </div>,
    );
    expect(container.querySelector('[data-slot="field-label"]')!.tagName).toBe("LABEL");
    expect(screen.getByRole("textbox", { name: "Free label" })).toBeInTheDocument();
    expect(screen.getByText("Loose text.")).toHaveAttribute("data-slot", "field-description");
  });
});
