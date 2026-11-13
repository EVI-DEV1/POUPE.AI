import type { Location } from 'react-router-dom';

/**
 * Para onde ir após o login: a página salva pelo PrivateRoute, aceitando
 * apenas caminhos internos (evita redirecionar para outro site).
 */
export function redirectTarget(state: unknown) {
  const from = (state as { from?: Partial<Location> } | null)?.from;
  const path = `${from?.pathname ?? ''}${from?.search ?? ''}${from?.hash ?? ''}`;
  return path.startsWith('/') && !path.startsWith('//') ? path : '/';
}
