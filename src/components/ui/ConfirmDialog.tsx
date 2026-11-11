import { Trash2 } from 'lucide-react';

import { UIButton } from './Button';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Excluir',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      icon={<Trash2 size={18} />}
      footer={
        <>
          <UIButton variant="secondary" onClick={onCancel}>
            Cancelar
          </UIButton>
          <UIButton variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </UIButton>
        </>
      }
    >
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </Modal>
  );
}
