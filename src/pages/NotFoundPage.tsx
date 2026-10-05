import { Link } from 'react-router-dom';
import { UtensilsCrossed } from 'lucide-react';

/** Route de secours pour toute URL inconnue — évite l'écran blanc. */
export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-950 p-6 text-center">
      <UtensilsCrossed size={40} strokeWidth={1.3} className="text-neutral-700" />
      <div className="brand-logo text-3xl text-heading">Mealora</div>
      <h1 className="text-lg font-bold text-heading">Page introuvable</h1>
      <p className="max-w-sm text-sm text-neutral-400">
        Cette page n'existe pas ou a été déplacée.
      </p>
      <Link
        to="/"
        className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white transition hover:bg-accent-dark"
      >
        Retour à l'accueil
      </Link>
    </div>
  );
}
