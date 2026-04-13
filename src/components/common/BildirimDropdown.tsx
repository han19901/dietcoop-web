import { useEffect, useState, useRef } from 'react';
import { Bell, X, CreditCard, User, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { bildirimService } from '@/services/firebase/bildirimService';
import { Bildirim } from '@/types/bildirim';
import { formatDate } from '@/services/utils/dateUtils';
import { useNavigate } from 'react-router-dom';

export default function BildirimDropdown() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bildirimler, setBildirimler] = useState<Bildirim[]>([]);
  const [okunmamisSayisi, setOkunmamisSayisi] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.uid && user.rol === 'diyetisyen') {
      loadBildirimler();
      const interval = setInterval(loadBildirimler, 30000); // Her 30 saniyede bir güncelle
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadBildirimler = async () => {
    if (!user?.uid) return;

    try {
      const [bildirimlerData, okunmamis] = await Promise.all([
        bildirimService.getByDiyetisyenId(user.uid),
        bildirimService.getOkunmamisSayisi(user.uid),
      ]);

      setBildirimler(bildirimlerData);
      setOkunmamisSayisi(okunmamis);
    } catch (error) {
      console.error('Bildirimler yüklenirken hata:', error);
    }
  };

  const handleBildirimClick = async (bildirim: Bildirim) => {
    if (!bildirim.goruldu) {
      await bildirimService.markAsRead(bildirim.id!, user!.uid);
      await loadBildirimler();
    }

    if (bildirim.link) {
      navigate(bildirim.link);
      setIsOpen(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, bildirimId: string) => {
    e.stopPropagation();
    try {
      await bildirimService.delete(bildirimId);
      await loadBildirimler();
    } catch (error) {
      console.error('Bildirim silinirken hata:', error);
    }
  };

  const getBildirimIcon = (tip: Bildirim['tip']) => {
    switch (tip) {
      case 'profilGuncelleme':
        return <User size={18} className="text-blue-500" />;
      case 'evrakYukleme':
      case 'evrakReddedildi':
        return <Upload size={18} className="text-yellow-500" />;
      case 'faturaOlustu':
      case 'odemeOnaylandi':
        return <CreditCard size={18} className="text-green-500" />;
      default:
        return <Bell size={18} className="text-gray-500" />;
    }
  };

  if (user?.rol !== 'diyetisyen') {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-dark-card-hover transition-colors"
      >
        <Bell size={24} className="text-dark-text" />
        {okunmamisSayisi > 0 && (
          <span className="absolute top-0 right-0 bg-accent-red text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {okunmamisSayisi > 9 ? '9+' : okunmamisSayisi}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-80 bg-dark-card border border-dark-card-hover rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto"
          >
            <div className="p-4 border-b border-dark-card-hover flex items-center justify-between">
              <h3 className="font-bold text-lg">Bildirimler</h3>
              {okunmamisSayisi > 0 && (
                <span className="text-sm text-dark-text-secondary">
                  {okunmamisSayisi} okunmamış
                </span>
              )}
            </div>

            <div className="divide-y divide-dark-card-hover">
              {bildirimler.length === 0 ? (
                <div className="p-8 text-center text-dark-text-secondary">
                  <Bell size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Henüz bildirim yok</p>
                </div>
              ) : (
                bildirimler.map((bildirim) => (
                  <div
                    key={bildirim.id}
                    onClick={() => handleBildirimClick(bildirim)}
                    className={`p-4 cursor-pointer hover:bg-dark-card-hover transition-colors ${
                      !bildirim.goruldu ? 'bg-dark-card-hover bg-opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getBildirimIcon(bildirim.tip)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm">{bildirim.baslik}</h4>
                          {!bildirim.goruldu && (
                            <span className="flex-shrink-0 w-2 h-2 bg-accent-green rounded-full mt-1"></span>
                          )}
                        </div>
                        <p className="text-xs text-dark-text-secondary mt-1 line-clamp-2">
                          {bildirim.mesaj}
                        </p>
                        <p className="text-xs text-dark-text-secondary mt-2">
                          {formatDate(bildirim.olusturmaTarihi)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDelete(e, bildirim.id!)}
                        className="flex-shrink-0 p-1 hover:bg-dark-card-hover rounded transition-colors"
                      >
                        <X size={14} className="text-dark-text-secondary" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
