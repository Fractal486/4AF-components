import { bool, num, valuesFromParams } from "./schema";

describe("valuesFromParams", () => {
  it("falls back for malformed booleans", () => {
    const schema = { enabled: bool(true) };
    expect(valuesFromParams(schema, { enabled: "yes" })).toEqual({ enabled: true });
    expect(valuesFromParams(schema, { enabled: "false" })).toEqual({ enabled: false });
  });

  it("clamps and snaps numeric URL values to the control contract", () => {
    const schema = { amount: num(4, { min: 2, max: 10, step: 2 }) };
    expect(valuesFromParams(schema, { amount: "99" })).toEqual({ amount: 10 });
    expect(valuesFromParams(schema, { amount: "5.2" })).toEqual({ amount: 6 });
  });
});
