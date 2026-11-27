import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CopyLine } from "./copy-line";

it("retains the command and reports the clipboard outcome after each attempt", async () => {
  const user = userEvent.setup();
  const write = vi.spyOn(navigator.clipboard, "writeText")
    .mockRejectedValueOnce(new Error("Permission denied"))
    .mockResolvedValueOnce(undefined);
  render(<CopyLine value="install command" />);
  const button = screen.getByRole("button", { name: "Copy: install command" });

  await user.click(button);
  expect(screen.getByRole("status")).toHaveTextContent("Couldn't copy");
  expect(await screen.findByText("Couldn't copy", { selector: "[data-slot=tooltip-content]" })).toBeVisible();
  await user.click(button);
  expect(write).toHaveBeenCalledWith("install command");
  expect(screen.getByRole("status")).toHaveTextContent("Copied!");
  expect(await screen.findByText("Copied!", { selector: "[data-slot=tooltip-content]" })).toBeVisible();
  expect(button).toHaveTextContent("install command");
});
