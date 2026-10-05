import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { createRecipe, getCategories, uploadRecipeImage, type Category } from '../lib/dashboardApi';
import { getErrorMessage } from '../lib/errors';
import { useToast } from '../components/Toast';

const inputClasses =
  'w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-neutral-100 outline-none focus:border-neutral-600';
const labelClasses = 'mb-1.5 block text-xs font-semibold text-neutral-400';

/** Espace créateur — création d'une nouvelle recette. */
export default function CreateRecipePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [prepTime, setPrepTime] = useState('');
  const [servings, setServings] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {
        // non bloquant — le champ catégorie reste vide
      });
  }, []);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(status: 'draft' | 'published') {
    setError(null);
    if (!title.trim()) {
      setError('Le nom de la recette est obligatoire.');
      return;
    }
    setIsSaving(true);
    try {
      let imagePath: string | null = null;
      if (imageFile) {
        imagePath = await uploadRecipeImage(imageFile);
      }
      await createRecipe({
        title: title.trim(),
        description: description.trim(),
        categoryId: categoryId ? Number(categoryId) : null,
        imagePath,
        prepTime: prepTime ? Number(prepTime) : null,
        servings: servings ? Number(servings) : null,
        status,
      });
      showToast(status === 'published' ? 'Recette publiée !' : 'Brouillon enregistré.');
      navigate('/my-recipes');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppLayout>
      <h1 className="mb-5 text-2xl font-extrabold text-heading">Créer une recette</h1>

      {error && (
        <div className="mb-5 rounded-md border border-red-900 bg-red-950/40 px-3 py-2.5 text-[13px] text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr,320px]">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <div className="mb-4">
            <label htmlFor="title" className={labelClasses}>
              Nom de la recette
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClasses}
              placeholder="Ex. Pâtes crémeuses au citron"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="description" className={labelClasses}>
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputClasses} min-h-[100px] resize-y`}
              placeholder="Présente ta recette en quelques phrases…"
            />
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className={labelClasses}>
                Catégorie
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={inputClasses}
              >
                <option value="">Aucune</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="prepTime" className={labelClasses}>
                Temps de préparation (min)
              </label>
              <input
                id="prepTime"
                type="number"
                min={0}
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                className={inputClasses}
              />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="servings" className={labelClasses}>
              Nombre de portions
            </label>
            <input
              id="servings"
              type="number"
              min={1}
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              className={inputClasses}
            />
          </div>

          <div className="mb-2">
            <label className={labelClasses}>Image de couverture</label>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-[1.5px] border-dashed border-neutral-700 bg-neutral-950 px-4 py-6 text-center text-[13px] text-neutral-400">
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              <UtensilsCrossed size={22} strokeWidth={1.5} />
              {imageFile ? (
                <span className="font-semibold text-neutral-100">{imageFile.name}</span>
              ) : (
                <span>Clique pour choisir une image</span>
              )}
            </label>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => handleSubmit('draft')}
              disabled={isSaving}
              className="rounded-lg border border-neutral-700 bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-neutral-100 transition hover:bg-neutral-800 disabled:opacity-50"
            >
              Enregistrer comme brouillon
            </button>
            <button
              type="button"
              onClick={() => handleSubmit('published')}
              disabled={isSaving}
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-white transition hover:bg-accent-dark disabled:opacity-50"
            >
              {isSaving ? 'Publication…' : 'Publier la recette'}
            </button>
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Aperçu</p>
          <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
            <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-800 to-neutral-900 text-accent">
              {imagePreview ? (
                <img src={imagePreview} alt="Aperçu" className="h-full w-full object-cover" />
              ) : (
                <UtensilsCrossed size={44} strokeWidth={1.3} />
              )}
            </div>
            <div className="p-4">
              <h3 className="mb-1 text-[15px] font-bold text-neutral-100">
                {title || 'Nom de la recette'}
              </h3>
              <p className="line-clamp-3 text-xs text-neutral-500">
                {description || "La description s'affichera ici."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
