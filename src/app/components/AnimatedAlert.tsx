"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { hideAlert, selectControlPanel } from "../store/controlPanelSlice";

export const AnimatedAlert: React.FC = () => {
  const dispatch = useDispatch();
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const { showAlert, alertMessage } = useSelector(selectControlPanel);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsAnimatingOut(true);
      setTimeout(() => {
        setIsVisible(false);
        dispatch(hideAlert());
      }, 100); // Wait for the animation duration before closing
    }, 3000);

    return () => clearTimeout(timeout);
  }, [dispatch]);

  const handleTransitionEnd = () => {
    if (isAnimatingOut) {
      setIsVisible(false);
      dispatch(hideAlert());
    }
  };

  if (!showAlert) {
    return null;
  }

  return (
    <>
      {isVisible && (
        <div
          onClick={() => setIsAnimatingOut(true)}
          className={`fixed top-3 left-0 right-0 m-auto z-50 flex items-center justify-center w-56 p-4 bg-green-300 opacity-90 ${
            isAnimatingOut ? "animate-slideOut" : "animate-slideIn"
          }`}
          onAnimationEnd={handleTransitionEnd}
        >
          <span className="flex items-center text-base text-center text-gray-800">
            {alertMessage}
          </span>
        </div>
      )}
    </>
  );
};
