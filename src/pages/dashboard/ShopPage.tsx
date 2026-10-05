import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { useAuth } from '../../contexts/AuthContext';

export default function ShopPage() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const initial = (profile?.full_name ?? '?').charAt(0).toUpperCase();
  const isVerified = profile?.role === 'creator' && !!profile.creator_document_path;

  return (
    <DashboardShell title="Boutique">
      <p className="mb-6 max-w-xl text-sm text-neutral-500">
        Voici un aperçu de ton profil public — c'est ce que les autres utilisateurs voient quand
        ils cliquent sur ton nom depuis une de tes recettes.
      </p>

      <div className="mx-auto max-w-md overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="h-24 bg-gradient-to-r from-green-100 to-accent-light" />
        <div className="-mt-10 flex flex-col items-center px-6 pb-6 text-center">
          <span className="avatar-gradient flex h-20 w-20 items-center justify-center rounded-full border-4 border-white text-2xl font-bold text-white">
            {initial}
          </span>
          <h2 className="mt-3 text-lg font-extrabold text-neutral-900">
            {profile?.full_name || 'Ton profil'}
          </h2>
          <div className="mt-2 flex gap-2">
            <span className="inline-flex items-center rounded-full bg-accent-light px-2.5 py-1 text-[11px] font-bold text-accent-dark">
              Créateur
            </span>
            {isVerified && (
              <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-700">
                ✓ Vérifié
              </span>
            )}
          </div>
          {profile?.bio && <p className="mt-3 text-sm text-neutral-600">{profile.bio}</p>}

          <button
            onClick={() => user && navigate(`/creator/${user.id}`)}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-green-700"
          >
            Voir ma boutique
            <ExternalLink size={15} strokeWidth={2} />
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}