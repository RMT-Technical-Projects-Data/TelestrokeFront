import React, { useState } from "react";
import Button from "./Button";

const StimulusVideoController = ({ updateSetting }) => {
  const [isPlaying, setIsPlaying] = useState(false); // State to track play/pause
  const [videoSpeed, setVideoSpeed] = useState(2);

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
    setIsPlaying(!isPlaying);
    updateSetting("stop", !isPlaying);
  };

  return (
    <div className="flex flex-col gap-2 items-left">
      <h1 className="font-bold text-lg">Video Control Panel</h1>
      <p className="font-bold text-lg">Stimulus Type</p>
      <select
        onChange={(e) => {
          const value = e.target.value;
          updateSetting("stimulus_type", value);
        }}
      >
        <option value="2">Infinity</option>
        <option value="1">H-Shape</option>
      </select>

      {/* Rectangle box with Play/Pause button and Slider */}
      <div className="flex items-center justify-between border border-gray-400 p-4 rounded-md" style={{ width: "300px" }}>
        {/* Play/Pause Button */}
        <Button onClick={handlePlayPause} isPlaying={isPlaying}>
          <img
            src={
              isPlaying
                ? "https://img.icons8.com/ios-glyphs/50/FFFFFF/play.png"
                : "https://img.icons8.com/ios-glyphs/50/FFFFFF/pause.png"
            }
            width={25}
            height={25}
            alt={isPlaying ? "Pause" : "Play"}
          />
        </Button>

        {/* Speed Slider */}
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={videoSpeed}
            className="w-28 slider" // Add a class for styling
            onChange={handleSpeedChange}
          />
          <label className="w-24 text-lg">{getSpeedLabel(videoSpeed)}</label>
        </div>
      </div>

      {/* Slider Styling */}
      <style jsx>{`
        .slider {
          -webkit-appearance: none;
          width: 100%;
          height: 8px;
          background: #d3d3d3; /* Background color of the slider */
          border-radius: 5px;
          outline: none;
          opacity: 0.9;
          transition: opacity 0.2s;
        }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px; /* Width of the thumb */
          height: 20px; /* Height of the thumb */
          background: #6200ee; /* Same color as play/pause button */
          border-radius: 50%;
          cursor: pointer;
        }

        .slider::-moz-range-thumb {
          width: 20px; /* Width of the thumb */
          height: 20px; /* Height of the thumb */
          background: #6200ee; /* Same color as play/pause button */
          border-radius: 50%;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default StimulusVideoController;
