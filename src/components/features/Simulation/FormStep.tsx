import { Button } from '@/components/shared/Button';
import { type LucideIcon } from 'lucide-react';

import { Input, type InputProps } from '@/components/shared/Input';
import { formatCurrencyMask } from '@/utils/currency';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useState, type SyntheticEvent } from 'react';

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

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue) {
      return;
    }

    onNext(inputValue);
  };

  return (
    <div className="bg-card rounded-2xl p-6 shadow-[4px_4px_18px_0px_rgba(0,0,0,0.2)] sm:p-8">
      <div className="bg-primary h-15 w-15 mb-4 flex items-center justify-center rounded-xl">
        <Icon size={32} className="text-primary-foreground" />
      </div>

      <h2 className="text-primary mb-1 text-xs font-semibold uppercase tracking-widest">{title}</h2>

      <h3 className="text-foreground mb-6 text-xl font-semibold leading-snug sm:text-2xl">
        {question}
      </h3>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          {...inputProps}
          value={inputValue}
          onChange={(e) =>
            setInputValue(
              inputProps.prefix === 'R$' ? formatCurrencyMask(e.target.value) : e.target.value
            )
          }
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
          {!hideBackButton && (
            <Button
              type="button"
              onClick={onBack}
              variant="ghost"
              icon={ArrowLeft}
              className="order-2 flex-1 justify-center rounded-xl py-3 sm:order-1"
            >
              Voltar
            </Button>
          )}

          <Button
            type="submit"
            variant="primary"
            icon={!submitButtonProps ? ArrowRight : undefined}
            disabled={!inputValue}
            className="order-1 flex-1 sm:order-2"
          >
            {submitButtonProps?.label ?? 'Próximo'}
            {submitButtonProps?.emojiIcon}
          </Button>
        </div>
      </form>
    </div>
  );
}
