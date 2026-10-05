import { type ReactNode, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  Calendar,
  ChevronsLeft,
  ChevronsRight,
  Heart,
  Home,
  LogOut,
  Menu,
  PlusCircle,
  Settings as SettingsIcon,
  ShoppingBag,
  User,
  UsersRound,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from '../lib/authApi';
import { getUnreadNotificationCount } from '../lib/notificationsApi';

const TABS = [
  { path: '/', label: 'Accueil', icon: Home },
  { path: '/recipes', label: 'Recettes', icon: UtensilsCrossed },
  { path: '/plan', label: 'Plan', icon: Calendar },
  { path: '/shopping', label: 'Courses', icon: ShoppingBag },
];

const CREATOR_NAV_ITEMS = [
  { path: '/my-recipes', label: 'Mes recettes', icon: UtensilsCrossed },
  { path: '/followers', label: 'Abonnés', icon: UsersRound },
  { path: '/statistics', label: 'Statistiques', icon: BarChart3 },
];

const MENU_ITEMS = [
  { icon: Home, label: 'Accueil', path: '/' },
  { icon: UtensilsCrossed, label: 'Recettes', path: '/recipes' },
  { icon: Heart, label: 'Favoris', path: '/favorites' },
  { icon: Bell, label: 'Notifications', path: '/notifications' },
  { icon: Calendar, label: 'Planificateur de repas', path: '/plan' },
  { icon: ShoppingBag, label: 'Liste de courses', path: '/shopping' },
  { icon: User, label: 'Mon profil', path: '/profile' },
  { icon: SettingsIcon, label: 'Paramètres', path: '/settings' },
];

const SIDEBAR_STORAGE_KEY = 'mealora:sidebar-open';

function readStoredSidebarState(): boolean {
  try {
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return stored === null ? true : stored === '1';
  } catch {
    return true;
  }
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(readStoredSidebarState);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!profile) return;
    let isMounted = true;
    getUnreadNotificationCount(profile.id)
      .then((count) => {
        if (isMounted) setUnreadCount(count);
      })
      .catch(() => {
        // pas bloquant — le badge reste simplement à 0
      });
    return () => {
      isMounted = false;
    };
    // Recalculé à chaque changement de page — suffisant pour une démo
    // sans mettre en place un canal temps réel dédié.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, location.pathname]);

  function toggleSidebar() {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? '1' : '0');
      } catch {
        // stockage indisponible (navigation privée, etc.) — pas bloquant
      }
      return next;
    });
  }

  async function handleLogout() {
    await signOut();
    navigate('/login', { replace: true });
  }

  const initial = (profile?.full_name ?? profile?.id ?? '?').charAt(0).toUpperCase();
  const isActivePath = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 md:flex">
      {/* Barre latérale — tablette et bureau (écrans md et plus). Ouverte :
          navigation complète avec libellés. Réduite : rail d'icônes intégré
          au lieu de disparaître complètement, pour rester "professionnel"
          (pas de bouton flottant isolé au-dessus du contenu). */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-neutral-800 bg-neutral-950 transition-[width] duration-200 ease-in-out md:flex ${
          isSidebarOpen ? 'w-64' : 'w-[72px]'
        }`}
      >
        <div
          className={`flex h-16 shrink-0 items-center ${
            isSidebarOpen ? 'justify-between pl-6 pr-3' : 'justify-center px-2'
          }`}
        >
          {isSidebarOpen ? (
            <>
              <button className="brand-logo whitespace-nowrap text-2xl text-heading" onClick={() => navigate('/')}>
                Mealora
              </button>
              <button
                onClick={toggleSidebar}
                className="shrink-0 rounded-lg p-1.5 text-neutral-500 transition hover:bg-neutral-900 hover:text-neutral-200"
                title="Réduire le menu"
              >
                <ChevronsLeft size={18} strokeWidth={2} />
              </button>
            </>
          ) : (
            <button
              onClick={toggleSidebar}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-900 hover:text-heading"
              title="Ouvrir le menu"
            >
              <ChevronsRight size={18} strokeWidth={2} />
            </button>
          )}
        </div>

        {profile?.role === 'creator' && (
          <div className={`shrink-0 pb-2 ${isSidebarOpen ? 'px-4' : 'flex justify-center px-2'}`}>
            {isSidebarOpen ? (
              <button
                onClick={() => navigate('/my-recipes/new')}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white transition hover:bg-accent-dark"
              >
                <PlusCircle size={18} strokeWidth={2} />
                Nouvelle recette
              </button>
            ) : (
              <button
                onClick={() => navigate('/my-recipes/new')}
                title="Nouvelle recette"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white transition hover:bg-accent-dark"
              >
                <PlusCircle size={18} strokeWidth={2} />
              </button>
            )}
          </div>
        )}

        <nav className={`flex-1 space-y-1 py-2 ${isSidebarOpen ? 'px-3' : 'px-2'}`}>
          {TABS.map((tab) => {
            const isActive = isActivePath(tab.path);
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                title={tab.label}
                className={`flex w-full items-center whitespace-nowrap rounded-lg py-2.5 text-sm font-semibold transition ${
                  isSidebarOpen ? 'gap-3 px-3 text-left' : 'justify-center px-0'
                } ${
                  isActive
                    ? 'bg-accent/15 text-accent'
                    : 'text-neutral-300 hover:bg-neutral-900 hover:text-heading'
                }`}
              >
                <tab.icon size={19} strokeWidth={isActive ? 2.2 : 1.8} />
                {isSidebarOpen && tab.label}
              </button>
            );
          })}

          <div className={`my-2 border-t border-neutral-800 ${isSidebarOpen ? '' : 'mx-1'}`} />

          <button
            onClick={() => navigate('/favorites')}
            title="Favoris"
            className={`flex w-full items-center whitespace-nowrap rounded-lg py-2.5 text-sm font-semibold transition ${
              isSidebarOpen ? 'gap-3 px-3 text-left' : 'justify-center px-0'
            } ${
              isActivePath('/favorites')
                ? 'bg-accent/15 text-accent'
                : 'text-neutral-300 hover:bg-neutral-900 hover:text-heading'
            }`}
          >
            <Heart size={19} strokeWidth={1.8} />
            {isSidebarOpen && 'Favoris'}
          </button>

          <button
            onClick={() => navigate('/notifications')}
            title="Notifications"
            className={`relative flex w-full items-center whitespace-nowrap rounded-lg py-2.5 text-sm font-semibold transition ${
              isSidebarOpen ? 'gap-3 px-3 text-left' : 'justify-center px-0'
            } ${
              isActivePath('/notifications')
                ? 'bg-accent/15 text-accent'
                : 'text-neutral-300 hover:bg-neutral-900 hover:text-heading'
            }`}
          >
            <span className="relative">
              <Bell size={19} strokeWidth={1.8} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </span>
            {isSidebarOpen && 'Notifications'}
          </button>

          <button
            onClick={() => navigate('/settings')}
            title="Paramètres"
            className={`flex w-full items-center whitespace-nowrap rounded-lg py-2.5 text-sm font-semibold transition ${
              isSidebarOpen ? 'gap-3 px-3 text-left' : 'justify-center px-0'
            } ${
              isActivePath('/settings')
                ? 'bg-accent/15 text-accent'
                : 'text-neutral-300 hover:bg-neutral-900 hover:text-heading'
            }`}
          >
            <SettingsIcon size={19} strokeWidth={1.8} />
            {isSidebarOpen && 'Paramètres'}
          </button>

          {profile?.role === 'creator' && (
            <>
              <div className={`my-2 border-t border-neutral-800 ${isSidebarOpen ? '' : 'mx-1'}`} />
              {CREATOR_NAV_ITEMS.map((item) => {
                const isActive = isActivePath(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    title={item.label}
                    className={`flex w-full items-center whitespace-nowrap rounded-lg py-2.5 text-sm font-semibold transition ${
                      isSidebarOpen ? 'gap-3 px-3 text-left' : 'justify-center px-0'
                    } ${
                      isActive
                        ? 'bg-accent/15 text-accent'
                        : 'text-neutral-300 hover:bg-neutral-900 hover:text-heading'
                    }`}
                  >
                    <item.icon size={19} strokeWidth={isActive ? 2.2 : 1.8} />
                    {isSidebarOpen && item.label}
                  </button>
                );
              })}
            </>
          )}
        </nav>

        <div className={`relative shrink-0 border-t border-neutral-800 ${isSidebarOpen ? 'p-3' : 'flex justify-center p-2'}`}>
          {isSidebarOpen ? (
            <>
              <button
                onClick={() => setIsMenuOpen((v) => !v)}
                className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left hover:bg-neutral-900"
              >
                <span className="avatar-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white">
                  {initial}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-heading">
                    {profile?.full_name || 'Mon profil'}
                  </span>
                  <span className="block truncate text-xs text-neutral-500">Voir le profil</span>
                </span>
              </button>

              {isMenuOpen && (
                <div className="absolute bottom-full left-3 right-3 mb-1 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 shadow-lg">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate('/profile');
                    }}
                    className="block w-full px-3.5 py-2.5 text-left text-sm font-medium text-neutral-200 hover:bg-neutral-800"
                  >
                    Mon profil
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm font-medium text-red-400 hover:bg-neutral-800"
                  >
                    <LogOut size={15} />
                    Se déconnecter
                  </button>
                </div>
              )}
            </>
          ) : (
            <button
              onClick={() => navigate('/profile')}
              title="Mon profil"
              className="flex h-10 w-10 items-center justify-center rounded-full transition hover:opacity-80"
            >
              <span className="avatar-gradient flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white">
                {initial}
              </span>
            </button>
          )}
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
      {/* En-tête — mobile uniquement (écrans en dessous de md) */}
      <header className="sticky top-0 z-20 h-14 border-b border-neutral-800 bg-neutral-950/95 backdrop-blur md:hidden">
        <div className="mx-auto flex h-full max-w-2xl items-center justify-between px-4 sm:px-6">
          <button
            className="rounded-full p-1.5 text-neutral-100 transition hover:bg-neutral-900"
            title="Menu"
            onClick={() => setIsMenuOpen((v) => !v)}
          >
            {isMenuOpen ? <X size={22} strokeWidth={1.8} /> : <Menu size={22} strokeWidth={1.8} />}
          </button>

          <button className="brand-logo text-2xl text-heading" onClick={() => navigate('/')}>
            Mealora
          </button>

          <div className="flex items-center gap-1">
            <button
              className="relative rounded-full p-1.5 text-neutral-100 transition hover:bg-neutral-900"
              title="Notifications"
              onClick={() => navigate('/notifications')}
            >
              <Bell size={20} strokeWidth={1.8} />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button
              className="rounded-full p-0.5 transition hover:opacity-80"
              title="Mon profil"
              onClick={() => navigate('/profile')}
            >
              <span className="avatar-gradient flex h-7 w-7 items-center justify-center rounded-full border-2 border-neutral-950 text-xs font-bold text-white">
                {initial}
              </span>
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="border-t border-neutral-800 bg-neutral-950 px-4 py-3 sm:px-6">
            <div className="mx-auto flex max-w-2xl flex-col gap-1">
              {MENU_ITEMS.map((entry) => (
                <button
                  key={entry.label}
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate(entry.path);
                  }}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-neutral-200 transition hover:bg-neutral-900"
                >
                  <entry.icon size={18} strokeWidth={1.8} />
                  {entry.label}
                </button>
              ))}
              {profile?.role === 'creator' && (
                <>
                  <div className="my-1 border-t border-neutral-800" />
                  {CREATOR_NAV_ITEMS.map((entry) => (
                    <button
                      key={entry.path}
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigate(entry.path);
                      }}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-neutral-200 transition hover:bg-neutral-900"
                    >
                      <entry.icon size={18} strokeWidth={1.8} />
                      {entry.label}
                    </button>
                  ))}
                </>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-400 transition hover:bg-neutral-900"
              >
                <LogOut size={18} strokeWidth={1.8} />
                Déconnexion
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Zone de contenu — centrée dans l'espace restant ; quand la barre
          latérale est fermée, cet espace = tout l'écran, donc le contenu se
          retrouve centré au milieu (comportement "workspace"). */}
            <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-28 pt-6 sm:px-6 md:max-w-3xl md:px-8 md:pb-10 md:pt-8 lg:max-w-5xl">
        {children}
      </main>

      {/* Nav basse — mobile uniquement (écrans en dessous de md) */}
           <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-800 bg-neutral-950/95 backdrop-blur md:hidden">
        <div className="relative mx-auto flex h-20 max-w-2xl items-end justify-around px-2 pb-3">
          {TABS.slice(0, 2).map((tab) => {
            const isActive = isActivePath(tab.path);
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`flex flex-col items-center gap-1 px-3 transition ${
                  isActive ? 'text-accent' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <tab.icon size={22} strokeWidth={isActive ? 2 : 1.8} />
                <span className="text-[10px] font-semibold">{tab.label}</span>
              </button>
            );
          })}

             {profile?.role === 'creator' ? (
            <button
              onClick={() => navigate('/my-recipes/new')}
              className="absolute left-1/2 -top-7 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full border-4 border-neutral-950 bg-accent text-white shadow-lg shadow-accent/40 transition hover:bg-accent-dark"
              title="Nouvelle recette"
            >
              <PlusCircle size={26} strokeWidth={2} />
            </button>
          ) : (
            <span className="w-14" />
          )}

          {TABS.slice(2).map((tab) => {
            const isActive = isActivePath(tab.path);
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`flex flex-col items-center gap-1 px-3 transition ${
                  isActive ? 'text-accent' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <tab.icon size={22} strokeWidth={isActive ? 2 : 1.8} />
                <span className="text-[10px] font-semibold">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
      </div>
    </div>
  );
}
