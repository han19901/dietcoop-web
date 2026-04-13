import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  User, 
  MessageSquare,
  FileText,
  Upload,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const menuItems = [
  { path: '/diyetisyen/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/diyetisyen/profil', icon: User, label: 'Profil' },
  { path: '/diyetisyen/faturalar', icon: FileText, label: 'Faturalarım' },
  { path: '/diyetisyen/evraklar', icon: Upload, label: 'Evraklar' },
  { path: '/diyetisyen/mesajlar', icon: MessageSquare, label: 'Mesajlar' },
];

export default function DiyetisyenSidebar() {
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




