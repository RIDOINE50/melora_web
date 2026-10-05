import { useState } from 'react';
import { Salad } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { updateFoodPreferences } from '../lib/authApi';
import { getErrorMessage } from '../lib/errors';
import { useToast } from './Toast';

const DIETARY_OPTIONS = [
  'Végétarien',
  'Végan',
  'Sans gluten',
  'Sans lactose',
  'Halal',
  'Casher',
  'Faible en glucides',
];

const COOKING_LEVELS = [
  { value: 'debutant', label: 'Débutant' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'avance', label: 'Avancé' },
];

const inputClasses =
  'w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-neutral-100 outline-none focus:border-neutral-600';
const labelClasses = 'mb-1.5 block text-xs font-semibold text-neutral-400';

function toCsv(list: string[] | null): string {
  return (list ?? []).join(', ');
}

function fromCsv(value: string): string[] {
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * Préférences alimentaires (§10 du cahier des charges côté mobile) —
 * absent de la version web jusqu'ici alors que c'est une section
 * centrale du profil sur mobile.
 */
export default function FoodPreferencesCard() {
  const { profile, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [dietary, setDietary] = useState<string[]>(profile?.dietary_preferences ?? []);
  const [preferredFoods, setPreferredFoods] = useState(toCsv(profile?.preferred_foods ?? null));
  const [avoidedFoods, setAvoidedFoods] = useState(toCsv(profile?.avoided_foods ?? null));
  const [cuisinePreferences, setCuisinePreferences] = useState(toCsv(profile?.cuisine_preferences ?? null));
  const [cookingLevel, setCookingLevel] = useState(profile?.cooking_level ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleDietary(option: string) {
    setDietary((prev) => (prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]));
  }

  async function handleSave() {
    setError(null);
    setIsSaving(true);
    try {
      await updateFoodPreferences({
        dietaryPreferences: dietary,
        preferredFoods: fromCsv(preferredFoods),
        avoidedFoods: fromCsv(avoidedFoods),
        cuisinePreferences: fromCsv(cuisinePreferences),
        cookingLevel: cookingLevel || null,
      });
      await refreshProfile();
      showToast('Préférences alimentaires enregistrées.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mb-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6 sm:p-8">
      <div className="mb-5 flex items-center gap-2">
        <Salad size={18} strokeWidth={2} className="text-accent" />
        <h2 className="text-sm font-bold text-heading">Préférences alimentaires</h2>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-900 bg-red-950/40 px-3 py-2.5 text-[13px] text-red-400">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className={labelClasses}>Régime alimentaire</label>
        <div className="flex flex-wrap gap-2">
          {DIETARY_OPTIONS.map((option) => {
            const isActive = dietary.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggleDietary(option)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="preferredFoods" className={labelClasses}>
            Aliments préférés
          </label>
          <input
            id="preferredFoods"
            type="text"
            value={preferredFoods}
            onChange={(e) => setPreferredFoods(e.target.value)}
            placeholder="Poulet, riz, avocat…"
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="avoidedFoods" className={labelClasses}>
            Aliments à éviter (allergies…)
          </label>
          <input
            id="avoidedFoods"
            type="text"
            value={avoidedFoods}
            onChange={(e) => setAvoidedFoods(e.target.value)}
            placeholder="Arachides, fruits de mer…"
            className={inputClasses}
          />
        </div>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cuisinePreferences" className={labelClasses}>
            Cuisines préférées
          </label>
          <input
            id="cuisinePreferences"
            type="text"
            value={cuisinePreferences}
            onChange={(e) => setCuisinePreferences(e.target.value)}
            placeholder="Africaine, italienne, asiatique…"
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="cookingLevel" className={labelClasses}>
            Niveau en cuisine
          </label>
          <select
            id="cookingLevel"
            value={cookingLevel}
            onChange={(e) => setCookingLevel(e.target.value)}
            className={inputClasses}
          >
            <option value="">Non renseigné</option>
            {COOKING_LEVELS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-white transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? 'Enregistrement…' : 'Enregistrer mes préférences'}
      </button>
    </div>
  );
}
