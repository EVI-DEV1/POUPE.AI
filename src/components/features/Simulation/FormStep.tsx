import { ArrowLeft, ArrowRight, type LucideIcon } from 'lucide-react';
import { type SyntheticEvent, useId, useState } from 'react';

import { Input, type InputProps } from '@/components/shared/Input';
import { UIButton } from '@/components/ui/Button';
import { formatCurrencyMask } from '@/utils/currency';

export interface FormStepProps {
  id: string;
  icon: LucideIcon;
  title: string;
  question: string;
  inputProps: InputProps;
  submitButtonProps?: {
    label: string;
    emojiIcon?: string;
  };
}

interface ActionsButtonsProps {
  value?: string;
  onNext: (value: string) => void;
  onBack?: () => void;
  hideBackButton?: boolean;
}

export function FormStep({
  icon: Icon,
  title,
  question,
  inputProps,
  submitButtonProps,
  hideBackButton,
  value,
  onBack,
  onNext,
}: FormStepProps & ActionsButtonsProps) {
  const [inputValue, setInputValue] = useState(value ?? '');
  const questionId = useId();

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue) {
      return;
    }

    onNext(inputValue);
  };

  return (
    <div className="surface animate-fade-up p-6 sm:p-8">
      <span className="icon-tile mb-5 h-14 w-14">
        <Icon size={30} aria-hidden />
      </span>

      <p className="text-primary-glow mb-1 text-xs font-semibold uppercase tracking-widest">
        {title}
      </p>

      <h2 id={questionId} className="mb-6 text-xl font-semibold leading-snug sm:text-2xl">
        {question}
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          {...inputProps}
          aria-labelledby={questionId}
          value={inputValue}
          onChange={(e) =>
            setInputValue(
              inputProps.prefix === 'R$' ? formatCurrencyMask(e.target.value) : e.target.value
            )
          }
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          {!hideBackButton && (
            <UIButton
              onClick={onBack}
              variant="secondary"
              size="lg"
              icon={ArrowLeft}
              className="order-2 flex-1 sm:order-1"
            >
              Voltar
            </UIButton>
          )}

          <UIButton
            type="submit"
            size="lg"
            iconRight={!submitButtonProps ? ArrowRight : undefined}
            disabled={!inputValue}
            className="order-1 flex-1 sm:order-2"
          >
            {submitButtonProps?.label ?? 'Próximo'} {submitButtonProps?.emojiIcon}
          </UIButton>
        </div>
      </form>
    </div>
  );
}
