import { simulationFormSteps } from '@/data/simulation';

import { FormStep } from './FormStep';
import { StepProgress } from './Progress';

export const SimulationForm = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const totalSteps = simulationFormSteps.length;
  const currentStep = simulationFormSteps[currentStepIndex];

  const handleNextStep = () => {
    if (currentStepIndex + 1 > totalSteps - 1) {
      return;
    }
    setCurrentStepIndex((prev) => prev + 1);
  };
  const handlePreviousStep = () => {
    if (currentStepIndex === 0) {
      return;
    }
    setCurrentStepIndex((prev) => prev - 1);
  };

  return (
    <>
      <StepProgress currentStep={1} totalSteps={6} />
      <FormStep key={currentStep.id} {...currentStep} />
    </>
  );
};
