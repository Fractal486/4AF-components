import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { Dialog, DialogClose, DialogContent, DialogStep, DialogSteps } from "./dialog";

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

    expect(screen.getByText("Profile phase")).toBeVisible();
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
    await waitFor(() => expect(screen.getByText("Review phase")).toBeVisible());
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
        <DialogSteps defaultStep={1} labels={["Profile", "Review"]} validateStep={validateStep}>
          <DialogStep>Profile phase</DialogStep>
          <DialogStep>Review phase</DialogStep>
        </DialogSteps>
      </Dialog>,
    );

    await user.click(screen.getByRole("button", { name: "Done" }));

    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
    expect(validateStep).toHaveBeenCalledWith(1, "submit");
  });
});
