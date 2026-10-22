import { render, screen } from "@testing-library/react";
import { Tooltip, TooltipProvider } from "./tooltip";

describe("Tooltip", () => {
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
