import { useAuth } from '@/context/AuthContext';
import { LogOut, User } from 'lucide-react';
import { motion } from 'framer-motion';
import BildirimDropdown from './BildirimDropdown';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-dark-card border-b border-dark-card-hover px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img 
            src="/DietCoop Logo.png" 
            alt="DietCoop" 
            className="h-10 w-auto"
          />
          <h1 className="text-xl font-bold text-dark-text">DietCoop</h1>
        </div>
        
        <div className="flex items-center gap-4">
          {user?.rol === 'diyetisyen' && <BildirimDropdown />}
          
          <div className="flex items-center gap-2 text-dark-text-secondary">
            <User size={18} />
            <span className="text-sm">{user?.adSoyad || user?.email}</span>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-dark-card-hover rounded-lg 
                     hover:bg-opacity-80 transition-colors text-dark-text-secondary"
          >
            <LogOut size={18} />
            <span className="text-sm">Çıkış</span>
          </motion.button>
        </div>
      </div>
    </header>
  );
}


