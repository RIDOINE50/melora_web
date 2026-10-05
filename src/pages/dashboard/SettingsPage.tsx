import { useState, type FormEvent } from 'react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { useAuth } from '../../contexts/AuthContext';
import { updateProfilePreferences } from '../../lib/authApi';

const inputClasses =
  'w-full rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400 focus:bg-white disabled:text-neutral-400';
const labelClasses = 'mb-1.5 block text-xs font-semibold text-neutral-500';

export default function SettingsPage() {
  const { profile, user, refreshProfile } = useAuth();
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <DashboardShell title="Paramètres">
      <div className="max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-sm font-bold text-neutral-900">Informations du profil</h2>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-600">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2.5 text-[13px] text-green-700">
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
            className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>
      </div>
    </DashboardShell>
  );
}