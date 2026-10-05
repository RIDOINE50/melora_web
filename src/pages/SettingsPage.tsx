import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, HelpCircle, Languages, LogOut, Monitor, Moon, Shield, Sun } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { ACCENT_PRESETS, useTheme, type ThemeMode } from '../contexts/ThemeContext';
import { signOut, updateProfilePreferences } from '../lib/authApi';
import { getErrorMessage } from '../lib/errors';
import { useToast } from '../components/Toast';

const inputClasses =
  'w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-neutral-100 outline-none focus:border-neutral-600 disabled:text-neutral-500';
const labelClasses = 'mb-1.5 block text-xs font-semibold text-neutral-400';

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Clair', icon: Sun },
  { value: 'dark', label: 'Sombre', icon: Moon },
  { value: 'system', label: 'Système', icon: Monitor },
];

/** Paramètres — apparence (thème/accent, comme sur mobile), informations du
 * profil, et raccourcis "À propos" / déconnexion. Accessible à tous les
 * comptes (pas seulement les créateurs). */
export default function SettingsPage() {
  const { profile, user, refreshProfile } = useAuth();
  const { theme, accentColor, setTheme, setAccentColor } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsSaving(true);
    try {
      await updateProfilePreferences({ fullName, bio });
      await refreshProfile();
      setMessage('Profil mis à jour.');
      showToast('Profil mis à jour.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  function handleThemeChange(mode: ThemeMode) {
    setTheme(mode);
    showToast(
      mode === 'light' ? 'Thème clair activé.' : mode === 'dark' ? 'Thème sombre activé.' : 'Thème système activé.',
    );
  }

  function handleAccentChange(hex: string) {
    setAccentColor(hex);
    showToast('Couleur d’accent mise à jour.');
  }

  async function handleLogout() {
    await signOut();
    navigate('/login', { replace: true });
  }

  return (
    <AppLayout>
      <div className="max-w-lg">
        <h1 className="mb-5 text-2xl font-extrabold text-heading">Paramètres</h1>

        <div className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="mb-1 text-sm font-bold text-heading">Apparence</h2>
          <p className="mb-5 text-xs text-neutral-400">Choisis le thème et la couleur qui te ressemblent.</p>

          <label className={labelClasses}>Thème</label>
          <div className="mb-5 grid grid-cols-3 gap-2.5">
            {THEME_OPTIONS.map((opt) => {
              const isActive = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleThemeChange(opt.value)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3.5 transition ${
                    isActive
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <opt.icon size={18} strokeWidth={2} />
                  <span className="text-xs font-semibold">{opt.label}</span>
                </button>
              );
            })}
          </div>

          <label className={labelClasses}>Couleur d'accent</label>
          <div className="flex flex-wrap gap-2.5">
            {ACCENT_PRESETS.map((hex) => {
              const isActive = accentColor.toLowerCase() === hex.toLowerCase();
              return (
                <button
                  key={hex}
                  type="button"
                  onClick={() => handleAccentChange(hex)}
                  title={hex}
                  style={{ backgroundColor: hex }}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition ${
                    isActive ? 'border-neutral-100' : 'border-transparent hover:border-neutral-600'
                  }`}
                >
                  {isActive && <Check size={16} strokeWidth={3} className="text-white" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="mb-5 text-sm font-bold text-heading">Informations du profil</h2>

          {error && (
            <div className="mb-4 rounded-md border border-red-900 bg-red-950/40 px-3 py-2.5 text-[13px] text-red-400">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 rounded-md border border-green-900 bg-green-950/40 px-3 py-2.5 text-[13px] text-green-400">
              {message}
            </div>
          )}

          <form onSubmit={handleSave}>
            <div className="mb-4">
              <label htmlFor="email" className={labelClasses}>
                E-mail
              </label>
              <input id="email" type="email" value={user?.email ?? ''} disabled className={inputClasses} />
            </div>
            <div className="mb-4">
              <label htmlFor="fullName" className={labelClasses}>
                Nom complet
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClasses}
              />
            </div>
            <div className="mb-5">
              <label htmlFor="bio" className={labelClasses}>
                Bio
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Parle un peu de toi…"
                className={`${inputClasses} min-h-[90px] resize-y`}
              />
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-white transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </form>
        </div>

        <div className="mb-6 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
          <h2 className="px-6 pt-5 text-sm font-bold text-heading">À propos</h2>
          <div className="mt-3">
            <div className="flex items-center gap-3 px-6 py-3.5 text-sm font-medium text-neutral-500">
              <Languages size={17} strokeWidth={2} />
              <span className="flex-1">Langue</span>
              <span className="text-xs">Français — bientôt disponible</span>
            </div>
            <div className="flex items-center gap-3 px-6 py-3.5 text-sm font-medium text-neutral-500">
              <HelpCircle size={17} strokeWidth={2} />
              <span className="flex-1">Aide et support</span>
              <span className="text-xs">Bientôt disponible</span>
            </div>
            <div className="flex items-center gap-3 px-6 py-3.5 text-sm font-medium text-neutral-500">
              <Shield size={17} strokeWidth={2} />
              <span className="flex-1">Confidentialité</span>
              <span className="text-xs">Bientôt disponible</span>
            </div>
          </div>
          <div className="border-t border-neutral-800 px-6 py-3 text-center text-[11px] font-semibold text-neutral-600">
            Mealora — v0.1
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-900/60 bg-red-950/20 px-4 py-3 text-sm font-bold text-red-400 transition hover:bg-red-950/40"
        >
          <LogOut size={16} strokeWidth={2} />
          Se déconnecter
        </button>
      </div>
    </AppLayout>
  );
}
