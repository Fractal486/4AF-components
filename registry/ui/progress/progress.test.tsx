import { DirectionProvider } from "@base-ui/react/direction-provider";
import { render, screen } from "@testing-library/react";
import { Progress, ProgressLabel, ProgressValue } from "./progress";

describe("Progress", () => {
  it("composes a nested accessible label and a value that follows progress updates", () => {
    function UploadProgress({ value }: { value: number }) {
      return (
        <Progress value={value} locale="en-US" trackClassName="upload-track" indicatorClassName="upload-fill">
          <div>
            <ProgressLabel>Uploading files</ProgressLabel>
            <ProgressValue data-testid="upload-value" />
          </div>
        </Progress>
      );
    }

    const { rerender } = render(<UploadProgress value={25} />);
    const root = screen.getByRole("progressbar", { name: "Uploading files" });
    expect(root).toHaveAttribute("aria-valuenow", "25");
    expect(root).toHaveAttribute("aria-labelledby", screen.getByText("Uploading files").id);
    expect(screen.getByTestId("upload-value")).toHaveTextContent("25%");
    expect(root.querySelectorAll(".upload-track")).toHaveLength(1);
    expect(root.querySelector(".upload-fill")).toHaveStyle({ transform: "translateX(-75%)" });

    rerender(<UploadProgress value={100} />);
    expect(root).toHaveAttribute("aria-valuenow", "100");
    expect(screen.getByTestId("upload-value")).toHaveTextContent("100%");
    expect(screen.getByTestId("upload-value")).toHaveAttribute("data-complete");
    expect(root.querySelector(".upload-fill")).toHaveStyle({ transform: "translateX(0%)" });
  });

  it("passes the normalized value and root formatting to a custom value renderer", () => {
    render(
      <Progress value={250} max={200} locale="en-US" format={{ style: "decimal" }}>
        <ProgressLabel>Files processed</ProgressLabel>
        <ProgressValue>{(formatted, value) => `${formatted} files (${value})`}</ProgressValue>
      </Progress>,
    );

    expect(screen.getByRole("progressbar", { name: "Files processed" })).toHaveAttribute("aria-valuenow", "200");
    expect(screen.getByText("200 files (200)")).toHaveAttribute("data-complete");
  });

  it("normalizes an invalid range without producing a non-finite transform", () => {
    const { container } = render(<Progress value={10} min={10} max={10} />);
    const root = container.querySelector('[role="progressbar"]');
    const indicator = container.querySelector('[role="progressbar"] [style]');

    expect(root).toHaveAttribute("aria-valuemin", "10");
    expect(root).toHaveAttribute("aria-valuemax", "11");
    expect(indicator?.getAttribute("style") ?? "").not.toMatch(/NaN|Infinity/);
  });

  it("reveals the fill from the inline start in RTL", () => {
    const { container } = render(
      <DirectionProvider direction="rtl">
        <Progress value={25} />
      </DirectionProvider>,
    );

    const indicator = container.querySelector('[role="progressbar"] [style]');
    expect(indicator).toHaveStyle({ transform: "translateX(75%)" });
  });
});
