import { useEffect, useState, type FormEvent } from 'react';
import { BadgeCheck, Pencil } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import RecipeCard from '../components/RecipeCard';
import FoodPreferencesCard from '../components/FoodPreferencesCard';
import BecomeCreatorCard from '../components/BecomeCreatorCard';
import { useAuth } from '../contexts/AuthContext';
import { updateProfilePreferences } from '../lib/authApi';
import { getRecipesByAuthor, type RecipeSummary } from '../lib/recipesApi';
import { getErrorMessage } from '../lib/errors';
import { useToast } from '../components/Toast';

const inputClasses =
  'w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-neutral-100 outline-none focus:border-neutral-600 disabled:text-neutral-500';
const labelClasses = 'mb-1.5 block text-xs font-semibold text-neutral-400';

export default function ProfilePage() {
  const { profile, user, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    getRecipesByAuthor(user.id)
      .then((data) => {
        if (isMounted) setRecipes(data);
      })
      .catch(() => {
        // pas bloquant pour l'affichage du profil
      });
    return () => {
      isMounted = false;
    };
  }, [user]);

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
      setIsEditing(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  const roleLabel =
    profile?.role === 'creator'
      ? 'Créateur'
      : profile?.role === 'admin'
        ? 'Administrateur'
        : 'Utilisateur';

  const initial = (profile?.full_name ?? '?').charAt(0).toUpperCase();
  const isVerifiedCreator = profile?.role === 'creator' && !!profile.creator_document_path;

  return (
    <AppLayout>
      <div className="md:max-w-4xl">
      <div className="mb-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6 sm:p-8">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <span className="avatar-gradient flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white sm:h-24 sm:w-24 sm:text-3xl">
            {initial}
          </span>

          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-heading sm:text-2xl">
                {profile?.full_name || 'Mon profil'}
              </h1>
              {isVerifiedCreator && <BadgeCheck size={20} className="fill-accent text-white" />}
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-bold text-accent">
                {roleLabel}
              </span>
              {isVerifiedCreator && (
                <span className="inline-flex items-center rounded-full bg-green-950/50 px-2.5 py-1 text-[11px] font-bold text-green-400">
                  ✓ Vérifié
                </span>
              )}
              <span className="text-sm text-neutral-400">
                <b className="font-bold text-neutral-100">{recipes.length}</b> recette
                {recipes.length !== 1 ? 's' : ''} publiée{recipes.length !== 1 ? 's' : ''}
              </span>
            </div>

            {profile?.bio && <p className="text-sm text-neutral-300">{profile.bio}</p>}
          </div>

          <button
            onClick={() => setIsEditing((v) => !v)}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm font-semibold text-neutral-100 transition hover:bg-neutral-800"
          >
            <Pencil size={16} strokeWidth={2} />
            Modifier
          </button>
        </div>

        {isEditing && (
          <div className="mt-6 border-t border-neutral-800 pt-6">
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
            <form onSubmit={handleSave} className="max-w-md">
              <div className="mb-3.5">
                <label htmlFor="email" className={labelClasses}>
                  E-mail
                </label>
                <input id="email" type="email" value={user?.email ?? ''} disabled className={inputClasses} />
              </div>
              <div className="mb-3.5">
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
              <div className="mb-4">
                <label htmlFor="bio" className={labelClasses}>
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Parle un peu de toi…"
                  className={`${inputClasses} min-h-[70px] resize-y`}
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
        )}
      </div>

      <BecomeCreatorCard />

      <FoodPreferencesCard />

      <h2 className="mb-4 text-lg font-bold text-heading">Mes recettes</h2>

      {recipes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900 py-16 text-center text-sm text-neutral-500">
          {profile?.role === 'creator'
            ? "Tu n'as pas encore publié de recette."
            : 'Deviens créateur pour publier tes propres recettes.'}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {recipes.map((r) => (
            <RecipeCard
              key={r.id}
              id={r.id}
              title={r.title}
              imageUrl={r.imageUrl}
              authorId={user?.id ?? ''}
              authorName={profile?.full_name ?? null}
              likesCount={0}
              isLiked={false}
              isFavorited={false}
            />
          ))}
        </div>
      )}
      </div>
    </AppLayout>
  );
}
