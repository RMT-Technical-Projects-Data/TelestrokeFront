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
