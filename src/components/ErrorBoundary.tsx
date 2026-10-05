import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Filet de sécurité global : sans ça, la moindre exception React non
 * gérée (accès à une propriété undefined, etc.) affiche un écran blanc
 * total sans aucune explication — le pire scénario possible en pleine
 * démo. On affiche à la place un message clair et un bouton pour
 * recharger, et on garde le détail technique en petit pour le débogage.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erreur non gérée :', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-950 p-6 text-center">
          <div className="brand-logo text-4xl text-white">Mealora</div>
          <h1 className="text-lg font-bold text-heading">Un problème est survenu</h1>
          <p className="max-w-sm text-sm text-neutral-400">
            Quelque chose s'est mal passé de notre côté. Essaie de recharger la page ; si le
            problème persiste, reviens à l'accueil.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white transition hover:bg-accent-dark"
            >
              Recharger la page
            </button>
            <button
              onClick={() => {
                this.setState({ error: null });
                window.location.href = '/';
              }}
              className="rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm font-semibold text-neutral-100 transition hover:bg-neutral-800"
            >
              Retour à l'accueil
            </button>
          </div>
          <details className="mt-4 max-w-lg text-left text-[11px] text-neutral-600">
            <summary className="cursor-pointer select-none">Détail technique</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words">{this.state.error.message}</pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}
