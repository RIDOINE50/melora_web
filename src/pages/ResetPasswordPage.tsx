import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { updatePassword } from '../lib/authApi';
import { getErrorMessage } from '../lib/errors';

/**
 * Page ouverte depuis le lien reçu par e-mail (resetPasswordForEmail).
 * Supabase place automatiquement une session "recovery" active via le
 * hash de l'URL ; on affiche simplement le formulaire de nouveau
 * mot de passe une fois cette session détectée.
 */
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [isReady, setIsReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setIsReady(true);
      }
    });
    // Au cas où la session recovery est déjà active au montage.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setIsReady(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setIsSubmitting(true);
    try {
      await updatePassword(password);
      setIsDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 1800);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-6 sm:p-10">
      <div className="w-full max-w-[440px]">
        <div className="brand-logo mb-3 text-center text-[46px] leading-none text-heading">
          Mealora
        </div>
        <div className="mb-8 text-center text-[15px] font-semibold text-neutral-400">
          Choisis un nouveau mot de passe
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-900 bg-red-950/40 px-3 py-2.5 text-[13px] text-red-400">
            {error}
          </div>
        )}
        {isDone && (
          <div className="mb-4 rounded-md border border-green-900 bg-green-950/40 px-3 py-2.5 text-[13px] text-green-400">
            Mot de passe mis à jour. Redirection vers la connexion…
          </div>
        )}

        {!isReady && !isDone && (
          <div className="text-xs text-neutral-500">
            Vérification du lien de réinitialisation…
          </div>
        )}

        {isReady && !isDone && (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-neutral-400">
                Nouveau mot de passe
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-100 outline-none focus:border-neutral-600"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="confirmPassword"
                className="mb-1.5 block text-xs font-semibold text-neutral-400"
              >
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-100 outline-none focus:border-neutral-600"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-lg bg-accent py-3 text-sm font-bold text-white transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
