import React from "react";

export const SourcePicker = ({ onSourceChange, selectedSources }) => {
  const allSources = ["GitHub", "Replicate", "HuggingFace", "Reddit"];

  const handleChange = (e) => {
    const value = e.target.value;
    if (e.target.checked) {
      onSourceChange([...selectedSources, value]);
    } else {
      onSourceChange(selectedSources.filter((source) => source !== value));
    }
  };

  return (
    <div className="flex items-center space-x-4 text-sm">
      <span className="text-gray-600 font-medium">Show:</span>
      {allSources.map((source, index) => (
        <label key={index} className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="w-3.5 h-3.5 text-gray-700 rounded border-gray-400 focus:ring-gray-500 focus:ring-1"
            value={source}
            checked={selectedSources.includes(source)}
            onChange={handleChange}
          />
          <span className="ml-1.5 text-gray-600 hover:text-gray-800">
            {source}
          </span>
        </label>
      ))}
    </div>
  );
};
