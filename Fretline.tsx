import React from "react";
import { View, Text } from "react-native";
import tw from "./tailwind";
import { FretCount } from "./generateNeckRepresentation";

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

export interface FretlineProps {
  elements: (number | boolean)[];
  string?: number;
  isHeader?: boolean;
}

export const Fretline: React.FC<FretlineProps> = ({
  elements,
  string,
  isHeader,
}) => {
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
                <Text style={tw`text-red-500 text-md font-mono`}>
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
