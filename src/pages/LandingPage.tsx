import { Link } from 'react-router-dom';
import { UtensilsCrossed, Heart, Users, CalendarDays, ShoppingBasket, Salad } from 'lucide-react';

const features = [
  { icon: UtensilsCrossed, title: 'Des recettes qui donnent faim', text: 'Découvre des recettes publiées par des créateurs passionnés.' },
  { icon: Heart, title: 'Favoris & likes', text: 'Enregistre tes recettes préférées et retrouve-les en un clin d\'œil.' },
  { icon: Salad, title: 'Infos nutritionnelles', text: 'Calories, protéines, glucides, lipides… suis ce que tu manges.' },
  { icon: CalendarDays, title: 'Planning de repas', text: 'Organise ta semaine et ne te demande plus quoi cuisiner.' },
  { icon: ShoppingBasket, title: 'Liste de courses', text: 'Génère ta liste de courses à partir de ton planning.' },
  { icon: Users, title: 'Suis tes créateurs préférés', text: 'Abonne-toi et reçois leurs nouvelles recettes.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 text-lg font-extrabold">
            <UtensilsCrossed size={22} className="text-accent" />
            Mealora
          </div>
          <nav className="flex items-center gap-3">
            <Link to="/login" className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-semibold text-neutral-100 transition hover:bg-neutral-900">
              Se connecter
            </Link>
            <Link to="/register" className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white transition hover:bg-accent-dark">
              S'inscrire
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <p className="mb-4 inline-block rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Recettes · Nutrition · Créateurs
        </p>
        <h1 className="mb-5 text-4xl font-extrabold leading-tight sm:text-5xl">
          Découvre, cuisine et partage<span className="text-accent"> des recettes </span>avec une communauté de passionnés.
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-[15px] leading-relaxed text-neutral-400">
          Mealora réunit recettes, conseils nutritionnels et créateurs culinaires au même endroit.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/register" className="rounded-lg bg-accent px-6 py-3 text-sm font-bold text-white transition hover:bg-accent-dark">
            Créer un compte gratuit
          </Link>
          <Link to="/login" className="rounded-lg border border-neutral-700 px-6 py-3 text-sm font-semibold text-neutral-100 transition hover:bg-neutral-900">
            J'ai déjà un compte
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="mb-2 text-center text-2xl font-extrabold">Tout ce que Mealora peut faire pour toi</h2>
        <p className="mb-10 text-center text-sm text-neutral-400">Une seule app pour cuisiner, organiser et partager.</p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 transition hover:border-neutral-700">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-950 text-accent">
                <Icon size={20} strokeWidth={1.8} />
              </div>
              <h3 className="mb-1.5 text-[15px] font-bold text-neutral-100">{title}</h3>
              <p className="text-[13px] leading-relaxed text-neutral-400">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-20 text-center">
        <div className="rounded-3xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-10">
          <h2 className="mb-3 text-2xl font-extrabold">Prêt à cuisiner avec Mealora ?</h2>
          <p className="mb-6 text-sm text-neutral-400">Rejoins la communauté et partage tes recettes dès aujourd'hui.</p>
          <Link to="/register" className="inline-block rounded-lg bg-accent px-6 py-3 text-sm font-bold text-white transition hover:bg-accent-dark">
            Commencer maintenant
          </Link>
        </div>
      </section>

      <footer className="border-t border-neutral-800 py-6 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} Mealora — Tous droits réservés.
      </footer>
    </div>
  );
}