import { render, screen } from "@testing-library/react";
import { Tooltip, TooltipProvider } from "./tooltip";

describe("Tooltip", () => {
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
