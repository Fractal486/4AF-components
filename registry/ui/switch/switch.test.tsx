import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { Switch } from "./switch";

describe("Switch", () => {
  it("runs consumer pointer handlers without losing its press state", async () => {
    const onPointerDown = vi.fn();
    const { container } = render(<Switch aria-label="Notifications" onPointerDown={onPointerDown} />);

    fireEvent.pointerDown(screen.getByRole("switch", { name: "Notifications" }));

    expect(onPointerDown).toHaveBeenCalledOnce();
    await waitFor(() =>
      expect(container.querySelector('[data-slot="switch-thumb"]')).toHaveStyle({
        transform: "scaleX(1.1875)",
      }),
    );
  });
});
