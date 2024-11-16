import React, { useState, useEffect } from "react";
import "./TypingLoader.css";

const TypingLoader = () => {
  const [typedText, setTypedText] = useState("");
  const [isVisible, setIsVisible] = useState(true);

  const message = "Initializing Map Data...";

  useEffect(() => {
    let typingTimer;

    // Typing effect logic
    const typeMessage = (index) => {
      if (index < message.length) {
        setTypedText((prevText) => prevText + message[index]);
        typingTimer = setTimeout(() => typeMessage(index + 1), 100); // Typing speed
      } else {
        // Fade out after typing completes
        setTimeout(() => setIsVisible(false), 2000); // 2-second pause before fade-out
      }
    };

    typeMessage(0); // Start typing

    return () => clearTimeout(typingTimer); // Cleanup
  }, []);

  return (
    <div className={`typing-loader ${isVisible ? "visible" : "hidden"}`}>
      <h2>{typedText}</h2>
    </div>
  );
};

export default TypingLoader;
