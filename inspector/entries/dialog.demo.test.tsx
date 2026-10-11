import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { dialogEntry } from "./dialog";

it("reviews the edited profile and retains choices when returning to earlier phases", async () => {
  const user = userEvent.setup();
  render(dialogEntry.render({ showClose: true, phases: true }));
  await user.click(screen.getByRole("button", { name: "Open dialog" }));

  const name = await screen.findByRole("textbox", { name: "Name" });
  const email = screen.getByRole("textbox", { name: "Email" });
  await user.clear(name);
  await user.type(name, "Sam Rivera");
  await user.clear(email);
  await user.type(email, "sam@example.com");
  await user.click(screen.getByRole("button", { name: "Next" }));

  await user.click(await screen.findByRole("checkbox", { name: "Weekly digest" }));
  await user.click(screen.getByRole("checkbox", { name: "Tips and tutorials" }));
  await user.click(screen.getByRole("button", { name: "Next" }));

  expect(await screen.findByText("Sam Rivera")).toBeVisible();
  expect(screen.getByText("sam@example.com")).toBeVisible();
  expect(screen.getByText("Updates: Product updates, Tips and tutorials.")).toBeVisible();
  expect(screen.queryByText("Alex Morgan")).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Back" }));
  expect(await screen.findByRole("checkbox", { name: "Weekly digest" })).not.toBeChecked();
  expect(screen.getByRole("checkbox", { name: "Tips and tutorials" })).toBeChecked();
  await user.click(screen.getByRole("button", { name: "Back" }));
  expect(await screen.findByRole("textbox", { name: "Name" })).toHaveValue("Sam Rivera");
  expect(screen.getByRole("textbox", { name: "Email" })).toHaveValue("sam@example.com");
});

it("reports empty profile fields and no enabled updates accurately", async () => {
  const user = userEvent.setup();
  render(dialogEntry.render({ showClose: true, phases: true }));
  await user.click(screen.getByRole("button", { name: "Open dialog" }));
  await user.clear(await screen.findByRole("textbox", { name: "Name" }));
  await user.clear(screen.getByRole("textbox", { name: "Email" }));
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.click(await screen.findByRole("checkbox", { name: "Product updates" }));
  await user.click(screen.getByRole("checkbox", { name: "Weekly digest" }));
  await user.click(screen.getByRole("button", { name: "Next" }));

  expect(await screen.findByText("No name entered")).toBeVisible();
  expect(screen.getByText("No email entered")).toBeVisible();
  expect(screen.getByText("No updates enabled.")).toBeVisible();
});
