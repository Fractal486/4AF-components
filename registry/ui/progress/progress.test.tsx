import { DirectionProvider } from "@base-ui/react/direction-provider";
import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { Progress, ProgressCircle, ProgressLabel, ProgressValue } from "./progress";

describe("Progress", () => {
  it.each([Progress, ProgressCircle])("keeps indeterminate, progressing and complete semantics synchronized", (Root) => {
    const { rerender } = render(<Root value={null} aria-label="Upload" color="royalblue"><ProgressValue data-testid="value" /></Root>);
    const root = screen.getByRole("progressbar", { name: "Upload" });
    expect(root).toHaveAttribute("data-indeterminate");
    expect(root).not.toHaveAttribute("aria-valuenow");
    expect(screen.getByTestId("value")).toBeEmptyDOMElement();
    rerender(<Root value={50} aria-label="Upload" color="orchid"><ProgressValue data-testid="value" /></Root>);
    expect(root.querySelector<HTMLElement>('[data-slot="progress-indicator"], [data-slot="progress-circle-indicator"]')!.style.color).toBe("orchid");
    expect(root).toHaveAttribute("data-progressing");
    expect(root).not.toHaveAttribute("data-indeterminate");
    expect(root).toHaveAttribute("aria-valuenow", "50");
    expect(screen.getByTestId("value")).toHaveTextContent("50%");
    rerender(<Root value={200} aria-label="Upload" />);
    expect(root).toHaveAttribute("aria-valuenow", "100");
    expect(root).toHaveAttribute("data-complete");
  });

  it("uses segment amounts as the total and announces their labels", () => {
    const segments = [{ value: 20, color: "royalblue", label: "images" }, { value: 30, color: "orchid", label: "documents" }];
    const { container } = render(<Progress value={99} min={10} max={110} locale="en-US" segments={segments} aria-label="Files" />);
    const root = screen.getByRole("progressbar", { name: "Files" });
    expect(root).toHaveAttribute("aria-valuenow", "60");
    expect(root).toHaveAttribute("aria-valuetext", "50% (20 images, 30 documents)");
    const parts = container.querySelectorAll('[data-slot="progress-segment"]');
    expect(parts[0]).toHaveStyle({ clipPath: "inset(0 80% 0 0%)" });
    expect(parts[1]).toHaveStyle({ clipPath: "inset(0 50% 0 20%)" });
    expect(segments.map((part) => part.value)).toEqual([20, 30]);
  });

  it("clips excess segments and ignores invalid amounts without losing accessible accuracy", () => {
    const { container, rerender } = render(<Progress aria-label="Files" locale="en-US" segments={[
      { value: -10, label: "negative" }, { value: NaN, label: "invalid" }, { value: Infinity, label: "infinite" },
      { value: 80, label: "uploaded" }, { value: 40, label: "failed" },
    ]} />);
    const root = screen.getByRole("progressbar");
    expect(root).toHaveAttribute("aria-valuenow", "100");
    expect(root).toHaveAttribute("aria-valuetext", "100% (80 uploaded, 20 failed)");
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
    rerender(<Progress segments={[]} aria-label="Files" />);
    expect(root).toHaveAttribute("aria-valuenow", "0");
    expect(root).not.toHaveAttribute("data-indeterminate");
  });

  it("allows custom accessible text and segment color overrides", () => {
    const { container } = render(<Progress color="var(--ring)" segments={[
      { value: 20, label: "one" }, { value: 20, color: "royalblue" }, { value: 20, color: "var(--primary)" },
    ]} getAriaValueText={() => "Three batches"} aria-label="Files" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "Three batches");
    const parts = container.querySelectorAll<HTMLElement>('[data-slot="progress-segment"]');
    expect(parts[0]!.style.color).toBe("var(--ring)");
    expect(parts[1]!.style.color).toBe("royalblue");
    expect(parts[2]!.style.color).toBe("var(--primary)");
  });

  it("reverses stacked segment geometry and indeterminate travel in RTL", () => {
    const { container, rerender } = render(<DirectionProvider direction="rtl"><Progress segments={[{ value: 25 }, { value: 35 }]} /></DirectionProvider>);
    const parts = container.querySelectorAll('[data-slot="progress-segment"]');
    expect(parts[0]).toHaveStyle({ clipPath: "inset(0 0% 0 75%)" });
    expect(parts[1]).toHaveStyle({ clipPath: "inset(0 25% 0 40%)" });
    rerender(<DirectionProvider direction="rtl"><Progress value={null} /></DirectionProvider>);
    expect(container.querySelector<HTMLElement>('[data-slot="progress-indicator"]')!.style.getPropertyValue("--progress-direction")).toBe("-1");
  });

  it("draws a normalized circle with centered value, native ref and custom colors", () => {
    const ref = createRef<HTMLDivElement>();
    const { container, rerender } = render(<ProgressCircle ref={ref} min={10} max={30} value={20} size="xl" color="var(--success)">
      <ProgressLabel className="sr-only">Upload</ProgressLabel><ProgressValue data-testid="value" />
    </ProgressCircle>);
    expect(ref.current).toBe(screen.getByRole("progressbar", { name: "Upload" }));
    expect(screen.getByTestId("value")).toHaveTextContent("50%");
    const indicator = () => container.querySelector('[data-slot="progress-circle-indicator"]')!;
    expect(indicator()).toHaveAttribute("stroke-dashoffset", "50");
    expect(indicator()).toHaveAttribute("transform", "rotate(-90 12 12)");
    expect(indicator()).toHaveStyle({ color: "var(--success)" });
    rerender(<ProgressCircle value={0} />);
    expect(indicator()).toHaveAttribute("data-empty");
    rerender(<ProgressCircle value={null} />);
    expect(indicator()).toHaveAttribute("stroke-dasharray", "25 75");
    expect(indicator()).not.toHaveAttribute("data-empty");
    expect(container.querySelector('[data-slot="progress-circle-svg"]')).toHaveAttribute("data-indeterminate");
  });

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
