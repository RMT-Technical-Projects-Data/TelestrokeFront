import {
  REPORTING_MS,
  STATUS_FRESH_MS,
  deviceIsReporting,
  deviceVideoTime,
  expectedVideoNumber,
  legacyCsvPath,
  speedFactorFor,
  statusMatches,
  stimulusCsvPath,
} from "./stimulusTiming";

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

describe("expectedVideoNumber", () => {
  it("matches the device's video map", () => {
    expect(expectedVideoNumber("1", "Circle", "right")).toBe("1");
    expect(expectedVideoNumber("1", "Star", "right")).toBe("3");
    expect(expectedVideoNumber("2", "Circle", "right")).toBe("4");
    expect(expectedVideoNumber("3", "Star", "right")).toBe("9");
    expect(expectedVideoNumber("1", "Circle", "left")).toBe("10");
    expect(expectedVideoNumber("3", "Star", "Left")).toBe("18");
  });

  it("returns null for an unknown type or shape", () => {
    expect(expectedVideoNumber("", "Circle", "right")).toBeNull();
    expect(expectedVideoNumber("4", "Circle", "right")).toBeNull();
    expect(expectedVideoNumber("1", "", "right")).toBeNull();
  });
});

describe("following the device", () => {
  const status = (over = {}) => ({
    type: "stimulus_status", video: "1", seq: 1, time_pos: 4, speed: 1, paused: false,
    playing: true, duration: 23.46, receivedAt: 1000, ...over,
  });

  it("uses only fresh reports about the stimulus on the graph", () => {
    expect(statusMatches(status(), "1", 1000 + STATUS_FRESH_MS)).toBe(true);
    expect(statusMatches(status(), "1", 1001 + STATUS_FRESH_MS)).toBe(false);
    expect(statusMatches(status({ video: "10" }), "1", 1000)).toBe(false);
    expect(statusMatches(status({ playing: false }), "1", 1000)).toBe(false);
    expect(statusMatches(status({ time_pos: null }), "1", 1000)).toBe(false);
    expect(statusMatches(null, "1", 1000)).toBe(false);
  });

  it("extrapolates the position at the device's real speed", () => {
    expect(deviceVideoTime(status({ speed: 2 }), 1500)).toBeCloseTo(5);
    expect(deviceVideoTime(status({ speed: 0.5 }), 3000)).toBeCloseTo(5);
  });

  it("does not move while paused and never passes the end", () => {
    expect(deviceVideoTime(status({ paused: true }), 9000)).toBe(4);
    expect(deviceVideoTime(status({ time_pos: 23 }), 9000)).toBe(23.46);
  });

  it("knows when the device is reporting at all", () => {
    expect(deviceIsReporting(status(), 1000 + REPORTING_MS)).toBe(true);
    expect(deviceIsReporting(status(), 1001 + REPORTING_MS)).toBe(false);
    expect(deviceIsReporting(null, 0)).toBe(false);
  });
});
