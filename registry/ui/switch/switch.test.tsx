import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { Switch } from "./switch";

describe("Switch", () => {
  it("runs consumer pointer handlers and extends an off thumb toward the center", async () => {
    const onPointerDown = vi.fn();
    const { container } = render(<Switch aria-label="Notifications" onPointerDown={onPointerDown} />);
    const thumb = container.querySelector('[data-slot="switch-thumb"]');

    fireEvent.pointerDown(screen.getByRole("switch", { name: "Notifications" }));

    expect(onPointerDown).toHaveBeenCalledOnce();
    await waitFor(() => {
      expect(thumb).toHaveAttribute("data-pressed", "true");
      expect(container.querySelector('[data-slot="switch-thumb-cap-start"]')).toHaveStyle({
        transform: "none",
      });
      expect(container.querySelector('[data-slot="switch-thumb-cap-end"]')).toHaveStyle({
        transform: "translateX(3.5px)",
      });
      expect(container.querySelector('[data-slot="switch-thumb-middle"]')).toHaveStyle({
        transform: "none",
      });
    });
  });

  it("stretches a little on hover, and lands as a circle after a press until the pointer leaves", async () => {
    const { container } = render(<Switch aria-label="Notifications" />);
    const control = screen.getByRole("switch", { name: "Notifications" });
    const end = () => container.querySelector('[data-slot="switch-thumb-cap-end"]');

    fireEvent.pointerEnter(control, { pointerType: "mouse" });
    await waitFor(() => expect(end()).toHaveStyle({ transform: "translateX(1.5px)" }));

    fireEvent.pointerDown(control, { pointerType: "mouse" });
    fireEvent.pointerUp(control, { pointerType: "mouse" });
    // Still hovered, but the release lets the stretch go so the thumb lands as a circle.
    await waitFor(() => expect(end()).toHaveStyle({ transform: "none" }));

    fireEvent.pointerLeave(control, { pointerType: "mouse" });
    fireEvent.pointerEnter(control, { pointerType: "mouse" });
    await waitFor(() => expect(end()).toHaveStyle({ transform: "translateX(1.5px)" }));
  });

  it("extends a checked thumb toward the center from the other side", async () => {
    const { container } = render(
      <Switch aria-label="Notifications" defaultChecked />,
    );
    const thumb = container.querySelector('[data-slot="switch-thumb"]');

    fireEvent.pointerDown(screen.getByRole("switch", { name: "Notifications" }));

    await waitFor(() => {
      expect(thumb).toHaveAttribute("data-pressed", "true");
      expect(container.querySelector('[data-slot="switch-thumb-cap-start"]')).toHaveStyle({
        transform: "translateX(-3.5px)",
      });
      expect(container.querySelector('[data-slot="switch-thumb-cap-end"]')).toHaveStyle({
        transform: "none",
      });
    });
  });
});
