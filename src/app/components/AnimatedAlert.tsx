import React, { useEffect, useState } from "react";

interface AnimatedAlertProps {
  message: string;
  onClose: () => void;
}
export const AnimatedAlert: React.FC<AnimatedAlertProps> = ({
  message,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsAnimatingOut(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose();
      }, 100); // Wait for the animation duration before closing
    }, 3000);

    return () => clearTimeout(timeout);
  }, [onClose]);

  const handleTransitionEnd = () => {
    if (isAnimatingOut) {
      setIsVisible(false);
      onClose();
    }
  };

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
            {message}
          </span>
        </div>
      )}
    </>
  );
};
