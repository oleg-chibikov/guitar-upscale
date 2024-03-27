import React from "react";
import { View, Text } from "react-native";

interface Tuning {
  key: string;
  modifier: number;
}

interface Scale {
  key: string;
  frets: number[];
}

const Fretboard: React.FC = () => {
  const FretCount: number = 12;

  const generateNeckRepresentation = (
    scalePattern: Set<number>,
    stringTuning: Tuning[]
  ): string[][] => {
    const neck: string[][] = [];

    for (let i = 0; i < stringTuning.length; i++) {
      const stringModifier: number = stringTuning[i].modifier;
      neck[i] = [];

      for (let j = 0; j <= FretCount; j++) {
        // Calculate the position on the neck for the current fret and string
        const position: number = (FretCount + j - stringModifier) % FretCount;

        // Check if the position is in the scale pattern
        const isInScale: boolean = scalePattern.has(position);

        // Set 'X' or '-' based on whether the position is in the scale pattern
        neck[i][j] = isInScale ? "X" : "-";
      }
    }

    return neck;
  };

  const outputNeckRepresentation = (
    neck: string[][],
    stringTuning: Tuning[]
  ): JSX.Element => {
    return (
      <View>
        <Text>
          | Fret | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
        </Text>
        <Text>
          |--------|---|---|---|---|---|---|---|---|---|---|----|----|----|
        </Text>
        {neck.map((row, rowIndex) => (
          <View key={rowIndex}>
            <Text>
              | {stringTuning[rowIndex].key} (+{stringTuning[rowIndex].modifier}
              ) | {row.join(" | ")} |
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const scales: Scale[] = [
    { key: "Dorian", frets: [0, 2, 3, 5, 7, 8, 10, 12] },
    { key: "Hijaz_Arabic", frets: [0, 1, 4, 5, 7, 8, 11, 12] },
    { key: "Iwato_Japanese", frets: [0, 1, 5, 6, 10, 12] },
    { key: "Kumoi_Japanese", frets: [0, 1, 5, 7, 8, 12] },
    { key: "Insen_Japanese", frets: [0, 1, 5, 7, 10, 12] },
    { key: "Yo_Chinese", frets: [0, 2, 5, 7, 9, 12] },
    { key: "Hungarian_Major_Gypsy", frets: [0, 3, 4, 6, 7, 9, 10, 12] },
  ];

  const stringTuning: Tuning[] = [
    { key: "E", modifier: 0 },
    { key: "B", modifier: 5 },
    { key: "G", modifier: 9 },
    { key: "D", modifier: 2 },
    { key: "A", modifier: 7 },
    { key: "E", modifier: 0 },
  ];

  return (
    <View>
      {scales.map((scale, index) => {
        const scalePattern: Set<number> = new Set(scale.frets);
        const neck: string[][] = generateNeckRepresentation(
          scalePattern,
          stringTuning
        );
        return (
          <View key={index}>
            <Text>{scale.key}</Text>
            {outputNeckRepresentation(neck, stringTuning)}
          </View>
        );
      })}
    </View>
  );
};

export default Fretboard;
