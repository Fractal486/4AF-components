import { render } from "@testing-library/react";
import { initialValues } from "../schema";
import { fieldEntry } from "./field";

describe("Field demo", () => {
  it.each(["single", "horizontal", "fieldset"] as const)("renders the %s layout", (layout) => {
    const values = { ...initialValues(fieldEntry.controls), layout, error: "list" as const, status: true };
    expect(() => render(<>{fieldEntry.render(values)}</>)).not.toThrow();
  });
});
