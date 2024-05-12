"use client";
import { useDigitalGoodsService } from "@/app/context/DIgitalGoodsServiceProvider";
import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { Theme } from "@/app/data/theme";
import { useSessionAuth } from "@/app/hooks/useSessionAuth";
import { selectAuth } from "@/app/store/authSlice";
import { selectUi } from "@/app/store/uiSlice";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { useSelector } from "react-redux";
import { OpenAuthModalButton } from "./OpenAuthModalButton";
import { SignedInButton } from "./SignedInButton";

const SubscriptionStatusModal = dynamic(
  async () =>
    (await import("./SubscriptionStatusModal")).SubscriptionStatusModal
);

// https://docs.patreon.com/#oauth
// https://dev.to/mlhassett/working-with-the-patreon-api-now-that-we-know-what-s-going-on-4pco
export const AuthPanel: React.FC = () => {
  const [openModal, setOpenModal] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);
  const { data: session } = useSession();
  const { chordsDisplayMode, theme } = useSelector(selectUi);
  useSessionAuth();

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleOpenModal = () => {
    setOpenModal(true);
    setModalOpened(true); // only set this once to true to enable code splitting for the modal - it won't be loaded until this prop is true
  };

  return (
    <div
      className={`fixed flex flex-col justify-center ${
        chordsDisplayMode === ChordsDisplayMode.Left ? "left-1" : "right-1"
      }
        ${`maxhmd:hmd:p-1 maxhmd:border-2 ${
          theme === Theme.Light
            ? "maxhmd:bg-accented_background-light maxhmd:border-border-light maxhmd:text-foreground-light"
            : "maxhmd:bg-accented_background-dark  maxhmd:border-border-dark maxhmd:text-foreground-dark"
        }`}
         z-20 top-1`}
    >
      {!session?.user ? (
        <OpenAuthModalButton openModal={handleOpenModal} />
      ) : (
        <SignedInButton openModal={handleOpenModal} user={session.user} />
      )}

      {modalOpened && (
        <SubscriptionStatusModal
          openModal={openModal}
          handleCloseModal={handleCloseModal}
        />
      )}
    </div>
  );
};

export default AuthPanel;
