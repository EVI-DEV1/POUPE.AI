import { Link } from 'react-router-dom';

import { AIAssistantMascot } from '@/components/features/Dashboard/AIAssistantMascot';
import { buttonClasses } from '@/components/ui/buttonStyles';

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <AIAssistantMascot className="h-44 w-40" />
      <h1 className="mt-4 text-2xl font-bold">Página não encontrada</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        O endereço pode ter mudado. Que tal voltar ao início?
      </p>
      <Link to="/" className={buttonClasses('primary', 'md', 'mt-6')}>
        Ir para o Dashboard
      </Link>
    </div>
  );
}
