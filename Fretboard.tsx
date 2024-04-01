import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { View, ImageBackground, Dimensions } from "react-native";
import { Picker } from "@react-native-picker/picker";
import tw from "./tailwind";
import {
  FretCount,
  generateNeckRepresentation,
} from "./generateNeckRepresentation";
import { Note, stringTuning } from "./data/notes";
import { scalesMap } from "./data/scales";
import { Fretline } from "./Fretline";

// TODO
// More scales
// Scales by category - classical, expitic, major, minor, japanese, arabic, gypsy. several levels of nesting
// dark/light
// youtube videos for each scale
// playable notes - https://github.com/nabehide/react-native-piano-example
// synthetic examples - play scale using this piano above
// get the formula to avoid hardcoding each string
// check scripts - build-and-deploy-web seems to be broken

const { width, height } = Dimensions.get("window");

const Fretboard: React.FC = () => {
  const [selectedScale, setSelectedScale] = useState<string>(
    scalesMap.keys().next().value
  );
  const [selectedBaseNote, setSelectedBaseNote] = useState<Note>(Note.E);
  useEffect(() => {
    console.log(selectedBaseNote);
    console.log(selectedScale);
  }, [selectedBaseNote, selectedScale]);

  const highResLoaded = useRef(false);

  const [imageSource, setImageSource] = useState(
    require("./assets/guitar_low.png")
  );

  const changeImage = () => {
    if (highResLoaded.current) {
      return;
    }

    highResLoaded.current = true;
    setImageSource(require("./assets/guitar.png")); // Change to your desired image source
  };

  const neck = useMemo(() => {
    const scalePattern = new Set(scalesMap.get(selectedScale));
    return generateNeckRepresentation(
      scalePattern,
      stringTuning,
      selectedBaseNote
    );
  }, [selectedBaseNote, selectedScale, stringTuning]);

  if (!neck) {
    return "Loading...";
  }

  const [scaleFactor, setScaleFactor] = useState(1);

  const recalculateScaleFactor = () => {
    const { width } = Dimensions.get("window");
    const newScaleFactor = width / 1800;
    setScaleFactor(newScaleFactor);
  };

  useLayoutEffect(() => {
    recalculateScaleFactor(); // Initial calculation
    window.addEventListener("resize", recalculateScaleFactor); // Add event listener

    return () => {
      window.removeEventListener("resize", recalculateScaleFactor); // Remove event listener on component unmount
    };
  }, []); // Empty dependency array to ensure effect runs only once

  return (
    <>
      <View style={tw`absolute z-10 flex gap-4 flex-row m-16`}>
        <Picker
          style={tw`text-2xl`}
          selectedValue={selectedScale}
          onValueChange={(scale) => {
            setSelectedScale(scale);
          }}
        >
          {Array.from(scalesMap.entries()).map((scale, index) => (
            <Picker.Item key={index} label={scale[0]} value={scale[0]} />
          ))}
        </Picker>

        <Picker
          style={tw`text-2xl`}
          selectedValue={selectedBaseNote}
          onValueChange={(itemValue) => {
            setSelectedBaseNote(itemValue);
          }}
        >
          {Object.entries(Note)
            .filter(([key]) => isNaN(key as any))
            .map(([key, value]) => (
              <Picker.Item
                key={key}
                label={key + "(" + (value === 0 ? "" : "+") + value + ")"}
                value={value}
              />
            ))}
        </Picker>
      </View>
      <ImageBackground
        style={[
          tw`overflow-hidden w-full mt-34`,
          {
            minWidth: 1800,
            minHeight: 1100,
            transform: [{ scale: scaleFactor }],
            transformOrigin: "top left",
          },
        ]}
        imageStyle={{
          position: "absolute",
          top: -483,
          width: 5504,
          height: 2200,
          transform: [
            { scale: 0.661 }, // Scale the image to fit the Fretboard class
          ],
          transformOrigin: "top left",
        }}
        onLoadEnd={changeImage} // Call the function to change image source when the image is loaded
        source={imageSource}
      >
        <View style={tw`p-5`}>
          <View>
            <View
              style={[
                tw`items-start mt-10`,
                {
                  left: 435,
                },
              ]}
            >
              <Fretline
                isHeader
                elements={Array.from(
                  { length: FretCount + 1 },
                  (_, index) => index
                )}
              />
              <View style={tw`mt-20`}>
                {neck.map((row, rowIndex) => (
                  <Fretline
                    string={rowIndex}
                    key={rowIndex}
                    elements={row.map((x, index) =>
                      x === true ? index : false
                    )}
                  ></Fretline>
                ))}
              </View>
            </View>
          </View>
        </View>
      </ImageBackground>
    </>
  );
};

export default Fretboard;
