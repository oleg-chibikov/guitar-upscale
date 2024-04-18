import { usePremiumFeatures } from "@/app/context/PremiumFeaturesContext";
import Cancel from "@mui/icons-material/Cancel";
import FiberManualRecord from "@mui/icons-material/FiberManualRecord";
import StopCircle from "@mui/icons-material/StopCircle";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Theme,
  selectControlPanel,
  toggleRecording,
} from "../../../store/controlPanelSlice";
import { IconButton } from "./IconButton";

export const RecordButton: React.FC = (props) => {
  const dispatch = useDispatch();
  const premiumFeatures = usePremiumFeatures();
  const { isRecording, theme } = useSelector(selectControlPanel);
  return (
    <>
      {isRecording && (
        <IconButton
          {...props}
          icon={<Cancel />}
          isActive={true}
          tooltip="Cancel recording"
          activeBg={
            theme === Theme.Light ? "bg-disabled-light" : "bg-disabled-dark"
          }
          onPress={() => dispatch(toggleRecording(false))}
        />
      )}
      <IconButton
        {...props}
        icon={isRecording ? <StopCircle /> : <FiberManualRecord />}
        isActive={isRecording}
        tooltip={isRecording ? "Stop recording and save MIDI" : "Record MIDI"}
        activeBg="bg-red-500"
        onPress={() =>
          dispatch(toggleRecording(premiumFeatures?.midiRecorder === true))
        }
      />
    </>
  );
};
