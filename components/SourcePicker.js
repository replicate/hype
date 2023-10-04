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
    <div className="flex items-center space-x-4">
      {allSources.map((source, index) => (
        <label key={index} className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="form-checkbox accent-gray-600"
            value={source}
            checked={selectedSources.includes(source)}
            onChange={handleChange}
          />
          <span className="ml-2">{source}</span>
        </label>
      ))}
    </div>
  );
};
