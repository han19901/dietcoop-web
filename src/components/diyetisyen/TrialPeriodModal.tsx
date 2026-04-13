import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Diyetisyen } from '@/types/diyetisyen';
import { diyetisyenService, aktiviteLogService, ayarlarService } from '@/services/firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Timestamp } from 'firebase/firestore';
import { addDays } from 'date-fns';

interface TrialPeriodModalProps {
  diyetisyen: Diyetisyen;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TrialPeriodModal({ diyetisyen, onClose, onSuccess }: TrialPeriodModalProps) {
  const { user } = useAuth();
  const { showError } = useToast();
  const [gunSayisi, setGunSayisi] = useState<7 | 15 | 30>(15);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAyarlar();
  }, []);

  const loadAyarlar = async () => {
    try {
      const data = await ayarlarService.get();
      if (data?.varsayilanDenemeSuresiGunSayisi) {
        setGunSayisi(data.varsayilanDenemeSuresiGunSayisi);
      }
    } catch (error) {
      console.error('Ayarlar yüklenirken hata:', error);
    }
  };

  const handleStartTrial = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const now = new Date();
      const bitisTarihi = addDays(now, gunSayisi);

      await diyetisyenService.update(diyetisyen.id!, {
        denemeSuresi: {
          aktif: true,
          baslangicTarihi: Timestamp.fromDate(now),
          bitisTarihi: Timestamp.fromDate(bitisTarihi),
          gunSayisi,
        },
        odemeDurumu: 'deneme',
        aktiflikDurumu: 'aktif',
        apiErisimDurumu: 'aktif',
      });

      await aktiviteLogService.log(
        user.uid,
        'Deneme Süresi Başlatıldı',
        `${diyetisyen.adSoyad} için ${gunSayisi} günlük deneme süresi başlatıldı`,
        diyetisyen.id
      );

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Deneme süresi başlatma hatası:', error);
      showError('Deneme süresi başlatılırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="card max-w-md w-full"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Deneme Süresi Başlat</h2>
            <button onClick={onClose} className="text-dark-text-secondary hover:text-dark-text">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="label">Diyetisyen</label>
              <div className="bg-dark-card-hover rounded-lg p-4">
                <p className="font-semibold">{diyetisyen.adSoyad}</p>
                <p className="text-sm text-dark-text-secondary">{diyetisyen.email}</p>
              </div>
            </div>

            <div>
              <label className="label">Deneme Süresi</label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setGunSayisi(7)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    gunSayisi === 7
                      ? 'border-accent-green bg-accent-green bg-opacity-20'
                      : 'border-dark-card-hover bg-dark-card-hover'
                  }`}
                >
                  <p className="font-bold text-lg">7 Gün</p>
                  <p className="text-xs text-dark-text-secondary">1 Hafta</p>
                </button>
                <button
                  onClick={() => setGunSayisi(15)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    gunSayisi === 15
                      ? 'border-accent-green bg-accent-green bg-opacity-20'
                      : 'border-dark-card-hover bg-dark-card-hover'
                  }`}
                >
                  <p className="font-bold text-lg">15 Gün</p>
                </button>
                <button
                  onClick={() => setGunSayisi(30)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    gunSayisi === 30
                      ? 'border-accent-green bg-accent-green bg-opacity-20'
                      : 'border-dark-card-hover bg-dark-card-hover'
                  }`}
                >
                  <p className="font-bold text-lg">30 Gün</p>
                </button>
              </div>
            </div>

            <div className="bg-accent-blue bg-opacity-10 border border-accent-blue border-opacity-30 rounded-lg p-4">
              <p className="text-sm text-dark-text-secondary">
                Deneme süresi başlatıldığında diyetisyen aktif hale gelecek ve API erişimi sağlanacaktır.
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button onClick={onClose} className="btn-secondary flex-1">
                İptal
              </button>
              <button
                onClick={handleStartTrial}
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? 'Başlatılıyor...' : 'Deneme Süresini Başlat'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}



