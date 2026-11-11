import { Menu } from 'lucide-react';

import { NotificationsMenu } from './NotificationsMenu';
import { ProfileMenu } from './ProfileMenu';
import { SearchBox } from './SearchBox';

interface TopbarProps {
  onOpenMenu: () => void;
}

export function Topbar({ onOpenMenu }: TopbarProps) {
  return (
    <header className="bg-background/80 sticky top-0 z-30 backdrop-blur-xl lg:static lg:bg-transparent lg:backdrop-blur-none">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:pb-2.5 lg:pt-3.5">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Abrir menu"
          className="surface rounded-full! flex h-12 w-12 shrink-0 items-center justify-center lg:hidden"
        >
          <Menu size={22} />
        </button>

        <div className="min-w-0 flex-1">
          <SearchBox />
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <NotificationsMenu />
          <div className="bg-border hidden h-10 w-px md:block" />
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
