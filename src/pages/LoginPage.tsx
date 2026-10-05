import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signIn } from '../lib/authApi';
import { getErrorMessage } from '../lib/errors';
import BrandPanel from '../components/BrandPanel';
import GoogleButton from '../components/GoogleButton';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await signIn({ email, password });
      navigate(location.state?.from ?? '/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-neutral-950">
      <BrandPanel />

      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[440px]">
          <div className="brand-logo mb-3 text-center text-[46px] leading-none text-heading">
            Mealora
          </div>
          <div className="mb-8 text-center text-[15px] font-semibold text-neutral-400">
            Connecte-toi à ton compte
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-red-900 bg-red-950/40 px-3 py-2.5 text-[13px] text-red-400">
              {error}
            </div>
          )}

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
            <div className="mb-4">
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-semibold text-neutral-400"
              >
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-100 outline-none focus:border-neutral-600"
              />
              <div className="mt-1.5 text-xs text-neutral-400">
                <Link to="/forgot-password" className="font-semibold text-accent hover:text-accent-dark">
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-lg bg-accent py-3 text-sm font-bold text-white transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs font-semibold text-neutral-500">
            <span className="h-px flex-1 bg-neutral-800" />
            OU
            <span className="h-px flex-1 bg-neutral-800" />
          </div>

          <GoogleButton />

          <div className="mt-7 text-center text-[13px] text-neutral-400">
            Pas encore de compte ?{' '}
            <Link to="/register" className="font-semibold text-accent hover:text-accent-dark">
              Inscris-toi
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
