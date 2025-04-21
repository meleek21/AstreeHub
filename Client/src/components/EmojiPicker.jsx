import React, { useEffect, useRef } from "react";
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import '../assets/Css/EmojiPicker.css';

/**
 * Component for emoji selection
 */
const EmojiPicker = ({ onSelect, show, setShow }) => {
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShow(false);
      }
    };

    if (show) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [show, setShow]);

  return (
    <div className="emoji-picker-wrapper">
      <button 
        type="button"
        className="emoji-picker-button"
        onClick={() => setShow(!show)}
        aria-label="Select emoji"
      >
        <lord-icon 
          src="https://cdn.lordicon.com/xlayapaf.json" 
          trigger={show ? "morph-fill" : "morph"}
          colors="primary:{show ? 'var(--primary)' : 'var(--text-secondary)'}"
          style={{ width: "35px", height: "35px" }}
        />
      </button>
      
      {show && (
        <div ref={pickerRef} className="emoji-picker-container">
          <Picker
            data={data}
            onEmojiSelect={(emoji) => {
              onSelect(emoji);
              setShow(false);
            }}
            theme="light"
            previewPosition="none"
            skinTonePosition="none"
            perLine={8}
            navPosition="bottom"
          />
        </div>
      )}
    </div>
  );
};

export default EmojiPicker;