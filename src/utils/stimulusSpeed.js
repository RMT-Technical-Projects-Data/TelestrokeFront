// Speed labels the exam page sends to the device (and uses to pick the reference CSV).
// The slider runs 0-100: up to 40 is "slow", 41-70 "medium", above 70 "fast".
export const speedLabelFor = (value) => {
  const n = Number(value);
  if (n > 70) return "fast";
  if (n > 40) return "medium";
  return "slow";
};

// How long the slider must rest before its value is sent when no release event arrives
// (keyboard, odd pointer handling). Releasing the thumb sends immediately.
export const SPEED_COMMIT_DELAY_MS = 300;
