"use client";
import { IconButtonWrapper } from "@/app/components/uiFramework/IconButton";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import CloudDownload from "@mui/icons-material/CloudDownload";
import dynamic from "next/dynamic";
import React, { Fragment, useState } from "react";

const SongsterrImportDialog = dynamic(
  async () =>
    (await import("@/app/components/settings/buttons/SongsterrImportDialog"))
      .SongsterrImportDialog,
);

export const SongsterrImportButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const scaleDetectorAvailable = useSettingsSelector(
    (s) => s.scaleDetectorAvailable,
  );

  return (
    <Fragment>
      <IconButtonWrapper
        // the scale detector picks the scale each song goes under
        disabled={scaleDetectorAvailable === undefined}
        icon={<CloudDownload />}
        onPress={() => setIsOpen(true)}
        tooltip="Add a song from Songsterr"
      />
      {isOpen && (
        <SongsterrImportDialog
          isOpen={isOpen}
          handleCloseDialog={() => setIsOpen(false)}
        />
      )}
    </Fragment>
  );
};
