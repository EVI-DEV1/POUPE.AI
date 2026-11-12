import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = path.resolve(import.meta.dirname, '../src');

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [full] : [];
  });

describe('GEMINI_API_KEY fica só no servidor', () => {
  it('o código do navegador não lê variáveis de ambiente com a chave', () => {
    const offenders = sourceFiles(SRC).filter((file) => {
      const code = readFileSync(file, 'utf8');
      // Vite só embute no bundle as variáveis `import.meta.env.*` referenciadas.
      return (
        /import\.meta\.env\.[A-Z_]*(GEMINI|API_KEY|SECRET)/.test(code) || /process\.env/.test(code)
      );
    });
    expect(offenders.map((file) => path.relative(SRC, file))).toEqual([]);
  });

  it('o navegador chama a IA apenas pelo proxy /api/gemini', () => {
    const offenders = sourceFiles(SRC).filter((file) =>
      readFileSync(file, 'utf8').includes('generativelanguage.googleapis.com')
    );
    expect(offenders).toEqual([]);
  });
});
