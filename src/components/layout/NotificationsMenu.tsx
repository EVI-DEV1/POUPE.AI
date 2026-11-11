import { Bell, BellOff, CheckCheck, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useSimulations } from '@/hooks/useSimulationStorage';
import { readNotificationsStore, useGoals, usePlanning, useReadNotifications } from '@/stores';
import { formatDate } from '@/utils/format';
import { type AppNotification, buildNotifications } from '@/utils/notifications';

const toneIcon = {
  info: { icon: Info, className: 'text-accent-cyan bg-accent-cyan/12' },
  success: { icon: CircleCheck, className: 'text-success bg-success-soft' },
  warning: { icon: TriangleAlert, className: 'text-warning bg-warning-soft' },
};

export function NotificationsMenu() {
  const navigate = useNavigate();
  const goals = useGoals();
  const simulations = useSimulations();
  const planning = usePlanning();
  const readIds = useReadNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const notifications = useMemo(
    () => buildNotifications(goals, simulations, planning),
    [goals, simulations, planning]
  );
  const unread = notifications.filter((n) => !readIds.includes(n.id));

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const markRead = (ids: string[]) =>
    readNotificationsStore.write((current) => {
      // Mantém apenas IDs ainda existentes para o storage não crescer indefinidamente.
      const valid = new Set(notifications.map((n) => n.id));
      return Array.from(new Set([...current, ...ids])).filter((id) => valid.has(id));
    });

  const openNotification = (notification: AppNotification) => {
    markRead([notification.id]);
    setOpen(false);
    void navigate(notification.to);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={
          unread.length > 0 ? `Notificações: ${unread.length} não lida(s)` : 'Notificações'
        }
        className="surface hover:border-border-strong rounded-full! relative flex h-12 w-12 items-center justify-center transition"
      >
        <Bell size={22} aria-hidden />
        {unread.length > 0 && (
          <span className="bg-primary-glow ring-background absolute right-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[0.65rem] font-bold text-white shadow-[0_0_12px_rgba(168,85,247,0.9)] ring-2">
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notificações"
          className="surface animate-fade-up fixed left-4 right-4 top-20 z-40 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96"
        >
          <div className="border-border flex items-center justify-between border-b px-4 py-3">
            <p className="font-semibold">Notificações</p>
            {unread.length > 0 && (
              <button
                type="button"
                onClick={() => markRead(notifications.map((n) => n.id))}
                className="text-primary-glow flex items-center gap-1.5 text-xs font-medium hover:underline"
              >
                <CheckCheck size={14} /> Marcar todas como lidas
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
              <BellOff size={22} className="text-muted-foreground" />
              <p className="text-muted-foreground text-sm">
                Nenhuma notificação. Crie metas e simulações para receber alertas.
              </p>
            </div>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto p-2">
              {notifications.map((n) => {
                const tone = toneIcon[n.tone];
                const isUnread = !readIds.includes(n.id);
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => openNotification(n)}
                      className="hover:bg-secondary-button flex w-full gap-3 rounded-xl p-3 text-left transition"
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone.className}`}
                      >
                        <tone.icon size={17} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block text-sm ${isUnread ? 'font-semibold' : 'text-muted-foreground font-medium'}`}
                        >
                          {n.title}
                        </span>
                        <span className="text-muted-foreground mt-0.5 block text-xs leading-snug">
                          {n.description}
                        </span>
                        <span className="text-muted-foreground/70 mt-1 block text-[0.7rem]">
                          {formatDate(n.date)}
                        </span>
                      </span>
                      {isUnread && (
                        <span className="bg-primary-glow mt-1.5 h-2 w-2 shrink-0 rounded-full">
                          <span className="sr-only">Não lida</span>
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
