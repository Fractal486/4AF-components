import { render, screen, waitFor } from "@testing-library/react";
import { Activity, Profiler, StrictMode, type ProfilerOnRenderCallback } from "react";
import { SearchSelect, SearchSelectInput, SearchSelectContent, SearchSelectItem, SearchMultiSelectItem } from "./select-search";

const fruit = { value: "apple", label: "Apple" };
const items = [fruit];

function RegisteredIcon({ version = 0, iconKey = "apple", showIcon = true, multiRow = false }) {
  const Item = multiRow ? SearchMultiSelectItem : SearchSelectItem;
  return <SearchSelect items={items} defaultValue={fruit} defaultOpen>
    <SearchSelectInput aria-label="Fruit" />
    <SearchSelectContent>
      <Item value={fruit} data-version={version} icon={showIcon ? <span key={iconKey} data-testid={`icon-${iconKey}`} /> : undefined}>Apple</Item>
    </SearchSelectContent>
  </SearchSelect>;
}

it.each([false, true])("does not add registry commits for equivalent inline icons (multi row=%s)", async multiRow => {
  const phases: string[] = [];
  const onRender: ProfilerOnRenderCallback = (_, phase) => { phases.push(phase); };
  const view = (version: number) => <Profiler id="search" onRender={onRender}><RegisteredIcon version={version} multiRow={multiRow} /></Profiler>;
  const { rerender } = render(view(0));
  await screen.findByRole("option", { name: "Apple" });
  await waitFor(() => expect(screen.getByRole("combobox").parentElement?.querySelector('[data-testid="icon-apple"]')).toBeInTheDocument());
  phases.length = 0;
  rerender(view(1));
  expect(screen.getByRole("option")).toHaveAttribute("data-version", "1");
  expect(phases).toEqual(["update"]);
});

it.each([false, true])("updates keyed icons and removes cleared icons (multi row=%s)", async multiRow => {
  const { rerender } = render(<RegisteredIcon multiRow={multiRow} />);
  const input = await screen.findByRole("combobox");
  await waitFor(() => expect(input.parentElement?.querySelector('[data-testid="icon-apple"]')).toBeInTheDocument());
  rerender(<RegisteredIcon multiRow={multiRow} iconKey="updated" />);
  await waitFor(() => expect(input.parentElement?.querySelector('[data-testid="icon-updated"]')).toBeInTheDocument());
  rerender(<RegisteredIcon multiRow={multiRow} showIcon={false} />);
  await waitFor(() => expect(input.parentElement?.querySelector('[data-testid="icon-updated"]')).toBeNull());
});

it.each([false, true])("restores icon registration after StrictMode and Activity replay (multi row=%s)", async multiRow => {
  const children = <RegisteredIcon multiRow={multiRow} />;
  const view = (mode: "visible" | "hidden") => <StrictMode><Activity mode={mode}>{children}</Activity></StrictMode>;
  const { rerender } = render(view("visible"));
  const expectIcon = () => expect(screen.getByRole("combobox").parentElement?.querySelector('[data-testid="icon-apple"]')).toBeInTheDocument();
  await waitFor(expectIcon);
  rerender(view("hidden"));
  rerender(view("visible"));
  await waitFor(expectIcon);
});
