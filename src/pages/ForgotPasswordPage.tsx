import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordReset } from '../lib/authApi';
import { getErrorMessage } from '../lib/errors';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await sendPasswordReset(email);
      setIsSent(true);
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
          Mot de passe oublié
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-900 bg-red-950/40 px-3 py-2.5 text-[13px] text-red-400">
            {error}
          </div>
        )}
        {isSent && (
          <div className="mb-4 rounded-md border border-green-900 bg-green-950/40 px-3 py-2.5 text-[13px] text-green-400">
            Un e-mail de réinitialisation a été envoyé à {email}. Vérifie ta
            boîte de réception.
          </div>
        )}

        {!isSent && (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-neutral-400">
                Adresse e-mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-100 outline-none focus:border-neutral-600"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-lg bg-accent py-3 text-sm font-bold text-white transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Envoi…' : 'Envoyer le lien de réinitialisation'}
            </button>
          </form>
        )}

        <div className="mt-7 text-center text-[13px] text-neutral-400">
          <Link to="/login" className="font-semibold text-accent hover:text-accent-dark">
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
