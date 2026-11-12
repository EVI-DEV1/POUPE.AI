import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FinancialEvolutionChart } from '@/components/features/Dashboard/FinancialEvolutionChart';
import { NotificationsMenu } from '@/components/layout/NotificationsMenu';
import { mixedSimulationData, stubLocalStorage } from '@/test/fixtures';
import { readSimulations } from '@/utils/simulationRecords';

import { DashboardPage } from './DashboardPage';
import { SimulationHistoryPage } from './SimulationHistoryPage';

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Dados no formato que usuários antigos têm hoje no navegador. */
const existingData = () => ({
  'simulation-data': mixedSimulationData(),
  'poupeai-goals': [
    // Meta concluída sem updatedAt e meta com datas corrompidas.
    { id: 'g1', name: 'Reserva', targetAmount: 1000, savedAmount: 1000, deadline: '' },
    {
      id: 'g2',
      name: 'Viagem',
      targetAmount: 5000,
      savedAmount: 100,
      deadline: '2026-11-20',
      updatedAt: 42,
      contributions: [{ id: 'c1', amount: 100 }],
    },
  ],
  'poupeai-planning': { currentBalance: 1200, balanceUpdatedAt: 'inválida', months: [] },
});

const render = (node: React.ReactNode) =>
  renderToString(<MemoryRouter initialEntries={['/']}>{node}</MemoryRouter>);

describe('abertura do dashboard com dados existentes', () => {
  it('renderiza o menu de notificações sem lançar erro', () => {
    stubLocalStorage(existingData());
    expect(() => render(<NotificationsMenu />)).not.toThrow();
    expect(render(<NotificationsMenu />)).toContain('não lida(s)');
  });

  it('renderiza o dashboard sem lançar erro', () => {
    stubLocalStorage(existingData());
    const html = render(<DashboardPage />);
    // As simulações válidas (inclusive as antigas) continuam aparecendo.
    expect(html).toContain('Reforma');
  });

  it('renderiza o gráfico e o histórico com registros antigos', () => {
    stubLocalStorage(existingData());
    expect(() => render(<SimulationHistoryPage />)).not.toThrow();
    expect(render(<SimulationHistoryPage />)).toContain('Viagem');
    expect(() =>
      render(
        <FinancialEvolutionChart months={[]} simulations={readSimulations(mixedSimulationData())} />
      )
    ).not.toThrow();
  });
});
