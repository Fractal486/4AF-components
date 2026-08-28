import { checkboxVariants } from "./checkbox.variants";

describe("Checkbox geometry", () => {
  it("uses the fixed compact control geometry", () => {
    expect(checkboxVariants()).toContain("size-4");
    expect(checkboxVariants()).toContain("rounded-[4px]");
  });
});
