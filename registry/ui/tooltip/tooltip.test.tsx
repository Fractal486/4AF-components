import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ComponentProps } from "react";
import { Tooltip, TooltipProvider } from "./tooltip";

function StatefulTrigger(props: ComponentProps<"button">) {
  const [count, setCount] = useState(0);
  return (
    <button {...props} onClick={(event) => {
      props.onClick?.(event);
      setCount((value) => value + 1);
    }}>
      Pressed {count}
    </button>
  );
}

describe("Tooltip", () => {
  it.each(["", null, undefined])("preserves trigger focus and state when content changes from %j and back", async (empty) => {
    const user = userEvent.setup();
    const { rerender } = render(<Tooltip content={empty}><StatefulTrigger /></Tooltip>);
    const trigger = screen.getByRole("button");
    await user.click(trigger);
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveTextContent("Pressed 1");

    rerender(<Tooltip content="Helpful hint"><StatefulTrigger /></Tooltip>);
    expect(screen.getByRole("button")).toBe(trigger);
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveTextContent("Pressed 1");

    rerender(<Tooltip content={empty}><StatefulTrigger /></Tooltip>);
    expect(screen.getByRole("button")).toBe(trigger);
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveTextContent("Pressed 1");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("does not leave an empty popup when controlled content is removed", async () => {
    const { rerender } = render(<Tooltip content="Helpful hint" open><button>Help</button></Tooltip>);
    const trigger = screen.getByRole("button", { name: "Help" });
    const popup = await screen.findByText("Helpful hint");

    rerender(<Tooltip content="" open><button>Help</button></Tooltip>);
    expect(screen.getByRole("button", { name: "Help" })).toBe(trigger);
    expect(popup).not.toBeInTheDocument();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    expect(trigger).not.toHaveAttribute("aria-describedby");
  });

  it("layers the positioner above modal content and preserves caller classes", async () => {
    render(
      <TooltipProvider>
        <Tooltip content="Save changes" open positionerProps={{ className: "custom-positioner" }}>
          <button>Save</button>
        </Tooltip>
      </TooltipProvider>,
    );

    const popup = await screen.findByText("Save changes");
    expect(popup.parentElement).toHaveClass("z-50", "outline-none", "custom-positioner");
    expect(popup).not.toHaveClass("z-50");
  });

  it("lets Base UI's instant state bypass popup motion", async () => {
    render(
      <TooltipProvider>
        <Tooltip content="Save changes" open>
          <button>Save</button>
        </Tooltip>
      </TooltipProvider>,
    );

    const popup = await screen.findByText("Save changes");
    expect(popup).toHaveClass("data-instant:transition-none");
    expect(popup).toHaveClass("transition-[opacity,scale,translate,filter]");
    expect(popup).not.toHaveClass("transition-none");
  });
});
