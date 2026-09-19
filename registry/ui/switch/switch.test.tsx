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
        transform: "translateX(3px)",
      });
      expect(container.querySelector('[data-slot="switch-thumb-middle"]')).toHaveStyle({
        transform: "none",
      });
    });
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
        transform: "translateX(-3px)",
      });
      expect(container.querySelector('[data-slot="switch-thumb-cap-end"]')).toHaveStyle({
        transform: "none",
      });
    });
  });
});
