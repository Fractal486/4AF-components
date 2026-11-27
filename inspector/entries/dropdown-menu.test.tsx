import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { initialValues } from "../schema";
import { dropdownMenuActionsEntry } from "./dropdown-menu";

it.each([true, false])("reports the clipboard fallback result (%s) for the Copy link row", async (accepted) => {
  const user = userEvent.setup();
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
  const copy = vi.fn(() => accepted);
  Object.defineProperty(document, "execCommand", { configurable: true, value: copy });
  render(dropdownMenuActionsEntry.render(initialValues(dropdownMenuActionsEntry.controls)));

  await user.click(screen.getByRole("button", { name: "Options" }));
  await user.click(await screen.findByRole("menuitem", { name: "Copy link" }));
  expect(copy).toHaveBeenCalledWith("copy");
  expect(await screen.findByText(accepted ? "Link copied" : "Couldn't copy the link")).toBeInTheDocument();
});
