import React, { useState } from "react";
import Button from "./Button";
import { Play, Pause } from "lucide-react";

const StimulusVideoController = ({ settings, updateSetting, isPaused, setIsPaused, togglePause }) => {
  const [videoSpeed, setVideoSpeed] = useState(2);

  const handleSpeedChange = (event) => {
    const value = event.target.value;
    setVideoSpeed(value);
    let speedLabel = "slow";
    if (value > 70) speedLabel = "fast";
    else if (value > 40) speedLabel = "medium";
    updateSetting("speed", speedLabel);
  };

  const getSpeedLabel = (value) => {
    if (value > 70) return "fast";
    else if (value > 40) return "medium";
    return "slow";
  };

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
          />
          <span>{getSpeedLabel(videoSpeed)}</span>
        </div>
      </div>
    </div>
  );
};

export default StimulusVideoController;