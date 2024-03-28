import React, { ReactNode, useEffect, useState } from "react";
import { View, Text, Image, ImageBackground } from "react-native";
import { Picker } from "@react-native-picker/picker";
import tw from "./tailwind";
import {
  FretCount,
  generateNeckRepresentation,
} from "./generateNeckRepresentation";

// TODO
// More scales
// Scales by category - classical, expitic, major, minor, japanese, arabic, gypsy. several levels of nesting
// refactor - move types
// refactor - use notes for GuitarTuning
// refactor - store bools in neck
// mobile screen - not usable
// dark/light
// smaller image for preload to load immediately
// youtube videos for each scale
// playable notes - https://github.com/nabehide/react-native-piano-example
// synthetic examples - play scale using this piano above

export interface Tuning {
  key: string;
  modifier: number;
}

enum Note {
  E = 0,
  F = 1,
  "F#" = 2,
  G = 3,
  "G#" = 4,
  A = 5,
  "A#" = 6,
  B = 7,
  C = 8,
  "C#" = 9,
  D = 10,
  "D#" = 11,
}

// Define scales as a map
const scalesMap: Map<string, number[]> = new Map([
  ["Dorian (Minor)", [0, 2, 3, 5, 7, 8, 10, 12]],
  ["Hijaz (Arabic)", [0, 1, 4, 5, 7, 8, 11, 12]],
  ["Iwato (Japanese)", [0, 1, 5, 6, 10, 12]],
  ["Kumoi (Japanese)", [0, 1, 5, 7, 8, 12]],
  ["Insen (Japanese)", [0, 1, 5, 7, 10, 12]],
  ["Yo (Chinese Major)", [0, 2, 5, 7, 9, 12]],
  ["Hungarian Major (Gypsy)", [0, 3, 4, 6, 7, 9, 10, 12]],
]);

const stringTuning: Tuning[] = [
  { key: "E", modifier: 0 },
  { key: "B", modifier: 5 },
  { key: "G", modifier: 9 },
  { key: "D", modifier: 2 },
  { key: "A", modifier: 7 },
  { key: "E", modifier: 0 },
];

interface FretLineProps {
  elements: string[];
  string?: number;
}

const calculateTop = (string: number, fret: number) => {
  // TODO get the formula to avoid hardcoding each string
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

        const isInScale = element !== "-";

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
                style={tw`bg-transparent p-2 w-6 h-6 flex justify-center items-center rounded-full bg-orange-100 border-slate-800 border-2`}
              >
                <Text style={tw`text-red-500 text-xl font-mono`}>
                  {element}
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
  const [neck, setNeck] = useState<string[][]>();
  useEffect(() => {
    console.log(selectedBaseNote);
    console.log(selectedScale);
    const scalePattern: Set<number> = new Set(scalesMap.get(selectedScale));
    setNeck(
      generateNeckRepresentation(
        scalePattern,
        stringTuning,
        parseInt(selectedBaseNote as unknown as string)
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
