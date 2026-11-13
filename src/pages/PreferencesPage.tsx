import { DatabaseBackup, Download, Moon, PanelLeftClose, Sun, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { importLegacyData, readLegacyClaim, summarizeLegacyData } from '@/auth/legacyImport';
import { LegacySummaryList } from '@/components/auth/LegacySummaryList';
import { PageHero } from '@/components/shared/PageHero';
import { UIButton } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Panel } from '@/components/ui/Panel';
import { useAuth } from '@/hooks/useAuth';
import { simulationStore } from '@/hooks/useSimulationStorage';
import { useTheme } from '@/hooks/useTheme';
import {
  assistantChatStore,
  exportableStorageKeys,
  goalsStore,
  planningStore,
  preferencesStore,
  usePreferences,
} from '@/stores';

type ClearTarget = 'simulations' | 'goals' | 'planning' | 'chat';

const CLEAR_OPTIONS: { id: ClearTarget; label: string; description: string }[] = [
  {
    id: 'simulations',
    label: 'Simulações',
    description: 'Todas as simulações, diagnósticos e conversas delas.',
  },
  { id: 'goals', label: 'Metas', description: 'Metas e histórico de aportes.' },
  { id: 'planning', label: 'Planejamento', description: 'Saldo informado e meses registrados.' },
  { id: 'chat', label: 'Chat com IA', description: 'Conversa do chat geral.' },
];

/** Dados salvos antes dos perfis demonstrativos: importação opcional. */
function LegacyDataPanel({ userId }: { userId: string }) {
  const [claim, setClaim] = useState(readLegacyClaim);
  const [summary] = useState(summarizeLegacyData);

  if (!claim && summary.total === 0) return null;

  return (
    <Panel title="Dados anteriores deste navegador">
      {claim ? (
        <p className="text-muted-foreground -mt-2 text-sm">
          {claim.userId === userId
            ? 'Os dados salvos antes dos perfis demonstrativos já foram importados para este perfil.'
            : 'Os dados salvos antes dos perfis demonstrativos foram importados por outro perfil deste navegador.'}{' '}
          Os registros originais continuam guardados no navegador.
        </p>
      ) : (
        <>
          <p className="text-muted-foreground -mt-2 mb-4 text-sm">
            Há dados salvos aqui antes dos perfis demonstrativos. Eles podem ser copiados para este
            perfil (os originais não são apagados). Apenas um perfil pode importá-los.
          </p>
          <LegacySummaryList summary={summary} />
          <UIButton
            className="mt-4"
            icon={DatabaseBackup}
            onClick={() => {
              importLegacyData(userId);
              setClaim(readLegacyClaim());
            }}
          >
            Importar para este perfil
          </UIButton>
        </>
      )}
    </Panel>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-primary' : 'bg-border-strong'}`}
    >
      <span
        className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition ${checked ? 'translate-x-5' : ''}`}
      />
    </button>
  );
}

export function PreferencesPage() {
  const { theme, setTheme } = useTheme();
  const { sidebarCollapsed } = usePreferences();
  const [clearing, setClearing] = useState<ClearTarget | null>(null);
  const { user } = useAuth();

  const exportData = () => {
    const data: Record<string, unknown> = { exportedAt: new Date().toISOString(), app: 'Poupe.ai' };
    Object.entries(exportableStorageKeys()).forEach(([name, key]) => {
      if (!key) return;
      try {
        const raw = localStorage.getItem(key);
        data[name] = raw ? JSON.parse(raw) : null;
      } catch {
        data[name] = localStorage.getItem(key);
      }
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `poupeai-dados-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clear = (target: ClearTarget) => {
    if (target === 'simulations') simulationStore.write([]);
    if (target === 'goals') goalsStore.write([]);
    if (target === 'planning')
      planningStore.write({ currentBalance: null, balanceUpdatedAt: null, months: [] });
    if (target === 'chat') assistantChatStore.write([]);
  };

  const clearingOption = CLEAR_OPTIONS.find((o) => o.id === clearing);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 py-2">
      <PageHero
        title="Preferências"
        subtitle="Aparência e gerenciamento dos dados salvos neste navegador."
      />

      <Panel title="Aparência">
        <div role="radiogroup" aria-label="Tema" className="grid gap-3 sm:grid-cols-2">
          {(
            [
              { value: 'dark', label: 'Escuro', icon: Moon, hint: 'Identidade padrão do Poupe.ai' },
              { value: 'light', label: 'Claro', icon: Sun, hint: 'Melhor em ambientes iluminados' },
            ] as const
          ).map(({ value, label, icon: Icon, hint }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={theme === value}
              onClick={() => setTheme(value)}
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${theme === value ? 'border-primary-glow bg-muted-primary' : 'border-border hover:border-border-strong'}`}
            >
              <Icon size={20} className="text-primary-glow" aria-hidden />
              <span>
                <span className="block font-semibold">{label}</span>
                <span className="text-muted-foreground block text-xs">{hint}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="border-border mt-5 flex items-center gap-4 border-t pt-5">
          <PanelLeftClose size={20} className="text-muted-foreground" aria-hidden />
          <div className="flex-1">
            <p className="font-medium">Menu lateral recolhido</p>
            <p className="text-muted-foreground text-sm">
              Mostra apenas os ícones em telas grandes.
            </p>
          </div>
          <Toggle
            label="Menu lateral recolhido"
            checked={sidebarCollapsed}
            onChange={() =>
              preferencesStore.write((p) => ({ ...p, sidebarCollapsed: !p.sidebarCollapsed }))
            }
          />
        </div>
      </Panel>

      <Panel title="Seus dados">
        <p className="text-muted-foreground -mt-2 mb-4 text-sm">
          Os dados deste perfil demonstrativo ficam salvos apenas neste navegador. Exportar e apagar
          afetam somente este perfil. Exporte uma cópia antes de limpar.
        </p>
        <UIButton variant="secondary" icon={Download} onClick={exportData}>
          Exportar dados (JSON)
        </UIButton>

        <ul className="divide-border mt-5 divide-y">
          {CLEAR_OPTIONS.map((option) => (
            <li key={option.id} className="flex items-center gap-4 py-3">
              <div className="flex-1">
                <p className="font-medium">{option.label}</p>
                <p className="text-muted-foreground text-sm">{option.description}</p>
              </div>
              <UIButton
                variant="ghost"
                size="sm"
                icon={Trash2}
                onClick={() => setClearing(option.id)}
                className="text-danger! hover:bg-danger-soft!"
              >
                Apagar
              </UIButton>
            </li>
          ))}
        </ul>
      </Panel>

      {user && <LegacyDataPanel userId={user.id} />}

      <ConfirmDialog
        open={!!clearing}
        title={`Apagar ${clearingOption?.label.toLowerCase() ?? ''}?`}
        description={`${clearingOption?.description ?? ''} Essa ação não pode ser desfeita.`}
        confirmLabel="Apagar"
        onCancel={() => setClearing(null)}
        onConfirm={() => {
          if (clearing) clear(clearing);
          setClearing(null);
        }}
      />
    </div>
  );
}
