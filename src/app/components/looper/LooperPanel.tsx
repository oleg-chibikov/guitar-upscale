import { LooperButton } from "./LooperButton";

export const LooperPanel: React.FC = () => {
  return (
    <div className="flex justify-between">
      {[...Array(4)].map((_, index) => (
        <div key={index}>
          <LooperButton />
        </div>
      ))}
    </div>
  );
};
