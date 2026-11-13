import { FlaskConical } from 'lucide-react';

/** Aviso exibido no login e no cadastro: as contas são demonstrativas e locais. */
export function DemoNotice() {
  return (
    <aside
      aria-label="Modo demonstração"
      className="border-primary-glow/40 bg-muted-primary flex gap-3 rounded-xl border p-3.5 text-sm"
    >
      <FlaskConical size={18} className="text-primary-glow mt-0.5 shrink-0" aria-hidden />
      <div className="space-y-1">
        <p className="font-semibold">Modo demonstração</p>
        <p className="text-foreground/85 leading-snug">
          Os perfis ficam salvos apenas neste navegador e nada é enviado a um servidor. Este login
          não é uma proteção real: use um <strong>e-mail fictício</strong> e uma senha que você não
          usa em nenhum outro lugar.
        </p>
      </div>
    </aside>
  );
}
