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

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 3000);

    return () => clearTimeout(timeout);
  }, [onClose]);

  const handleAnimationEnd = () => {
    if (!isVisible) {
      onClose();
    }
  };

  return (
    <>
      {isVisible && (
        <div
          className="fixed top-3 left-0 right-0 m-auto z-50 flex items-center justify-center w-56 p-4 bg-green-300 opacity-90 animate-slideIn"
          onAnimationEnd={handleAnimationEnd}
        >
          <div className="flex items-center">
            <span className="text-base text-center text-gray-800">
              {message}
            </span>
            <button
              className="ml-2 bg-transparent border border-gray-800 rounded px-2 py-1 text-sm text-gray-800 hover:bg-gray-800 hover:text-white"
              onClick={() => setIsVisible(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
