import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { vi } from "vitest";
import { Toggle } from "./toggle";

describe("Toggle", () => {
  it("opts into background feedback independently of icon fill", () => {
    const { rerender } = render(<Toggle>Pin</Toggle>);
    const button = screen.getByRole("button");
    expect(button).not.toHaveAttribute("data-fill-background");
    rerender(<Toggle fillBackground fillIcon>Pin</Toggle>);
    fireEvent.click(button);
    expect(button).toHaveAttribute("data-fill-background", "true");
    expect(button).toHaveAttribute("data-pressed");
    expect(button).toHaveClass("data-[pressed]:[&_svg]:fill-current");
    rerender(<Toggle fillBackground>Pin</Toggle>);
    expect(button).toHaveAttribute("data-pressed");
    expect(button).not.toHaveClass("data-[pressed]:[&_svg]:fill-current");
    fireEvent.click(button);
    expect(button).not.toHaveAttribute("data-pressed");
  });

  it("merges state-aware classes with defaults and updates disabled state", () => {
    const className = ({ pressed, disabled }: { pressed: boolean; disabled: boolean }) =>
      `${pressed ? "is-on" : "is-off"} ${disabled ? "unavailable" : "available"} rounded-none`;
    const { rerender } = render(<Toggle className={className}>Pin</Toggle>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("is-off", "available", "inline-flex", "rounded-none");
    fireEvent.click(button);
    expect(button).toHaveClass("is-on");
    rerender(<Toggle className={className} disabled>Pin</Toggle>);
    expect(button).toHaveClass("is-on", "unavailable");
    expect(button).toBeDisabled();
  });

  it("merges element rendering, refs, handlers, and controlled state", () => {
    const ref = createRef<HTMLButtonElement>();
    const childClick = vi.fn();
    const onClick = vi.fn();
    const onPressedChange = vi.fn();
    const { rerender } = render(
      <Toggle ref={ref} pressed={false} onPressedChange={onPressedChange} onClick={onClick}
        render={<button className="custom" onClick={childClick} />}>
        Pin
      </Toggle>,
    );
    const button = screen.getByRole("button");
    expect(ref.current).toBe(button);
    expect(button).toHaveClass("custom", "inline-flex");
    fireEvent.click(button);
    expect(childClick).toHaveBeenCalledOnce();
    expect(onClick).toHaveBeenCalledOnce();
    expect(onPressedChange).toHaveBeenCalledWith(true, expect.anything());
    expect(button).toHaveAttribute("aria-pressed", "false");
    rerender(<Toggle ref={ref} pressed render={<button />}>Pin</Toggle>);
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("supports function rendering with non-native keyboard behavior and cancellation", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <Toggle nativeButton={false}
        render={(props, state) => <span {...props} data-render-pressed={state.pressed} />}>
        Pin
      </Toggle>,
    );
    const button = screen.getByRole("button");
    expect(button.tagName).toBe("SPAN");
    await user.tab();
    await user.keyboard("{Enter}");
    expect(button).toHaveAttribute("data-render-pressed", "true");
    await user.keyboard(" ");
    expect(button).toHaveAttribute("aria-pressed", "false");
    rerender(
      <Toggle nativeButton={false} onPressedChange={(_, details) => details.cancel()}
        render={(props, state) => <span {...props} data-render-pressed={state.pressed} />}>
        Pin
      </Toggle>,
    );
    await user.keyboard("{Enter}");
    expect(button).toHaveAttribute("aria-pressed", "false");
  });
});
