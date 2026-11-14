import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, vi } from "vitest";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogStep, DialogSteps } from "./dialog";

describe("DialogSteps", () => {
  it("keeps an uncontrolled dialog open when its close is canceled", async () => {
    const user = userEvent.setup();
    render(
      <Dialog defaultOpen onOpenChange={(_, details) => details.cancel()}>
        <DialogContent showClose={false}>
          <DialogClose>Close dialog</DialogClose>
        </DialogContent>
      </Dialog>,
    );

    await user.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("mounts into a custom portal container and accepts backdrop classes", () => {
    const portal = document.createElement("div");
    document.body.append(portal);

    render(
      <Dialog open>
        <DialogContent
          showClose={false}
          portalContainer={portal}
          backdropClassName="custom-dialog-backdrop"
        >
          Portal content
        </DialogContent>
      </Dialog>,
    );

    expect(portal.querySelector('[role="dialog"]')).toBeInTheDocument();
    expect(portal.querySelector(".custom-dialog-backdrop")).toBeInTheDocument();
    expect(screen.getByText("Portal content")).toBeInTheDocument();

    portal.remove();
  });

  it("navigates phases with arrows and clickable dots", async () => {
    const user = userEvent.setup();

    render(
      <Dialog open>
        <DialogSteps labels={["Profile", "Preferences", "Review"]}>
          <DialogStep>Profile phase</DialogStep>
          <DialogStep>Preferences phase</DialogStep>
          <DialogStep>Review phase</DialogStep>
        </DialogSteps>
      </Dialog>,
    );

    expect(screen.getByText("Profile phase")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go to Profile" })).toHaveAttribute("aria-current", "step");
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Go to Profile" })).toHaveAttribute(
      "aria-current",
      "step",
    );

    await user.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Go to Preferences" })).toHaveAttribute(
        "aria-current",
        "step",
      ),
    );
    expect(screen.getByRole("button", { name: "Back" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Go to Review" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Go to Review" })).toHaveAttribute(
        "aria-current",
        "step",
      ),
    );
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go to Review" })).toHaveAttribute(
      "aria-current",
      "step",
    );
  });

  it("reports the direction the phases travelled", async () => {
    const user = userEvent.setup();

    render(
      <Dialog open>
        <DialogSteps data-testid="steps" labels={["Profile", "Review"]}>
          <DialogStep>Profile phase</DialogStep>
          <DialogStep>Review phase</DialogStep>
        </DialogSteps>
      </Dialog>,
    );

    expect(screen.getByTestId("steps")).toHaveAttribute("data-direction", "forward");

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByText("Review phase")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go to Review" })).toHaveAttribute("aria-current", "step");
    expect(screen.getByTestId("steps")).toHaveAttribute("data-direction", "forward");

    await user.click(screen.getByRole("button", { name: "Back" }));
    await waitFor(() =>
      expect(screen.getByTestId("steps")).toHaveAttribute("data-direction", "back"),
    );
  });

  it("blocks forward navigation when the current phase is invalid", async () => {
    const user = userEvent.setup();
    const validateStep = vi.fn(() => false);

    render(
      <Dialog open>
        <DialogSteps labels={["Profile", "Review"]} validateStep={validateStep}>
          <DialogStep>Profile phase</DialogStep>
          <DialogStep>Review phase</DialogStep>
        </DialogSteps>
      </Dialog>,
    );

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText("Profile phase")).toBeInTheDocument();
    expect(validateStep).toHaveBeenCalledWith(0, "forward");
  });

  it("blocks the final Done action when completion is invalid", async () => {
    const user = userEvent.setup();
    const validateStep = vi.fn(() => false);

    render(
      <Dialog defaultOpen>
        <DialogContent showClose={false}>
          <DialogSteps defaultStep={1} labels={["Profile", "Review"]} validateStep={validateStep}>
            <DialogStep>Profile phase</DialogStep>
            <DialogStep>Review phase</DialogStep>
          </DialogSteps>
        </DialogContent>
      </Dialog>,
    );

    await user.click(screen.getByRole("button", { name: "Done" }));

    expect(screen.getByRole("dialog")).toHaveAttribute("data-open");
    expect(validateStep).toHaveBeenCalledWith(1, "submit");
  });

  it("closes the dialog when the final Done action passes validation", async () => {
    const user = userEvent.setup();
    const validateStep = vi.fn(() => true);
    const onOpenChange = vi.fn();

    render(
      <Dialog defaultOpen onOpenChange={onOpenChange}>
        <DialogContent showClose={false}>
          <DialogSteps validateStep={validateStep}>
            <DialogStep>Review phase</DialogStep>
          </DialogSteps>
        </DialogContent>
      </Dialog>,
    );

    await user.click(screen.getByRole("button", { name: "Done" }));

    expect(validateStep).toHaveBeenCalledWith(0, "submit");
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false, expect.anything());
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});

describe("DialogContent sizing", () => {
  afterEach(() => vi.unstubAllGlobals());

  function mockMeasurements() {
    const observers: { callback: ResizeObserverCallback; target?: Element; disconnect: ReturnType<typeof vi.fn<() => void>> }[] = [];
    vi.stubGlobal("ResizeObserver", class {
      record: typeof observers[number];
      constructor(callback: ResizeObserverCallback) {
        this.record = { callback, disconnect: vi.fn() };
        observers.push(this.record);
      }
      observe(target: Element) { this.record.target = target; }
      unobserve() {}
      disconnect() { this.record.disconnect(); }
    });
    return observers;
  }

  it("measures by default and releases the height when disabled while open", () => {
    const observers = mockMeasurements();
    const content = (autoSize?: boolean) => (
      <Dialog open>
        <DialogContent autoSize={autoSize} style={{ height: "480px", borderWidth: 0 }}>
          <DialogTitle>Preview</DialogTitle>
        </DialogContent>
      </Dialog>
    );
    const { rerender } = render(content());
    const frame = screen.getByRole("dialog");
    const body = frame.querySelector('[data-slot="dialog-content-body"]')!;
    const observer = observers.find((entry) => entry.target === body)!;
    expect(observer).toBeDefined();
    act(() => observer.callback([
      { target: body, borderBoxSize: [{ blockSize: 240, inlineSize: 400 }] } as unknown as ResizeObserverEntry,
    ], {} as ResizeObserver));
    expect(frame.style.height).toBe("240px");

    rerender(content(false));
    expect(observer.disconnect).toHaveBeenCalledOnce();
    expect(frame.style.height).toBe("480px");
    expect(frame).not.toHaveAttribute("autoSize");

    const count = observers.length;
    rerender(content(true));
    const resumed = observers.slice(count).find((entry) => entry.target === body)!;
    act(() => resumed.callback([
      { target: body, borderBoxSize: [{ blockSize: 320, inlineSize: 400 }] } as unknown as ResizeObserverEntry,
    ], {} as ResizeObserver));
    expect(frame.style.height).toBe("320px");
  });

  it("leaves caller sizing untouched and still dismisses with Escape", async () => {
    mockMeasurements();
    const user = userEvent.setup();
    render(
      <Dialog defaultOpen>
        <DialogContent autoSize={false} style={{ height: "480px" }}>
          <DialogTitle>Preview</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    const frame = screen.getByRole("dialog");
    expect(frame.style.height).toBe("480px");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
