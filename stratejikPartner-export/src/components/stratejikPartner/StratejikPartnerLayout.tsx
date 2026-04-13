import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function StratejikPartnerLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/stratejikpartner');
  };

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3 lg:px-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-white/10">
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center gap-3">
              <img src="/growerdisilogo.svg" alt="Grower" className="w-10 h-10" onError={(e) => { (e.target as HTMLImageElement).src = '/DietCoop Logo.png'; }} />
              <span className="text-[#00ff88] font-bold">×</span>
              <img src="/DietCoop Logo.png" alt="DietCoop" className="w-10 h-10" />
            </div>
            <span className="hidden sm:inline text-white font-semibold">Stratejik Partner</span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors">
            <LogOut size={18} />
            <span className="hidden sm:inline">Çıkış</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className={`fixed lg:static inset-y-0 left-0 z-40 lg:z-0 w-64 bg-dark-card border-r border-white/10 transform transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <nav className="p-4 w-64 space-y-2">
            <Link to="/stratejikpartner/dashboard" onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${location.pathname === '/stratejikpartner/dashboard' ? 'bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/30' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
              <LayoutDashboard size={20} />
              Dashboard
            </Link>
            <Link to="/stratejikpartner/bilgilendirme" onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${location.pathname === '/stratejikpartner/bilgilendirme' ? 'bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/30' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
              Bilgilendirme
            </Link>
          </nav>
        </aside>

        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
