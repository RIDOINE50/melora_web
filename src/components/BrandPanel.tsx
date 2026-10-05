import { CakeSlice, Salad, UtensilsCrossed } from 'lucide-react';

/**
 * Panneau de présentation affiché à côté des formulaires d'authentification
 * (connexion / inscription). Thème sombre, cohérent avec le reste de
 * l'application (le saut clair → sombre juste après connexion donnait une
 * impression de site "pas fini"). Caché sous 1024px.
 */
export default function BrandPanel() {
  return (
    <div className="hidden flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-950 to-black p-12 lg:flex">
      <div className="max-w-md text-center">
        <div className="brand-logo mb-3 text-6xl text-white">Mealora</div>
        <p className="mb-10 text-[15px] leading-relaxed text-neutral-400">
          Découvre, cuisine et partage des recettes avec une communauté de
          passionnés — et suis les conseils de vrais nutritionnistes.
        </p>

        <div className="relative mx-auto h-72 max-w-xs">
          <div className="absolute left-2 top-0 w-48 -rotate-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-3 shadow-2xl">
            <div className="mb-2 flex items-center gap-1.5">
              <span className="avatar-gradient flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white">
                A
              </span>
              <span className="h-1.5 w-16 rounded bg-neutral-700" />
            </div>
            <div className="flex aspect-square items-center justify-center rounded-lg bg-gradient-to-br from-neutral-800 to-neutral-950">
              <UtensilsCrossed size={34} strokeWidth={1.5} className="text-accent" />
            </div>
            <div className="mt-2 flex gap-3 text-neutral-500">
              <span className="text-sm">♡</span>
              <span className="text-sm">💬</span>
              <span className="text-sm">↗</span>
            </div>
          </div>

          <div className="absolute right-0 top-16 w-48 rotate-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-4 shadow-2xl">
            <span className="avatar-gradient mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white">
              N
            </span>
            <div className="mx-auto mb-1.5 h-1.5 w-2/3 rounded bg-neutral-700" />
            <div className="mx-auto mb-3 h-1.5 w-1/2 rounded bg-neutral-700" />
            <div className="grid grid-cols-3 gap-1">
              <div className="flex aspect-square items-center justify-center rounded bg-neutral-950 text-neutral-600">
                <Salad size={16} />
              </div>
              <div className="flex aspect-square items-center justify-center rounded bg-neutral-950 text-neutral-600">
                <CakeSlice size={16} />
              </div>
              <div className="flex aspect-square items-center justify-center rounded bg-neutral-950 text-neutral-600">
                <UtensilsCrossed size={16} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
