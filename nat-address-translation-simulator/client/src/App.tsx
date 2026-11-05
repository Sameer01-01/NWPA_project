import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Network, Settings, BookOpen, LayoutDashboard } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Simulator from "./pages/Simulator";
import SettingsPage from "./pages/SettingsPage";
import LearnPage from "./pages/LearnPage";

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen w-screen overflow-hidden bg-background text-text">
        {/* Sidebar */}
        <aside className="w-16 md:w-64 glass-panel border-r border-t-0 border-l-0 border-b-0 rounded-none flex flex-col items-center md:items-start transition-all duration-300">
          <div className="p-4 w-full border-b border-white/10 flex items-center justify-center md:justify-start">
            <Network className="w-8 h-8 text-primary" />
            <span className="hidden md:block ml-3 font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              NAT Sim
            </span>
          </div>
          
          <nav className="flex-1 w-full mt-4 flex flex-col gap-2 p-2">
            <NavItem to="/" icon={<LayoutDashboard />} label="Dashboard" />
            <NavItem to="/simulator" icon={<Network />} label="Simulator" />
            <NavItem to="/settings" icon={<Settings />} label="Settings" />
            <NavItem to="/learn" icon={<BookOpen />} label="Learn NAT" />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 relative overflow-hidden flex flex-col">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/simulator" element={<Simulator />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/learn" element={<LearnPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

function NavItem({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) {
  return (
    <Link 
      to={to} 
      className="flex items-center p-3 rounded-lg hover:bg-white/5 transition-colors group"
      title={label}
    >
      <div className="text-textMuted group-hover:text-primary transition-colors">
        {icon}
      </div>
      <span className="hidden md:block ml-3 font-medium text-text/80 group-hover:text-text transition-colors">
        {label}
      </span>
    </Link>
  );
}

export default App;
