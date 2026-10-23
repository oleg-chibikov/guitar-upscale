import {
  StrummingPattern,
  chordStrummingPatterns,
  lastStrummingPatternId,
} from "@/app/data/strummingPatterns";

// Create a map to hold all strumming patterns
export const strummingPatternsMap = new Map<number, StrummingPattern>();

// Initialize the map with predefined patterns
chordStrummingPatterns.forEach((pattern) => {
  strummingPatternsMap.set(pattern.id, pattern);
});

// Function to load patterns from LocalStorage and add them to the map
export function loadPatternsFromLocalStorage() {
  const savedPatternsString = localStorage.getItem("strummingPatterns");
  if (savedPatternsString !== null) {
    const savedPatterns: StrummingPattern[] = JSON.parse(savedPatternsString);
    savedPatterns.forEach((pattern) => {
      strummingPatternsMap.set(pattern.id, pattern);
    });
  }
}

// API functions to work with patterns in local storage

export function addPattern(pattern: StrummingPattern): void {
  strummingPatternsMap.set(pattern.id, pattern);
  savePatternsToLocalStorage();
}

export function deletePattern(id: number): void {
  strummingPatternsMap.delete(id);
  savePatternsToLocalStorage();
}

export function editPattern(pattern: StrummingPattern): void {
  strummingPatternsMap.set(pattern.id, pattern);
  savePatternsToLocalStorage();
}

export function getPatternById(id: number): StrummingPattern | undefined {
  return strummingPatternsMap.get(id);
}

function savePatternsToLocalStorage(): void {
  const customPatterns = Array.from(strummingPatternsMap.values()).filter(
    (pattern) => pattern.id > lastStrummingPatternId,
  );
  localStorage.setItem("strummingPatterns", JSON.stringify(customPatterns));
}

export function getAllPatterns(): StrummingPattern[] {
  return Array.from(strummingPatternsMap.values());
}

export function getCustomPatterns(): StrummingPattern[] {
  return Array.from(strummingPatternsMap.values()).filter(
    (pattern) => pattern.id > lastStrummingPatternId,
  );
}

export function clearCustomPatterns(): void {
  for (const id of Array.from(strummingPatternsMap.keys())) {
    if (id > lastStrummingPatternId) {
      strummingPatternsMap.delete(id);
    }
  }
  localStorage.removeItem("strummingPatterns");
}

// Console logs for debugging
console.log(chordStrummingPatterns);
console.log("Last pattern ID:", lastStrummingPatternId);
console.log("Total patterns in map:", strummingPatternsMap.size);
