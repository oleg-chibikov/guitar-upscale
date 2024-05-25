const generateStepsArray = () => {
  const steps = [];

  for (let i = 25; i < 80; i += 5) {
    steps.push(i);
  }

  for (let i = 80; i < 180; i++) {
    steps.push(i);
  }

  for (let i = 180; i < 300; i += 5) {
    steps.push(i);
  }

  for (let i = 300; i < 400; i += 25) {
    steps.push(i);
  }

  for (let i = 400; i <= 500; i += 50) {
    steps.push(i);
  }

  return steps;
};

export const tempoSteps = generateStepsArray();
