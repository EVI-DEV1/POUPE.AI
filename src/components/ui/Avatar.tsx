import { User } from 'lucide-react';

import type { Profile } from '@/data/finance';
import { initials } from '@/utils/format';

interface AvatarProps {
  profile: Profile;
  size?: number;
}

export function Avatar({ profile, size = 44 }: AvatarProps) {
  const style = { width: size, height: size };
  const ring = 'ring-2 ring-primary-glow/60 ring-offset-2 ring-offset-background';

  if (profile.avatarImage) {
    return (
      <img
        src={profile.avatarImage}
        alt=""
        style={style}
        className={`shrink-0 rounded-full object-cover ${ring}`}
      />
    );
  }

  return (
    <span
      aria-hidden
      style={{ ...style, background: `linear-gradient(140deg, ${profile.avatarColor}, #1e1b4b)` }}
      className={`flex shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${ring}`}
    >
      {profile.name ? initials(profile.name) : <User size={size * 0.45} />}
    </span>
  );
}
