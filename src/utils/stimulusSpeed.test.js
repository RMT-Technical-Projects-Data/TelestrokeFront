import { speedLabelFor } from "./stimulusSpeed";

describe("speedLabelFor", () => {
  it("maps the slider ranges to slow / medium / fast", () => {
    expect(speedLabelFor(0)).toBe("slow");
    expect(speedLabelFor(40)).toBe("slow");
    expect(speedLabelFor(41)).toBe("medium");
    expect(speedLabelFor(70)).toBe("medium");
    expect(speedLabelFor(71)).toBe("fast");
    expect(speedLabelFor(100)).toBe("fast");
  });

  it("accepts the string values a range input reports", () => {
    expect(speedLabelFor("55")).toBe("medium");
    expect(speedLabelFor("2")).toBe("slow");
  });
});
