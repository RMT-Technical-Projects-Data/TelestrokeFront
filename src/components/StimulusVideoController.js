import React, { useEffect, useRef, useState } from "react";
import Button from "./Button";
import { Play, Pause } from "lucide-react";
import { SPEED_COMMIT_DELAY_MS, speedLabelFor } from "../utils/stimulusSpeed";

const StimulusVideoController = ({ settings, updateSetting, isPaused, setIsPaused, togglePause }) => {
  const [videoSpeed, setVideoSpeed] = useState(2);
  const commitTimer = useRef(null);

  // A range input fires onChange for every 1% step of a drag. Each speed setting is sent to the
  // device as a command (and makes it restart the stimulus), so a drag used to send dozens of
  // commands and the device ended up restarting long after the graph had. Move the thumb live,
  // but send the speed once: when the thumb is released, or after it rests for a moment.
  const commitSpeed = (value) => {
    clearTimeout(commitTimer.current);
    commitTimer.current = null;
    updateSetting("speed", speedLabelFor(value));
  };

  const handleSpeedChange = (event) => {
    const value = Number(event.target.value);
    setVideoSpeed(value);
    clearTimeout(commitTimer.current);
    commitTimer.current = setTimeout(() => commitSpeed(value), SPEED_COMMIT_DELAY_MS);
  };

  const handleSpeedRelease = (event) => commitSpeed(Number(event.currentTarget.value));

  useEffect(() => () => clearTimeout(commitTimer.current), []);

  const getSpeedLabel = speedLabelFor;

  const handlePlayPause = () => {
    togglePause();
    updateSetting("stop", !isPaused);
  };

  return (
    <div className="ts-exam-control-stack">
      <div className="ts-exam-inline-field ts-exam-inline-field-stack">
        <label htmlFor="stimulus-type">Stimulus Type</label>
        <select
          id="stimulus-type"
          value={settings.stimulus_type || ""}
          onChange={(e) => updateSetting("stimulus_type", e.target.value)}
          className="ts-input"
        >
          <option value="" disabled>Select Type</option>
          <option value="3">Horizontal</option>
          <option value="2">Vertical</option>
          <option value="1">H-Shape</option>
        </select>
      </div>

      <div className="ts-exam-inline-field ts-exam-inline-field-stack">
        <label htmlFor="stimulus-shape">Shape</label>
        <select
          id="stimulus-shape"
          value={settings.shape || ""}
          onChange={(e) => updateSetting("shape", e.target.value)}
          className="ts-input"
        >
          <option value="" disabled>Select Shape</option>
          <option value="Circle">Circle</option>
          <option value="Square">Square</option>
          <option value="Star">Star</option>
        </select>
      </div>

      <div className="ts-exam-field-box ts-exam-play-box">
        <Button onClick={handlePlayPause} isPlaying={isPaused}>
          {isPaused ? (
            <Play size={22} color="white" />
          ) : (
            <Pause size={22} color="white" />
          )}
        </Button>
        <div className="ts-exam-speed">
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={videoSpeed}
            className="slider"
            onChange={handleSpeedChange}
            onPointerUp={handleSpeedRelease}
            onKeyUp={handleSpeedRelease}
          />
          <span>{getSpeedLabel(videoSpeed)}</span>
        </div>
      </div>
    </div>
  );
};

export default StimulusVideoController;