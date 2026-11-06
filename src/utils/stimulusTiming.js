// Timing of the reference curves the exam graph plots next to the stimulus the device plays.
//
// public/ShapesGraph/Stimulus/<Type>_<shape>_<eye>.csv holds one curve per device video, on that video's
// own 1x timeline and as long as that video (see tools/generate_stimulus_csv.py). The device plays the
// video at slow = 0.5x, medium = 1x, high = 2x, so the graph divides the CSV time by the same factor and
// ends exactly when the video does. Keep SPEED_FACTORS equal to the device's SPEED_FACTORS (stimulus.py).

export const SPEED_FACTORS = { slow: 0.5, medium: 1, fast: 2 };

export const speedFactorFor = (label) => SPEED_FACTORS[label] || SPEED_FACTORS.slow;

const TYPE_PREFIX = { "1": "H", "2": "Vertical", "3": "Horizontal" };

// Right screen plays videos 1-9, left screen videos 10-18 (the device picks them from eye_camera_control).
export const stimulusCsvPath = (stimulusType, shape, eye) => {
  const prefix = TYPE_PREFIX[stimulusType];
  if (!prefix || !shape) return null;
  const side = String(eye).toLowerCase() === "left" ? "left" : "right";
  return `/ShapesGraph/Stimulus/${prefix}_${String(shape).toLowerCase()}_${side}.csv`;
};

// The old curves: one file per type and speed, already timed for that speed. Used only if a new file
// cannot be loaded.
const LEGACY_FILE = {
  "1": "H-Shape/H_shape",
  "2": "Vertical-Shape/Vertical",
  "3": "Horizontal-Shape/Horizontal",
};

export const legacyCsvPath = (stimulusType, speed) => {
  const file = LEGACY_FILE[stimulusType];
  return file ? `/ShapesGraph/${file}_${speed || "slow"}.csv` : null;
};

// ---- Following the device's video ----------------------------------------------------------------
// While a stimulus video is loaded the device sends { type: "stimulus_status", video, seq, time_pos,
// speed, paused, playing, duration } about 4 times a second (relayed by the backend). The graph plots
// the curve at that position, so it stays with the video through late starts, restarts and a player
// that runs slower than asked. Without reports (older device or backend) it falls back to its own clock.

export const STATUS_FRESH_MS = 1500; // a report older than this no longer steers the graph
export const REPORTING_MS = 2000; // the device counts as reporting if anything arrived this recently
export const MATCH_WAIT_MS = 5000; // how long the graph waits for the device to start this video

const SHAPE_INDEX = { circle: 0, square: 1, star: 2 };

// The device's video number for a stimulus: right screen 1-9, left screen 10-18 (as in its video map).
export const expectedVideoNumber = (stimulusType, shape, eye) => {
  const type = Number(stimulusType);
  const index = SHAPE_INDEX[String(shape).toLowerCase()];
  if (!(type >= 1 && type <= 3) || index === undefined) return null;
  const leftOffset = String(eye).toLowerCase() === "left" ? 9 : 0;
  return String((type - 1) * 3 + index + 1 + leftOffset);
};

// Is this report about the stimulus on the graph, playing, and recent enough to steer it?
export const statusMatches = (status, expectedVideo, nowMs) =>
  !!status &&
  status.type === "stimulus_status" &&
  expectedVideo != null &&
  String(status.video) === String(expectedVideo) &&
  status.playing === true &&
  typeof status.time_pos === "number" &&
  nowMs - status.receivedAt <= STATUS_FRESH_MS;

export const deviceIsReporting = (status, nowMs) => !!status && nowMs - status.receivedAt <= REPORTING_MS;

// The device video's position now (1x video seconds), extrapolated from its last report.
export const deviceVideoTime = (status, nowMs) => {
  if (!status || typeof status.time_pos !== "number") return null;
  let position = status.time_pos;
  if (status.playing && !status.paused && typeof status.speed === "number") {
    position += (Math.max(0, nowMs - status.receivedAt) / 1000) * status.speed;
  }
  if (typeof status.duration === "number") position = Math.min(position, status.duration);
  return position;
};
