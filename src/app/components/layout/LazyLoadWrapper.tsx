import { RootState } from "@/app/store/store";
import { FC, ReactNode, useEffect, useState } from "react";
import { useSelector } from "react-redux";

interface LazyLoadWrapperProps {
  renderComponent: () => ReactNode;
  selector: (state: RootState) => boolean;
}

export const LazyLoadWrapper: FC<LazyLoadWrapperProps> = ({
  renderComponent,
  selector,
}) => {
  const [opened, setOpened] = useState(false);
  const showComponent = useSelector(selector);

  useEffect(() => {
    if (showComponent) {
      setOpened(true);
    }
  }, [showComponent]);

  if (!opened) {
    return null;
  }

  return renderComponent();
};
