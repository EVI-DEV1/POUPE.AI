import { RefreshCw } from 'lucide-react';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';

import { buttonClasses } from '@/components/ui/buttonStyles';

/** Tela amigável para erros inesperados de renderização ou de carregamento de rota. */
export function RouteError() {
  const error = useRouteError();
  console.error(error);

  const message = isRouteErrorResponse(error)
    ? `${error.status} — ${error.statusText}`
    : 'Algo deu errado ao carregar esta tela.';

  return (
    <div className="bg-background text-foreground flex min-h-dvh items-center justify-center p-6">
      <div className="surface max-w-md p-8 text-center">
        <p className="text-lg font-semibold">Ops! {message}</p>
        <p className="text-muted-foreground mt-2 text-sm">
          Seus dados continuam salvos neste navegador. Tente recarregar a página.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className={buttonClasses('primary', 'md')}
          >
            <RefreshCw size={16} aria-hidden /> Recarregar
          </button>
          <Link to="/" reloadDocument className={buttonClasses('secondary', 'md')}>
            Ir ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
