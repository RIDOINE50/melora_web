import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import {
  signUp,
  submitCreatorApplication,
  uploadCreatorDocument,
  type AccountType,
} from '../lib/authApi';
import { getErrorMessage } from '../lib/errors';
import BrandPanel from '../components/BrandPanel';
import GoogleButton from '../components/GoogleButton';

type Step = 1 | 2 | 3;

const ACCOUNT_TYPES: {
  value: AccountType;
  title: string;
  desc: string;
}[] = [
  {
    value: 'user',
    title: 'Utilisateur',
    desc: 'Je veux découvrir et enregistrer des recettes.',
  },
  {
    value: 'cuisine',
    title: 'Créateur cuisine',
    desc: 'Je veux publier mes propres recettes.',
  },
  {
    value: 'nutrition',
    title: 'Créateur nutrition',
    desc: 'Je suis nutritionniste et je veux publier du contenu spécialisé.',
  },
];

const inputClasses =
  'w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-100 outline-none focus:border-neutral-600';
const labelClasses = 'mb-1.5 block text-xs font-semibold text-neutral-400';

export default function RegisterPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2
  const [accountType, setAccountType] = useState<AccountType>('user');

  // Step 3 (qualifications)
  const [applicationNote, setApplicationNote] = useState('');
  const [document, setDocument] = useState<File | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);

  const needsQualificationsStep = accountType !== 'user';
  const isNutrition = accountType === 'nutrition';

  function handleDocumentChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setDocumentError(null);
    if (file && file.type !== 'application/pdf') {
      setDocumentError('Seuls les fichiers PDF sont acceptés.');
      setDocument(null);
      return;
    }
    if (file && file.size > 10 * 1024 * 1024) {
      setDocumentError('Le fichier ne doit pas dépasser 10 Mo.');
      setDocument(null);
      return;
    }
    setDocument(file);
  }

  function goToStep2(e: FormEvent) {
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
    setStep(2);
  }

  function goToStep3() {
    setError(null);
    if (needsQualificationsStep) {
      setStep(3);
    } else {
      void finishRegistration({ submitApplication: false });
    }
  }

  function handleQualificationsNext(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (isNutrition && !document) {
      setError(
        'Un document justificatif (PDF) est obligatoire pour un compte nutritionniste.',
      );
      return;
    }
    void finishRegistration({ submitApplication: true });
  }

  function handleSkipQualifications() {
    void finishRegistration({ submitApplication: false });
  }

  async function finishRegistration(opts: { submitApplication: boolean }) {
    setIsSubmitting(true);
    setError(null);
    try {
      await signUp({ email, password, fullName });

      if (opts.submitApplication && needsQualificationsStep) {
        let documentPath: string | null = null;
        if (document) {
          documentPath = await uploadCreatorDocument(document);
        }
        await submitCreatorApplication({
          specialty: accountType,
          applicationNote: applicationNote.trim() || null,
          documentPath,
        });
      }

      navigate('/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
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
            Crée ton compte
          </div>

          <div className="mb-6 flex justify-center gap-1.5">
            <span
              className={`h-1.5 rounded-full transition-all ${step >= 1 ? 'w-5 bg-accent' : 'w-1.5 bg-neutral-700'}`}
            />
            <span
              className={`h-1.5 rounded-full transition-all ${step >= 2 ? 'w-5 bg-accent' : 'w-1.5 bg-neutral-700'}`}
            />
            {needsQualificationsStep && (
              <span
                className={`h-1.5 rounded-full transition-all ${step >= 3 ? 'w-5 bg-accent' : 'w-1.5 bg-neutral-700'}`}
              />
            )}
          </div>

          {error && (
            <div className="mb-3.5 rounded-md border border-red-900 bg-red-950/40 px-3 py-2.5 text-[13px] text-red-400">
              {error}
            </div>
          )}

          {step === 1 && (
            <>
              <form onSubmit={goToStep2}>
                <div className="mb-4">
                  <label htmlFor="fullName" className={labelClasses}>
                    Nom complet
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                    className={inputClasses}
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="email" className={labelClasses}>
                    Adresse e-mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className={inputClasses}
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="password" className={labelClasses}>
                    Mot de passe
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    className={inputClasses}
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="confirmPassword" className={labelClasses}>
                    Confirmer le mot de passe
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    className={inputClasses}
                  />
                </div>
                <button
                  type="submit"
                  className="mt-2 w-full rounded-lg bg-accent py-3 text-sm font-bold text-white transition hover:bg-accent-dark"
                >
                  Continuer
                </button>
              </form>

              <div className="my-6 flex items-center gap-3 text-xs font-semibold text-neutral-500">
                <span className="h-px flex-1 bg-neutral-800" />
                OU
                <span className="h-px flex-1 bg-neutral-800" />
              </div>

              <GoogleButton label="S'inscrire avec Google" />
            </>
          )}

          {step === 2 && (
            <>
              <div className="mb-4 grid gap-2.5">
                {ACCOUNT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setAccountType(t.value)}
                    className={`rounded-xl border px-4 py-3.5 text-left transition ${
                      accountType === t.value
                        ? 'border-accent bg-accent/10'
                        : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                    }`}
                  >
                    <div className="text-sm font-bold text-neutral-100">{t.title}</div>
                    <div className="text-xs text-neutral-400">{t.desc}</div>
                  </button>
                ))}
              </div>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 py-2 text-sm font-semibold text-neutral-100 hover:bg-neutral-800"
                >
                  Retour
                </button>
                <button
                  type="button"
                  onClick={goToStep3}
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-accent py-2 text-sm font-bold text-white transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Création…' : 'Continuer'}
                </button>
              </div>
            </>
          )}

          {step === 3 && needsQualificationsStep && (
            <form onSubmit={handleQualificationsNext}>
              <div className="mb-3.5 text-xs text-neutral-400">
                {isNutrition
                  ? 'Un document justificatif (diplôme, certification…) est obligatoire pour un compte nutritionniste.'
                  : "Un document justificatif est facultatif — tu pourras l'ajouter plus tard depuis ton profil."}
              </div>

              <div className="mb-2.5">
                <label className={labelClasses}>Document justificatif (PDF)</label>
                <label
                  className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-[1.5px] border-dashed px-4 py-5 text-center text-[13px] text-neutral-400 ${
                    isNutrition && !document && documentError
                      ? 'border-red-900 bg-red-950/40'
                      : 'border-neutral-700 bg-neutral-900'
                  }`}
                >
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleDocumentChange}
                    className="hidden"
                  />
                  <FileText size={22} strokeWidth={1.5} />
                  {document ? (
                    <div className="font-semibold text-neutral-100">{document.name}</div>
                  ) : (
                    <div>
                      Clique pour choisir un fichier PDF
                      {isNutrition ? ' (obligatoire)' : ' (facultatif)'}
                    </div>
                  )}
                </label>
                {documentError && (
                  <div className="mt-1 text-xs text-red-400">{documentError}</div>
                )}
              </div>

              <div className="mb-2.5">
                <label htmlFor="note" className={labelClasses}>
                  Note pour l'équipe (facultatif)
                </label>
                <textarea
                  id="note"
                  value={applicationNote}
                  onChange={(e) => setApplicationNote(e.target.value)}
                  placeholder="Parle-nous brièvement de ton expérience…"
                  className={`${inputClasses} min-h-[70px] resize-y`}
                />
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 py-2 text-sm font-semibold text-neutral-100 hover:bg-neutral-800 disabled:opacity-50"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-accent py-2 text-sm font-bold text-white transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Création…' : 'Envoyer ma candidature'}
                </button>
              </div>

              <div className="mt-3.5 text-center">
                <button
                  type="button"
                  onClick={handleSkipQualifications}
                  disabled={isSubmitting}
                  className="text-[13px] font-semibold text-accent disabled:opacity-50"
                >
                  Passer cette étape pour l'instant
                </button>
              </div>
            </form>
          )}

          <div className="mt-7 text-center text-[13px] text-neutral-400">
            Déjà un compte ?{' '}
            <Link to="/login" className="font-semibold text-accent hover:text-accent-dark">
              Connecte-toi
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
