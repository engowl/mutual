import React, { useState, useEffect, useRef, useCallback } from "react";

const AsciiFlame = () => {
  const flameRef = useRef(null);
  const [frameCount, setFrameCount] = useState(0);
  const [firePixels, setFirePixels] = useState([]);

  const width = 500;
  const height = 30;
  const flameChars = [" ", ".", ":", "*", "o", "O", "#"];

  const updateFire = useCallback(() => {
    setFirePixels((prevPixels) => {
      const newPixels = [...prevPixels];
      for (let x = 0; x < width; x++) {
        newPixels[width * (height - 1) + x] = Math.floor(Math.random() * 7);
      }
      for (let y = 0; y < height - 1; y++) {
        for (let x = 0; x < width; x++) {
          const src = y * width + x;
          const dst = (y + 1) * width + x;
          newPixels[src] = Math.max(
            0,
            newPixels[dst] - Math.floor(Math.random() * 2)
          );
        }
      }
      return newPixels;
    });
  }, [width, height]);

  const renderFire = useCallback(() => {
    if (!flameRef.current) return;

    let output = "";
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const intensity = firePixels[y * width + x];
        output += flameChars[intensity];
      }
      output += "\n";
    }
    flameRef.current.textContent = output;
  }, [firePixels, width, height, flameChars]);

  useEffect(() => {
    setFirePixels(new Array(width * height).fill(0));
  }, [width, height]);

  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => {
      setFrameCount((prevCount) => prevCount + 1);
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [frameCount]);

  useEffect(() => {
    if (frameCount % 10 === 0) {
      updateFire();
    }
  }, [frameCount, updateFire]);

  useEffect(() => {
    renderFire();
  }, [firePixels, renderFire]);

  return (
    <div
      className="absolute bottom-0 w-full flex justify-center items-center m-0"
      style={{ fontFamily: "monospace" }}
    >
      <div
        ref={flameRef}
        style={{ color: "#FF4500", fontSize: "10px", whiteSpace: "pre" }}
      />
    </div>
  );
};

export default AsciiFlame;
