import { DatabaseBackup } from 'lucide-react';
import { useState } from 'react';

import {
  dismissLegacyImport,
  importLegacyData,
  shouldOfferLegacyImport,
  summarizeLegacyData,
} from '@/auth/legacyImport';
import { UIButton } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

import { LegacySummaryList } from './LegacySummaryList';

/**
 * Após o login, oferece copiar para o perfil os dados salvos neste navegador
 * antes dos perfis demonstrativos. Os registros originais não são apagados.
 */
export function LegacyImportDialog({ userId }: { userId: string }) {
  const [open, setOpen] = useState(() => shouldOfferLegacyImport(userId));
  const [summary] = useState(summarizeLegacyData);
  const [error, setError] = useState('');

  if (!open) return null;

  const later = () => {
    dismissLegacyImport(userId);
    setOpen(false);
  };

  const confirm = () => {
    try {
      importLegacyData(userId);
      setOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível importar os dados.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={later}
      title="Importar dados deste navegador?"
      description="Encontramos dados salvos aqui antes dos perfis demonstrativos."
      icon={<DatabaseBackup size={18} />}
      footer={
        <>
          <UIButton variant="secondary" onClick={later}>
            Agora não
          </UIButton>
          <UIButton onClick={confirm}>Importar para este perfil</UIButton>
        </>
      }
    >
      <LegacySummaryList summary={summary} />
      <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
        Os dados serão <strong className="text-foreground">copiados</strong> para este perfil — os
        originais continuam guardados no navegador. Para evitar que outro perfil receba esses
        registros por engano, apenas um perfil pode importá-los. Você também pode fazer isso depois
        em Preferências.
      </p>
      {error && (
        <p role="alert" className="text-danger mt-3 text-sm">
          {error}
        </p>
      )}
    </Modal>
  );
}
