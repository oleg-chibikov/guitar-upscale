import { PianoRollSnapSelector } from "@/app/components/pianoRoll/toolbox/PianoRollSnapSelector";
import { Panel } from "@/app/components/uiFramework/Panel";
import { PIANO_ROLL_TOOLBOX_PANEL_ID } from "@/app/data/elementIds";

export const PianoRollToolboxPanel: React.FC = () => {
  return (
    <Panel id={PIANO_ROLL_TOOLBOX_PANEL_ID}>
      <PianoRollSnapSelector />
    </Panel>
  );
};
