import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Trash2, UserPlus, UtensilsCrossed } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from '../lib/notificationsApi';
import { getErrorMessage } from '../lib/errors';

function iconFor(type: string) {
  if (type === 'new_follower') return UserPlus;
  if (type === 'new_recipe') return UtensilsCrossed;
  return Bell;
}

function targetFor(n: NotificationItem): string | null {
  if (n.relatedRecipeId) return `/recipe/${n.relatedRecipeId}`;
  if (n.relatedUserId) return `/creator/${n.relatedUserId}`;
  return null;
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

/** Page dédiée aux notifications (nouvel abonné, nouvelle recette suivie…). */
export default function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    getNotifications(user.id)
      .then((data) => {
        if (isMounted) setItems(data);
      })
      .catch((err) => {
        if (isMounted) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [user]);

  async function handleMarkAllRead() {
    if (!user) return;
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await markAllNotificationsRead(user.id);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleOpen(n: NotificationItem) {
    if (!n.isRead) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      try {
        await markNotificationRead(n.id);
      } catch {
        // pas bloquant pour la navigation
      }
    }
  }

  async function handleDelete(n: NotificationItem) {
    setItems((prev) => prev.filter((x) => x.id !== n.id));
    try {
      await deleteNotification(n.id);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const unreadCount = items.filter((n) => !n.isRead).length;

  return (
    <AppLayout>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-heading">Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-semibold text-accent hover:text-accent-dark"
          >
            Tout marquer comme lu
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-900 bg-red-950/40 px-3 py-2.5 text-[13px] text-red-400">
          {error}
        </div>
      )}

      {isLoading && <div className="py-16 text-center text-sm text-neutral-500">Chargement…</div>}

      {!isLoading && items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900 py-16 text-center text-sm text-neutral-500">
          <Bell size={28} strokeWidth={1.4} className="mx-auto mb-3 text-neutral-700" />
          Aucune notification pour l'instant.
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="space-y-2">
          {items.map((n) => {
            const Icon = iconFor(n.type);
            const target = targetFor(n);
            const content = (
              <div
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition ${
                  n.isRead
                    ? 'border-neutral-800 bg-neutral-900'
                    : 'border-accent/30 bg-accent/5'
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-accent">
                  <Icon size={16} strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-neutral-100">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-xs text-neutral-400">{n.body}</p>}
                  <p className="mt-1 text-[11px] text-neutral-500">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void handleDelete(n);
                  }}
                  title="Supprimer"
                  className="shrink-0 rounded-full p-1 text-neutral-600 hover:text-red-400"
                >
                  <Trash2 size={14} strokeWidth={2} />
                </button>
              </div>
            );

            return target ? (
              <Link key={n.id} to={target} onClick={() => handleOpen(n)} className="block">
                {content}
              </Link>
            ) : (
              <div key={n.id} onClick={() => handleOpen(n)} className="cursor-pointer">
                {content}
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
