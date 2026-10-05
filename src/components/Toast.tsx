import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface ToastEntry {
  id: number;
  message: string;
  variant: 'success' | 'error';
}

interface ToastContextValue {
  showToast: (message: string, variant?: 'success' | 'error') => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let nextId = 1;

/**
 * Petites notifications éphémères (coin bas-droit) pour confirmer
 * visuellement une action réussie (ajout au plan de repas, à la liste de
 * courses, publication d'une recette…) — sans ça ces actions se
 * terminent par une redirection silencieuse, peu rassurante en démo.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const showToast = useCallback((message: string, variant: 'success' | 'error' = 'success') => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg animate-toast-in ${
              t.variant === 'success'
                ? 'border-green-900 bg-neutral-900 text-green-400'
                : 'border-red-900 bg-neutral-900 text-red-400'
            }`}
          >
            {t.variant === 'success' ? (
              <CheckCircle2 size={18} strokeWidth={2} />
            ) : (
              <XCircle size={18} strokeWidth={2} />
            )}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast doit être utilisé dans un <ToastProvider>');
  return ctx;
}
