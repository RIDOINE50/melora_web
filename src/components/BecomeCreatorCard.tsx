import { useState } from 'react';
import { FileText, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { submitCreatorApplication, uploadCreatorDocument, type AccountType } from '../lib/authApi';
import { getErrorMessage } from '../lib/errors';
import { useToast } from './Toast';

const ACCOUNT_TYPES: { value: AccountType; title: string; desc: string }[] = [
  { value: 'cuisine', title: 'Créateur cuisine', desc: 'Je veux publier mes propres recettes.' },
  {
    value: 'nutrition',
    title: 'Créateur nutrition',
    desc: 'Je suis nutritionniste et je veux publier du contenu spécialisé.',
  },
];

const inputClasses =
  'w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-neutral-100 outline-none focus:border-neutral-600';
const labelClasses = 'mb-1.5 block text-xs font-semibold text-neutral-400';

/**
 * Permet à un compte "user" de candidater pour devenir créateur (cuisine)
 * ou créateur nutritionniste (avec justificatif) — sur mobile c'est
 * accessible librement depuis le drawer ; ça n'existait sur le web que
 * pendant l'inscription initiale.
 */
export default function BecomeCreatorCard() {
  const { profile, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [specialty, setSpecialty] = useState<AccountType>('cuisine');
  const [applicationNote, setApplicationNote] = useState('');
  const [document, setDocument] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  if (!profile || profile.role !== 'user') return null;

  if (profile.creator_status === 'pending' || isDone) {
    return (
      <div className="mb-8 flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-6">
        <ShieldCheck size={22} className="shrink-0 text-accent" />
        <div>
          <p className="text-sm font-bold text-heading">Candidature en cours d'examen</p>
          <p className="text-xs text-neutral-400">
            Un administrateur va étudier ta demande de statut créateur. Tu seras notifié dès qu'elle sera traitée.
          </p>
        </div>
      </div>
    );
  }

  function handleDocumentChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setError(null);
    if (file && file.type !== 'application/pdf') {
      setError('Seuls les fichiers PDF sont acceptés.');
      setDocument(null);
      return;
    }
    setDocument(file);
  }

  async function handleSubmit() {
    setError(null);
    if (specialty === 'nutrition' && !document) {
      setError('Un document justificatif (PDF) est obligatoire pour un compte nutritionniste.');
      return;
    }
    setIsSubmitting(true);
    try {
      let documentPath: string | null = null;
      if (document) {
        documentPath = await uploadCreatorDocument(document);
      }
      await submitCreatorApplication({
        specialty,
        applicationNote: applicationNote.trim() || null,
        documentPath,
      });
      await refreshProfile();
      showToast('Candidature envoyée !');
      setIsDone(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mb-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6 sm:p-8">
      <h2 className="mb-1 text-sm font-bold text-heading">Devenir créateur</h2>
      <p className="mb-5 text-xs text-neutral-400">
        Publie tes propres recettes ou du contenu nutrition en candidatant au statut créateur.
      </p>

      {error && (
        <div className="mb-4 rounded-md border border-red-900 bg-red-950/40 px-3 py-2.5 text-[13px] text-red-400">
          {error}
        </div>
      )}

      <div className="mb-4 grid gap-2.5 sm:grid-cols-2">
        {ACCOUNT_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setSpecialty(t.value)}
            className={`rounded-xl border px-4 py-3.5 text-left transition ${
              specialty === t.value
                ? 'border-accent bg-accent/10'
                : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
            }`}
          >
            <div className="text-sm font-bold text-neutral-100">{t.title}</div>
            <div className="text-xs text-neutral-400">{t.desc}</div>
          </button>
        ))}
      </div>

      <div className="mb-4">
        <label className={labelClasses}>
          Document justificatif (PDF){specialty === 'nutrition' ? ' — obligatoire' : ' — facultatif'}
        </label>
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-[1.5px] border-dashed border-neutral-700 bg-neutral-950 px-4 py-5 text-center text-[13px] text-neutral-400">
          <input type="file" accept="application/pdf" onChange={handleDocumentChange} className="hidden" />
          <FileText size={20} strokeWidth={1.5} />
          {document ? (
            <span className="font-semibold text-neutral-100">{document.name}</span>
          ) : (
            <span>Clique pour choisir un fichier PDF</span>
          )}
        </label>
      </div>

      <div className="mb-5">
        <label htmlFor="applicationNote" className={labelClasses}>
          Note pour l'équipe (facultatif)
        </label>
        <textarea
          id="applicationNote"
          value={applicationNote}
          onChange={(e) => setApplicationNote(e.target.value)}
          placeholder="Parle-nous brièvement de ton expérience…"
          className={`${inputClasses} min-h-[70px] resize-y`}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-white transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Envoi…' : 'Envoyer ma candidature'}
      </button>
    </div>
  );
}
