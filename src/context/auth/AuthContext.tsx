import { createContext } from 'react';

import type { AuthResult } from '@/auth/demoAuth';
import type { PublicUser } from '@/auth/session';
import type { SignInForm, SignUpForm } from '@/utils/validation';

export interface AuthContextValue {
  /** Perfil demonstrativo ativo (sem credenciais) ou `null`. */
  user: PublicUser | null;
  isAuthenticated: boolean;
  signIn: (form: SignInForm) => Promise<AuthResult>;
  signUp: (form: SignUpForm) => Promise<AuthResult>;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
