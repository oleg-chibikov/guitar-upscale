"use client";
import { Theme } from "@/app/data/theme";
import { useEffect } from "react";
import ReactGA from "react-ga4";
import { useDispatch, useSelector } from "react-redux";
import { init } from "../store/settingsSlice";
import { selectUi } from "../store/uiSlice";

export const Initializer: React.FC = () => {
  const { theme } = useSelector(selectUi);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(init());
  }, [dispatch]);

  useEffect(() => {
    const mainBg =
      theme === Theme.Light ? "bg-background-light" : "bg-background-dark";
    document.body.classList.add(mainBg);
    return () => document.body.classList.remove(mainBg);
  }, [theme]);

  useEffect(() => {
    // Multiple products (previously known as trackers)
    ReactGA.initialize([
      {
        trackingId: "G-0NYT2JD8C4",
      },
    ]);
    ReactGA.send({
      hitType: "pageview",
      page: "/",
      title: "Main page",
    });
  }, []);

  useEffect(() => {
    // prevent the Google translate bottom popup from appearing on mobile screen
    document.addEventListener(
      "click",
      function (event: any) {
        if (
          event.target.nodeName === "UL" ||
          event.target.nodeName === "LI" ||
          event.target.nodeName === "SPAN"
        ) {
          event.preventDefault();
        }
      },
      true
    );

    if (typeof navigator.serviceWorker !== "undefined") {
      navigator.serviceWorker.register("/sw.js");
    }
  }, []);
  return null;
};
