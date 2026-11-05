import { legacyCsvPath, speedFactorFor, stimulusCsvPath } from "./stimulusTiming";

describe("speedFactorFor", () => {
  it("matches the speeds the device plays", () => {
    expect(speedFactorFor("slow")).toBe(0.5);
    expect(speedFactorFor("medium")).toBe(1);
    expect(speedFactorFor("fast")).toBe(2);
  });

  it("falls back to slow for an unknown label", () => {
    expect(speedFactorFor("warp")).toBe(0.5);
    expect(speedFactorFor(undefined)).toBe(0.5);
  });
});

describe("stimulusCsvPath", () => {
  it("builds one path per type, shape and eye", () => {
    expect(stimulusCsvPath("1", "Circle", "right")).toBe("/ShapesGraph/Stimulus/H_circle_right.csv");
    expect(stimulusCsvPath("2", "Square", "left")).toBe("/ShapesGraph/Stimulus/Vertical_square_left.csv");
    expect(stimulusCsvPath("3", "Star", "Left")).toBe("/ShapesGraph/Stimulus/Horizontal_star_left.csv");
  });

  it("defaults unknown or missing eyes to the right screen", () => {
    expect(stimulusCsvPath("1", "Star", undefined)).toBe("/ShapesGraph/Stimulus/H_star_right.csv");
  });

  it("returns null without a known type and a shape", () => {
    expect(stimulusCsvPath("", "Circle", "left")).toBeNull();
    expect(stimulusCsvPath("9", "Circle", "left")).toBeNull();
    expect(stimulusCsvPath("1", "", "left")).toBeNull();
  });
});

describe("legacyCsvPath", () => {
  it("keeps the old per-speed file names", () => {
    expect(legacyCsvPath("1", "fast")).toBe("/ShapesGraph/H-Shape/H_shape_fast.csv");
    expect(legacyCsvPath("3", "medium")).toBe("/ShapesGraph/Horizontal-Shape/Horizontal_medium.csv");
    expect(legacyCsvPath("2", undefined)).toBe("/ShapesGraph/Vertical-Shape/Vertical_slow.csv");
    expect(legacyCsvPath("7", "slow")).toBeNull();
  });
});
