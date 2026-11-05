import { create } from 'zustand';

export type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
  } catch (e) {
    console.error('Failed to read theme from localStorage', e);
  }
  return 'dark';
};

const initialTheme = getInitialTheme();

// Apply theme class immediately on script load (before React hydration)
if (typeof document !== 'undefined') {
  if (initialTheme === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }
}

const applyTheme = (theme: Theme) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('theme', theme);
  } catch (e) {
    console.error('Failed to save theme to localStorage', e);
  }
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }
};

export const useThemeStore = create<ThemeState>((set) => ({
  theme: initialTheme,

  toggleTheme: () => {
    set((state) => {
      const next: Theme = state.theme === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      return { theme: next };
    });
  },

  setTheme: (theme: Theme) => {
    applyTheme(theme);
    set({ theme });
  },
}));
