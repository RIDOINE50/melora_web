import { type ReactNode, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  ChevronDown,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Rss,
  Search,
  Settings as SettingsIcon,
  Store,
  UsersRound,
  UtensilsCrossed,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { signOut } from '../../lib/authApi';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/dashboard/recipes', label: 'Mes recettes', icon: UtensilsCrossed, end: false },
  { to: '/dashboard/followers', label: 'Abonnés', icon: UsersRound, end: false },
  { to: '/dashboard/shop', label: 'Boutique', icon: Store, end: false },
  { to: '/dashboard/stats', label: 'Statistiques', icon: BarChart3, end: false },
  { to: '/dashboard/settings', label: 'Paramètres', icon: SettingsIcon, end: false },
];

export default function DashboardShell({ title, children }: { title: string; children: ReactNode }) {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  async function handleLogout() {
    await signOut();
    navigate('/login', { replace: true });
  }

  const initial = (profile?.full_name ?? '?').charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside className="flex w-60 shrink-0 flex-col border-r border-neutral-200 bg-white">
        <div className="flex h-16 items-center px-6">
          <span className="brand-logo text-2xl text-neutral-900">Mealora</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-green-50 text-green-700'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                }`
              }
            >
              <item.icon size={18} strokeWidth={2} />
              {item.label}
            </NavLink>
          ))}

          <div className="my-2 border-t border-neutral-100" />

          <NavLink
            to="/feed"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-900"
          >
            <Rss size={18} strokeWidth={2} />
            Voir le feed
          </NavLink>
        </nav>

        <div className="relative border-t border-neutral-100 p-3">
          <button
            onClick={() => setIsMenuOpen((v) => !v)}
            className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left hover:bg-neutral-50"
          >
            <span className="avatar-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white">
              {initial}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-neutral-900">
                {profile?.full_name || 'Créateur'}
              </span>
              <span className="block truncate text-xs text-neutral-500">{user?.email}</span>
            </span>
            <ChevronDown size={16} className="shrink-0 text-neutral-400" />
          </button>

          {isMenuOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-1 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate('/dashboard/settings');
                }}
                className="block w-full px-3.5 py-2.5 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Mon profil
              </button>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut size={15} />
                Se déconnecter
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-6">
          <h1 className="text-lg font-bold text-neutral-900">{title}</h1>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                placeholder="Rechercher…"
                className="w-56 rounded-lg border border-neutral-200 bg-neutral-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-neutral-300 focus:bg-white"
              />
            </div>
            <button className="text-neutral-500 hover:text-neutral-900" title="Notifications">
              <Bell size={19} strokeWidth={1.8} />
            </button>
            <button className="text-neutral-500 hover:text-neutral-900" title="Aide">
              <HelpCircle size={19} strokeWidth={1.8} />
            </button>
            <span className="avatar-gradient flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white">
              {initial}
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 sm:p-8">{children}</main>
      </div>
    </div>
  );
}