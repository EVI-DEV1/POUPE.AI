import { useMemo } from 'react';

import { buildAssistantContext } from '@/data/assistantPrompt';
import { useSimulations } from '@/hooks/useSimulationStorage';
import { useGoals, usePlanning, useProfile } from '@/stores';
import { getFinancialSnapshot, pickFeaturedGoal } from '@/utils/finance';
import { calculateFinancialHealth } from '@/utils/financialHealth';

/** Junta todos os dados locais e os indicadores derivados usados no app. */
export function useFinancialOverview() {
  const simulations = useSimulations();
  const goals = useGoals();
  const planning = usePlanning();
  const profile = useProfile();

  return useMemo(() => {
    const snapshot = getFinancialSnapshot(planning, simulations);
    const health = calculateFinancialHealth(snapshot, goals);

    return {
      simulations,
      goals,
      planning,
      profile,
      snapshot,
      health,
      featuredGoal: pickFeaturedGoal(goals),
      buildContext: () =>
        buildAssistantContext({ userName: profile.name, simulations, goals, planning, health }),
    };
  }, [simulations, goals, planning, profile]);
}
