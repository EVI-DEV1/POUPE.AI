import { type PropsWithChildren, useMemo } from 'react';

import { signIn, signOut, signUp } from '@/auth/demoAuth';
import { sessionStore, toPublicUser, usersStore } from '@/auth/session';
import { useLocalStore } from '@/lib/localStore';

import { AuthContext, type AuthContextValue } from './AuthContext';

/**
 * Sessão demonstrativa, reativa ao localStorage: persiste ao recarregar a
 * página e acompanha login/logout feitos em outras abas.
 */
export function AuthProvider({ children }: PropsWithChildren) {
  const session = useLocalStore(sessionStore);
  const users = useLocalStore(usersStore);

  const value = useMemo<AuthContextValue>(() => {
    // Mesma regra de `activeUser()`: a sessão só vale se o perfil existir.
    const current = session ? users.find((user) => user.id === session.userId) : undefined;
    return {
      user: current ? toPublicUser(current) : null,
      isAuthenticated: current !== undefined,
      signIn,
      signUp,
      signOut,
    };
  }, [session, users]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
