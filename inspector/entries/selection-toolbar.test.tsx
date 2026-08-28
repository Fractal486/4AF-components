import { selectionToolbarEntry } from "./selection-toolbar";

describe("selection toolbar demo", () => {
  it("uses the extended variant without an items control", () => {
    expect(Object.keys(selectionToolbarEntry.controls)).toEqual(["side", "labels", "disabled"]);
    expect(selectionToolbarEntry.controls).not.toHaveProperty("kinds");
  });
});
