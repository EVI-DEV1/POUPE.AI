import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { simulationFormSteps, type SimulationFormData } from '@/data/simulation';
import { useSimulationStorage } from '@/hooks/useSimulationStorage';

import { FormStep } from './FormStep';
import { StepProgress } from './Progress';

interface SimulationFormProps {
  /** Dados para pré-preencher (modo edição). */
  initialData?: SimulationFormData;
  /** Quando informado, substitui o comportamento padrão de salvar uma nova simulação. */
  onComplete?: (data: SimulationFormData) => void;
  submitLabel?: string;
}

export const SimulationForm = ({ initialData, onComplete, submitLabel }: SimulationFormProps) => {
  const { saveFormData } = useSimulationStorage();
  const navigate = useNavigate();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<SimulationFormData>(
    initialData ?? ({} as SimulationFormData)
  );
  const totalSteps = simulationFormSteps.length;
  const currentStep = simulationFormSteps[currentStepIndex];
  const isLastStep = currentStepIndex === totalSteps - 1;

  const handleNextStep = (value: string) => {
    const updatedFormData = { ...formData, [currentStep.id]: value };
    setFormData(updatedFormData);

    if (isLastStep) {
      if (onComplete) {
        onComplete(updatedFormData);
        return;
      }
      const id = saveFormData(updatedFormData);
      void navigate(`/resultado/${id}`);
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

  const stepProps =
    isLastStep && submitLabel && currentStep.submitButtonProps
      ? {
          ...currentStep,
          submitButtonProps: { ...currentStep.submitButtonProps, label: submitLabel },
        }
      : currentStep;

  return (
    <>
      <StepProgress currentStep={currentStepIndex + 1} totalSteps={totalSteps} />
      <FormStep
        key={currentStep.id}
        {...stepProps}
        value={formData[currentStep.id] ?? ''}
        onBack={handlePreviousStep}
        onNext={handleNextStep}
        hideBackButton={currentStepIndex === 0}
      />
    </>
  );
};
