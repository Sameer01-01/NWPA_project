/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "var(--app-bg)",
        surface: "var(--app-surface)",
        surfaceElevated: "var(--app-surface-elevated)",
        primary: "#6366f1",
        secondary: "#06b6d4",
        success: "#10b981",
        error: "#f43f5e",
        warning: "#f59e0b",
        text: "var(--app-text)",
        textMuted: "var(--app-text-muted)",
        border: "var(--app-border)",
      },
      boxShadow: {
        'glow-primary': '0 0 25px -3px rgba(99, 102, 241, 0.35)',
        'glow-secondary': '0 0 25px -3px rgba(6, 182, 212, 0.35)',
        'glow-success': '0 0 25px -3px rgba(16, 185, 129, 0.35)',
        'glow-error': '0 0 25px -3px rgba(244, 63, 94, 0.35)',
      },
    },
  },
  plugins: [],
}
