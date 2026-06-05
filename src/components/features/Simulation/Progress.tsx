interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function StepProgress({ currentStep, totalSteps }: StepProgressProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="mb-4">
      <p className="text-muted-foreground text-sm">
        Passo {currentStep} de {totalSteps}
      </p>
      <div className="bg-border overflow-fidden h-1 w-full rounded-full">
        <div
          role="progressbar"
          aria-valuenow={currentStep}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-label={`Passo: ${currentStep} de ${totalSteps}`}
          className="bg-primary h-1 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
