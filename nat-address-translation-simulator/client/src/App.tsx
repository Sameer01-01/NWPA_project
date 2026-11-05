import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { Network, Settings, BookOpen, LayoutDashboard, Sun, Moon } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Simulator from "./pages/Simulator";
import SettingsPage from "./pages/SettingsPage";
import LearnPage from "./pages/LearnPage";
import { useThemeStore } from "./store/useThemeStore";

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`relative flex items-center p-3 rounded-xl transition-all duration-200 group border-l-4 ${
        isActive
          ? "border-primary bg-primary/10 text-primary font-semibold shadow-sm"
          : "border-transparent text-textMuted hover:text-text hover:bg-black/5 dark:hover:bg-white/5"
      }`}
      title={label}
    >
      <div
        className={`transition-transform duration-200 group-hover:scale-110 ${
          isActive ? "text-primary" : "text-textMuted group-hover:text-primary"
        }`}
      >
        {icon}
      </div>
      <span className="hidden md:block ml-3 text-sm tracking-wide">{label}</span>
      {isActive && (
        <span className="hidden md:block ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
      )}
    </Link>
  );
}

function MainLayout() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-text transition-colors duration-200">
      {/* Sidebar */}
      <aside className="w-16 md:w-64 glass-panel border-r border-border border-t-0 border-l-0 border-b-0 rounded-none flex flex-col items-center md:items-start transition-all duration-300 z-30">
        {/* Brand Header */}
        <div className="p-4 w-full border-b border-border flex items-center justify-center md:justify-start gap-3">
          <div className="relative p-2 rounded-xl bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-cyan-500/20 border border-primary/30 shadow-glow-primary">
            <Network className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <div className="hidden md:flex flex-col">
            <span className="font-extrabold text-lg tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400">
              NAT Sim
            </span>
            <span className="text-[10px] text-textMuted font-mono uppercase tracking-widest -mt-0.5">
              Protocol Lab
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 w-full mt-4 flex flex-col gap-1.5 p-2 overflow-y-auto">
          <NavItem to="/" icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" />
          <NavItem to="/simulator" icon={<Network className="w-5 h-5" />} label="Simulator" />
          <NavItem to="/settings" icon={<Settings className="w-5 h-5" />} label="Settings" />
          <NavItem to="/learn" icon={<BookOpen className="w-5 h-5" />} label="Learn NAT" />
        </nav>

        {/* Footer — Theme Toggle */}
        <div className="p-3 w-full border-t border-border mt-auto">
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark/light theme"
            className="w-full flex items-center justify-center md:justify-between p-2.5 rounded-xl border border-border bg-surface hover:bg-surfaceElevated transition-all duration-200 group cursor-pointer shadow-sm hover:shadow-glow-primary"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-black/5 dark:bg-white/10 group-hover:scale-110 transition-transform duration-300">
                {theme === "dark" ? (
                  <Sun className="w-5 h-5 text-amber-400 transition-all duration-300" />
                ) : (
                  <Moon className="w-5 h-5 text-indigo-600 transition-all duration-300" />
                )}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-text">
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </span>
                <span className="text-[10px] text-textMuted font-mono">
                  {theme === "dark" ? "Pure Black UI" : "Clean White UI"}
                </span>
              </div>
            </div>

            {/* Visual pill toggle */}
            <div className="hidden md:flex items-center w-10 h-5 p-0.5 rounded-full bg-black/10 dark:bg-white/10 transition-colors">
              <div
                className={`w-4 h-4 rounded-full bg-gradient-to-r from-primary to-secondary shadow-md transform transition-transform duration-300 ${
                  theme === "dark" ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden flex flex-col bg-background">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/simulator" element={<Simulator />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/learn" element={<LearnPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <MainLayout />
    </BrowserRouter>
  );
}
