import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface QuickActionCardProps {
  to: string;
  icon: LucideIcon;
  label: string;
  highlighted?: boolean;
}

export function QuickActionCard({ to, icon: Icon, label, highlighted }: QuickActionCardProps) {
  return (
    <Link
      to={to}
      className={[
        'group flex min-h-[104px] flex-col items-center justify-center gap-2.5 rounded-2xl border px-3 py-3.5 text-center text-[0.95rem] font-medium leading-tight transition duration-200 hover:-translate-y-0.5',
        highlighted
          ? 'border-[#c084fc]/70 bg-gradient-to-b from-[#8b3cf0]/90 to-[#6022c9]/90 text-white shadow-[0_0_30px_-6px_rgba(168,85,247,0.85),inset_0_1px_0_rgba(255,255,255,0.25)]'
          : 'border-white/8 bg-white/[0.04] text-white/90 backdrop-blur-sm hover:border-[#a855f7]/50 hover:bg-white/[0.08]',
      ].join(' ')}
    >
      <Icon
        size={30}
        strokeWidth={1.6}
        aria-hidden
        className={highlighted ? 'text-white' : 'text-[#d8b4fe] transition group-hover:text-white'}
      />
      <span className="max-w-[9ch] text-balance">{label}</span>
    </Link>
  );
}
