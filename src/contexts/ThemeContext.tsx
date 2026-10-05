import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { updateAppearance } from '../lib/authApi';

export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'mealora:theme';
const ACCENT_STORAGE_KEY = 'mealora:accent-hex';

/** Palette de 8 couleurs d'accent prédéfinies, comme sur mobile. */
export const ACCENT_PRESETS = [
  '#f97316', // orange (défaut)
  '#ef4444', // rouge
  '#ec4899', // rose
  '#a855f7', // violet
  '#3b82f6', // bleu
  '#14b8a6', // sarcelle
  '#22c55e', // vert
  '#eab308', // ambre
];

interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  accentColor: string;
  setTheme: (mode: ThemeMode) => void;
  setAccentColor: (hex: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function readStoredTheme(): ThemeMode {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    // stockage indisponible — thème sombre par défaut
  }
  return 'dark';
}

function readStoredAccent(): string {
  try {
    return window.localStorage.getItem(ACCENT_STORAGE_KEY) || ACCENT_PRESETS[0];
  } catch {
    return ACCENT_PRESETS[0];
  }
}

function hexToRgbTriplet(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `${r} ${g} ${b}`;
}

function shade(hex: string, amount: number): string {
  const clean = hex.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(clean.substring(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(clean.substring(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(clean.substring(4, 6), 16) + amount));
  return `${r} ${g} ${b}`;
}

function systemPrefersLight(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ?? false;
}

/**
 * Thème (clair/sombre/système) + couleur d'accent — parité avec le
 * sélecteur de thème mobile (`theme_controller.dart`). Appliqué via
 * l'attribut `data-theme` sur `<html>` (voir global.css) et une
 * variable CSS pour l'accent, pour ne toucher à aucun composant
 * existant. Persisté en local (effet immédiat) et sur `profiles`
 * quand l'utilisateur est connecté (suit l'utilisateur d'un appareil
 * à l'autre, comme sur mobile).
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [theme, setThemeState] = useState<ThemeMode>(readStoredTheme);
  const [accentColor, setAccentColorState] = useState<string>(readStoredAccent);

  const resolvedTheme: 'light' | 'dark' = theme === 'system' ? (systemPrefersLight() ? 'light' : 'dark') : theme;

  const applyToDom = useCallback((mode: 'light' | 'dark', hex: string) => {
    if (mode === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    const accentRgb = hexToRgbTriplet(hex);
    const darkRgb = shade(hex, -21);
    document.documentElement.style.setProperty('--color-accent', accentRgb);
    document.documentElement.style.setProperty('--color-accent-dark', darkRgb);
    try {
      window.localStorage.setItem('mealora:accent-rgb', accentRgb);
      window.localStorage.setItem('mealora:accent-dark-rgb', darkRgb);
    } catch {
      // pas bloquant
    }
  }, []);

  // Applique immédiatement à chaque changement (thème, accent, ou
  // préférence système si theme === 'system').
  useEffect(() => {
    applyToDom(resolvedTheme, accentColor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedTheme, accentColor]);

  useEffect(() => {
    if (theme !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: light)');
    const handler = () => applyToDom(mql.matches ? 'light' : 'dark', accentColor);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, accentColor]);

  // Reprend les préférences sauvegardées sur le profil à la connexion
  // (pour retrouver le même thème que sur mobile / un autre appareil).
  useEffect(() => {
    if (!profile) return;
    if (profile.theme_preference && profile.theme_preference !== theme) {
      setThemeState(profile.theme_preference as ThemeMode);
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, profile.theme_preference);
      } catch {
        // pas bloquant
      }
    }
    if (profile.accent_color && profile.accent_color !== accentColor) {
      setAccentColorState(profile.accent_color);
      try {
        window.localStorage.setItem(ACCENT_STORAGE_KEY, profile.accent_color);
      } catch {
        // pas bloquant
      }
    }
    // Ne se déclenche qu'à l'arrivée du profil, pas à chaque re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  function setTheme(mode: ThemeMode) {
    setThemeState(mode);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // pas bloquant
    }
    if (profile) {
      void updateAppearance({ themePreference: mode }).catch(() => {
        // pas bloquant — le thème reste appliqué localement même si la
        // synchronisation avec le profil échoue
      });
    }
  }

  function setAccentColor(hex: string) {
    setAccentColorState(hex);
    try {
      window.localStorage.setItem(ACCENT_STORAGE_KEY, hex);
    } catch {
      // pas bloquant
    }
    if (profile) {
      void updateAppearance({ accentColor: hex }).catch(() => {
        // pas bloquant
      });
    }
  }

  const value = useMemo(
    () => ({ theme, resolvedTheme, accentColor, setTheme, setAccentColor }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme, resolvedTheme, accentColor, profile?.id],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme doit être utilisé dans un <ThemeProvider>');
  return ctx;
}
