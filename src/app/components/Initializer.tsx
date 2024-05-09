"use client";
import { Theme } from "@/app/data/theme";
import { Button } from "@mui/material";
import { useEffect, useState } from "react";
import ReactGA from "react-ga4";
import { useDispatch, useSelector } from "react-redux";
import { acknowldegeSubscriptionOnBackend } from "../apiClient";
import { Note } from "../data/notes";
import {
  loadMetronome,
  playMetronomeBeat,
} from "../engine/sound/metronomeProvider";
import { loadInstrument } from "../engine/sound/soundHelper";
import { playNote } from "../engine/sound/soundProvider";
import {
  chordInstrumentValue,
  init,
  instrumentValue,
  reverbStrengthValue,
} from "../store/settingsSlice";
import { selectUi } from "../store/uiSlice";

export const Initializer: React.FC = () => {
  const { theme } = useSelector(selectUi);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(init());
  }, [dispatch]);

  useEffect(() => {
    const remove = () => {
      document.body.removeEventListener("scroll", handleFirstInteraction);
      document.body.removeEventListener("keydown", handleFirstInteraction);
      document.body.removeEventListener("click", handleFirstInteraction);
      document.body.removeEventListener("touchstart", handleFirstInteraction);
    };

    const handleFirstInteraction = async () => {
      remove();
      console.log("Preloading sounds...");
      // first click anywhere loads instruments
      await Promise.all([
        loadInstrument(instrumentValue, reverbStrengthValue),
        loadInstrument(chordInstrumentValue, reverbStrengthValue),
        loadMetronome(),
      ]);
      await Promise.all([
        playNote(
          { note: Note.E, octave: 1 },
          0,
          instrumentValue,
          reverbStrengthValue,
          1
        ),
        playNote(
          { note: Note.E, octave: 1 },
          0,
          chordInstrumentValue,
          reverbStrengthValue,
          1
        ),
        playMetronomeBeat(false, 0),
      ]);
      console.log("Loaded sounds");
    };

    document.body.addEventListener("scroll", handleFirstInteraction);
    document.body.addEventListener("keydown", handleFirstInteraction);
    document.body.addEventListener("click", handleFirstInteraction);
    document.body.addEventListener("touchstart", handleFirstInteraction);

    return () => {
      remove();
    };
  }, []);

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

  const listPurchases = async (service: DigitalGoodsService) => {
    const existingPurchases = await service.listPurchases();
    for (const p of existingPurchases) {
      // await verifyOrAcknowledgePurchaseOnBackend(p.purchaseToken, p.itemId);
      // Update the UI with items the user is already entitled to.
      console.log(`Users has entitlement for ${p.itemId}`);
    }
    setValue(
      existingPurchases.map((x) => x.itemId + "..." + x.purchaseToken).join(" ")
    );
    setTextBoxTokenValue(existingPurchases[0].purchaseToken);
  };

  async function makePurchase(service: DigitalGoodsService, sku: string) {
    // Define the preferred payment method and item ID
    const paymentMethods: PaymentMethodData[] = [
      {
        supportedMethods: "https://play.google.com/billing",
        data: {
          sku: sku,
        },
      },
    ];

    // The "total" member of the paymentDetails is required by the Payment
    // Request API, but is not used when using Google Play Billing. We can
    // set it up with bogus details.
    const paymentDetails = {
      total: {
        label: `Dummy`,
        amount: { currency: `USD`, value: `0` },
      },
    };

    const request = new PaymentRequest(paymentMethods, paymentDetails);
    try {
      const paymentResponse = await request.show();
      const { purchaseToken } = paymentResponse.details;

      // Call backend to validate and acknowledge the purchase.
      const isAcknowledged = true; // await acknowledgePurchaseOnBackend(purchaseToken, sku);

      if (isAcknowledged) {
        // Optional: consume the purchase, allowing the user to purchase
        // the same item again.
        service.consume(purchaseToken);

        // Optional: tell the PaymentRequest API the validation was
        // successful. The user-agent may show a "payment successful"
        // message to the user.
        const paymentComplete = await paymentResponse.complete("success");
        setValue("Success");
      } else {
        // Optional: tell the PaymentRequest API the validation failed.
        // The user agent may show a message to the user.
        const paymentComplete = await paymentResponse.complete("fail");
        setValue("Cancelled");
      }
    } catch (e) {
      // The purchase failed, and we can handle the failure here.
      // AbortError usually means a user cancellation
      setValue("Aborted " + e);
    }
  }

  const [textBoxValue, setTextBoxValue] = useState("guitar_upscale.composer");
  const [textBoxTokenValue, setTextBoxTokenValue] = useState(
    "hlmmlnmfgapmkjbefcffpbok.AO-J1OwOdgtrZe-ebXU3T-0C7oEAxoTi-QAg7zCIiTLrx4JrmLvPtAbBTKFOf0rQJGTB_7IpwjEpZtm2E5cfUfZlKF4211ndm8cke0IjyIemyBzx3-vHdxU"
  );
  const [value, setValue] = useState("the result will be here");

  const ack = async () => {
    await acknowldegeSubscriptionOnBackend({
      itemId: value,
      purchaseToken: textBoxTokenValue,
    });
  };

  const list = async () => {
    // TODO: IT'S FOR TESTING
    if ("getDigitalGoodsService" in window) {
      const getDigitalGoodsService = window.getDigitalGoodsService;
      // Digital Goods API is supported!
      let service: DigitalGoodsService;
      try {
        service = await getDigitalGoodsService(
          "https://play.google.com/billing"
        );
        // Google Play Billing is supported!
      } catch (error) {
        // Google Play Billing is not available. Use another payment flow.
        setValue("Cannot get Billing service");
        return;
      }
      try {
        await listPurchases(service);
      } catch (ex: any) {
        setValue("Cannot get " + textBoxValue + " " + ex);
        return;
      }
    }
  };

  const getDetailsOnClick = async () => {
    // TODO: IT'S FOR TESTING
    if ("getDigitalGoodsService" in window) {
      const getDigitalGoodsService = window.getDigitalGoodsService;
      // Digital Goods API is supported!
      let service: DigitalGoodsService;
      try {
        service = await getDigitalGoodsService(
          "https://play.google.com/billing"
        );
        // Google Play Billing is supported!
      } catch (error) {
        // Google Play Billing is not available. Use another payment flow.
        setValue("Cannot get Billing service");
        return;
      }
      try {
        await listPurchases(service);
        const details = await service.getDetails([textBoxValue]);
        setValue(JSON.stringify(details));
        for (const item of details) {
          // Format the price according to the user locale.
          const localizedPrice = new Intl.NumberFormat(navigator.language, {
            style: "currency",
            currency: item.price.currency,
          }).format(parseFloat(item.price.value));

          // Render the price to the UI.
          setValue(
            [
              item.itemId,
              item.title,
              JSON.stringify(item.price),
              localizedPrice,
              item.description,
            ].join("|")
          );

          await makePurchase(service, "guitar_upscale.composer");
        }
      } catch (ex: any) {
        setValue("Cannot get " + textBoxValue + " " + ex);
        return;
      }
    } else {
      setValue("No digital goods service");
    }
  };

  return (
    <div className="fixed p-10 z-50 top-5 bg-slate-200">
      <input
        type="text"
        value={textBoxValue}
        onChange={(e) => setTextBoxValue(e.target.value)}
      />
      <input
        type="text"
        value={textBoxTokenValue}
        onChange={(e) => setTextBoxTokenValue(e.target.value)}
      />
      <Button onClick={getDetailsOnClick}>Get Details</Button>
      <Button onClick={list}>List</Button>
      <Button onClick={ack}>Ack</Button>
      <span>{value}</span>
    </div>
  );
};
