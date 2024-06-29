import { FC, ReactNode, useEffect, useState } from "react";

interface LazyLoadWrapperProps {
  renderComponent: () => ReactNode;
  isOpen: boolean;
}

export const LazyLoadWrapper: FC<LazyLoadWrapperProps> = ({
  renderComponent,
  isOpen,
}) => {
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setOpened(true);
    }
  }, [isOpen]);

  if (!opened) {
    return null;
  }

  return renderComponent();
};
