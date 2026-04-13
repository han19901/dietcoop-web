import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Calendar,
  Menu,
  X,
  FileText,
  CheckCircle,
  Bell,
  DollarSign,
  FileCheck,
  TrendingDown,
  CreditCard,
  Briefcase,
  UserCheck,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const menuItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/diyetisyenler', icon: Users, label: 'Diyetisyenler' },
  { path: '/admin/faturalar', icon: FileText, label: 'Faturalar' },
  { path: '/admin/finans', icon: DollarSign, label: 'Finans' },
  { path: '/admin/giderler', icon: TrendingDown, label: 'Giderler' },
  { path: '/admin/fatura-takip', icon: FileCheck, label: 'Fatura Takip' },
  { path: '/admin/fatura-merkezi', icon: FileText, label: 'Fatura Merkezi' },
  { path: '/admin/evrak-onay', icon: CheckCircle, label: 'Evrak Onay' },
  { path: '/admin/bildirim-gonder', icon: Bell, label: 'Bildirim Gönder' },
  { path: '/admin/deneme-suresi', icon: Calendar, label: 'Deneme Süresi' },
  { path: '/admin/yasal-onay-loglari', icon: FileText, label: 'Yasal Onay Logları' },
  { path: '/admin/kartvizitler', icon: CreditCard, label: 'Kartvizitler' },
  { path: '/admin/tesekkur-kartlari', icon: Heart, label: 'Teşekkür Kartları' },
  { path: '/admin/ilanlar', icon: Briefcase, label: 'İş İlanları' },
  { path: '/admin/basvurular', icon: UserCheck, label: 'Başvurular' },
  { path: '/admin/ayarlar', icon: Settings, label: 'Ayarlar' },
];

export default function Sidebar() {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-dark-card rounded-lg 
                 border border-dark-card-hover text-dark-text"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {(isMobileOpen || window.innerWidth >= 1024) && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed lg:static inset-y-0 left-0 z-40 w-64 bg-dark-card 
                     border-r border-dark-card-hover pt-16 lg:pt-0 flex-shrink-0"
          >
            <nav className="p-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all 
                             ${
                               isActive
                                 ? 'bg-accent-green bg-opacity-20 text-accent-green border border-accent-green border-opacity-30'
                                 : 'text-dark-text-secondary hover:bg-dark-card-hover hover:text-dark-text'
                             }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
        />
      )}
    </>
  );
}


