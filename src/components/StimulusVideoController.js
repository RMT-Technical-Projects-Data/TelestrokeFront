import React, { useState } from "react";
import Button from "./Button";

const StimulusVideoController = ({ updateSetting, isPaused, setIsPaused }) => {
  const [videoSpeed, setVideoSpeed] = useState(2);
  const [stimulusType, setStimulusType] = useState("");
  const [shape, setShape] = useState("");

  const handleSpeedChange = (event) => {
    const value = event.target.value;
    setVideoSpeed(value);
    let speedLabel = "slow";
    if (value > 70) speedLabel = "high";
    else if (value > 40) speedLabel = "medium";
    updateSetting("speed", speedLabel);
  };

  const getSpeedLabel = (value) => {
    if (value > 70) return "high";
    else if (value > 40) return "medium";
    return "slow";
  };

  const handlePlayPause = () => {
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);
    updateSetting("stop", newPausedState);
  };

  return (
    <div className="flex flex-col gap-2 items-left">
      <p className="font-bold text-lg">Stimulus Type</p>
      <select
        value={stimulusType}
        onChange={(e) => {
          const value = e.target.value;
          setStimulusType(value);
          updateSetting("stimulus_type", value);
        }}
        className="w-full max-w-full p-2 border border-gray-300 rounded-md"
      >
        <option value="" disabled>Select Type</option>
        <option value="3">Horizontal</option>
        <option value="2">Vertical</option>
        <option value="1">H-Shape</option>
      </select>
      
      <p className="font-bold text-lg">Shape</p>
      <select
        value={shape}
        onChange={(e) => {
          const value = e.target.value;
          setShape(value);
          updateSetting("shape", value);
        }}
        className="w-full max-w-full p-2 border border-gray-300 rounded-md"
      >
        <option value="" disabled>Select Shape</option>
        <option value="Circle">Circle</option>
        <option value="Square">Square</option>
        <option value="Star">Star</option>
      </select>
      
     <div className="flex items-center justify-between border border-gray-400 p-4 rounded-md w-full max-w-full overflow-x-hidden">

        <Button onClick={handlePlayPause} isPlaying={isPaused}>
          <img
            src={isPaused ? "https://img.icons8.com/ios-glyphs/50/FFFFFF/play.png" : "https://img.icons8.com/ios-glyphs/50/FFFFFF/pause.png"}
            width={25}
            height={25}
            alt={isPaused ? "Pause" : "Play"}
          />
        </Button>

        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={videoSpeed}
            className="w-full max-w-[120px] slider"
            onChange={handleSpeedChange}
          />
          <label className="w-24 text-lg">{getSpeedLabel(videoSpeed)}</label>
        </div>
      </div>
    </div>
  );
};

export default StimulusVideoController;