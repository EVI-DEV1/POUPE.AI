import { type PropsWithChildren, useEffect, useState } from 'react';

import { type Theme, ThemeContext } from './ThemeContext';

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState<Theme>(() => {
    const localStorageTheme = localStorage.getItem('theme');

    if (localStorageTheme === 'light' || localStorageTheme === 'dark') {
      return localStorageTheme;
    }

    // A identidade visual do Poupe.ai 2.0 é escura; o tema claro continua disponível.
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
