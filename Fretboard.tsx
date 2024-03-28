import React, { ReactNode, useEffect, useState } from "react";
import { View, Text, Image, ImageBackground } from "react-native";
import { Picker } from "@react-native-picker/picker";
import tw from "./tailwind";
import {
  FretCount,
  generateNeckRepresentation,
} from "./generateNeckRepresentation";
import { Note, stringTuning } from "./data/notes";
import { scalesMap } from "./data/scales";

// TODO
// More scales
// Scales by category - classical, expitic, major, minor, japanese, arabic, gypsy. several levels of nesting
// mobile screen - not usable
// dark/light
// smaller image for preload to load immediately
// youtube videos for each scale
// playable notes - https://github.com/nabehide/react-native-piano-example
// synthetic examples - play scale using this piano above
// get the formula to avoid hardcoding each string

const calculateTop = (string: number, fret: number) => {
  switch (string) {
    case 0:
      return -(fret * 0.4 * 4);
    case 1:
      return -(fret * 0.3 * 3);
    case 2:
      return -(fret * 0.2 * 2);
    case 3:
      return fret * 0.1 * 2;
    case 4:
      return fret * 0.2 * 3;
    case 5:
      return fret * 0.3 * 4;
    default:
      return 0;
  }
};

interface FretLineProps {
  elements: (string | boolean)[];
  string?: number;
}

const FretLine: React.FC<FretLineProps> = ({ elements, string }) => {
  const widthStep = 10.25; // Width step for each subsequent fret
  const initialWidth = (FretCount + 1) * widthStep; // Initial width for the first fret
  const widthFactor = 1.06; // Exponential factor for fret width increase

  return (
    <View style={tw`flex-row justify-between items-center`}>
      {elements.map((element, fret) => {
        const width = initialWidth / Math.pow(widthFactor, fret);
        let top = 0;
        if (string !== undefined) {
          top = calculateTop(string, fret);
        }

        const isInScale = element !== false;
        const isHeader = typeof element === "string";
        const circleWidth = isHeader ? "w-10 h-10" : "w-6 h-6";

        return (
          <View
            key={fret}
            style={[
              tw`relative flex justify-center items-center pl-8 pr-8 pt-1 pb-1`,
              { width, top },
              fret > 0 && tw`border-l-2 border-red-500`,
            ]}
          >
            <Text
              style={[
                tw`text-red-500 text-md font-mono bg-orange-100 p-2 w-2 h-2 flex justify-center items-center rounded-full`,
                {
                  opacity: isInScale ? 100 : 0,
                },
              ]}
            >
              <View
                style={tw`bg-transparent p-2 ${circleWidth} flex justify-center items-center rounded-full bg-orange-100 border-slate-800 border-2`}
              >
                <Text style={tw`text-red-500 text-xl font-mono`}>
                  {!isHeader ? "X" : element}
                </Text>
              </View>
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const Fretboard: React.FC = () => {
  const [selectedScale, setSelectedScale] = useState<string>(
    scalesMap.keys().next().value
  );
  const [selectedBaseNote, setSelectedBaseNote] = useState<Note>(Note.E);
  const [neck, setNeck] = useState<boolean[][]>();
  useEffect(() => {
    console.log(selectedBaseNote);
    console.log(selectedScale);
    const scalePattern: Set<number> = new Set(scalesMap.get(selectedScale));
    setNeck(
      generateNeckRepresentation(
        scalePattern,
        stringTuning,
        selectedBaseNote as number
      )
    );
  }, [selectedBaseNote, selectedScale]);

  if (!neck) {
    return "Loading...";
  }

  return (
    <ImageBackground
      imageStyle={{
        position: "absolute",
        top: -670,
        left: -1176,
        width: 5504,
        height: 2200,
        transform: [
          { scale: 0.66 }, // Scale the image by 1.25
        ],
      }}
      resizeMode="cover"
      source={require("./assets/guitar.png")}
    >
      <View style={tw`p-5`}>
        <View style={tw`mb-1`}>
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
        </View>

        <View style={tw`mb-40`}>
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

        <View>
          <View style={tw`relative left-48`}>
            <FretLine
              elements={Array.from({ length: FretCount + 1 }, (_, index) =>
                index.toString()
              )}
            />
            <View style={tw`mt-20`}>
              {neck.map((row, rowIndex) => (
                <FretLine
                  string={rowIndex}
                  key={rowIndex}
                  elements={row}
                ></FretLine>
              ))}
            </View>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
};

export default Fretboard;
