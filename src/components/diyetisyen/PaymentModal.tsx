import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check } from 'lucide-react';
import { Diyetisyen } from '@/types/diyetisyen';
import { odemeService, ayarlarService, aktiviteLogService } from '@/services/firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { createPayment, generatePaymentDescription } from '@/services/utils/paymentUtils';
import { Ayarlar } from '@/types/settings';

interface PaymentModalProps {
  diyetisyen: Diyetisyen;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({ diyetisyen, onClose, onSuccess }: PaymentModalProps) {
  const { user } = useAuth();
  const { showError } = useToast();
  const [ayarlar, setAyarlar] = useState<Ayarlar | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState({ iban: false, aciklama: false });

  useEffect(() => {
    loadAyarlar();
  }, []);

  const loadAyarlar = async () => {
    try {
      const data = await ayarlarService.get();
      setAyarlar(data);
    } catch (error) {
      console.error('Ayarlar yüklenirken hata:', error);
    }
  };

  const handleCreatePayment = async () => {
    if (!user || !ayarlar) return;

    try {
      setLoading(true);
      
      const kdvOrani = ayarlar?.kdvOrani || 20;
      const paymentData = createPayment(diyetisyen, 30, kdvOrani);
      
      // Banka havalesi bilgilerini ekle
      const aciklama = generatePaymentDescription(
        diyetisyen.uyeNumarasi,
        diyetisyen.adSoyad
      );

      const paymentWithBank = {
        ...paymentData,
        bankaHavalesi: {
          iban: ayarlar.bankaHesapBilgileri.iban,
          aliciAdi: ayarlar.bankaHesapBilgileri.aliciAdi,
          aciklama,
        },
      };

      await odemeService.create(paymentWithBank);

      await aktiviteLogService.log(
        user.uid,
        'Ödeme Oluşturuldu',
        `${diyetisyen.adSoyad} için ödeme oluşturuldu`,
        diyetisyen.id
      );

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Ödeme oluşturma hatası:', error);
      showError('Ödeme oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'iban' | 'aciklama') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied({ ...copied, [type]: true });
      setTimeout(() => {
        setCopied({ ...copied, [type]: false });
      }, 2000);
    } catch (error) {
      console.error('Kopyalama hatası:', error);
    }
  };

  if (!ayarlar) {
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
            className="card max-w-2xl w-full"
          >
            <p className="text-center py-8">Ayarlar yükleniyor...</p>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  const kdvOrani = ayarlar?.kdvOrani || 20;
  const { kdvOrani: paymentKdvOrani, toplamTutar, iskontoTutari } = createPayment(diyetisyen, 30, kdvOrani);
  const aciklama = generatePaymentDescription(diyetisyen.uyeNumarasi, diyetisyen.adSoyad);
  
  // İskonto sonrası tutar hesaplama
  const danisanBasiUcret = diyetisyen.danisanBasiUcret || 199;
  const iskontoOrani = diyetisyen.iskontoOrani || 0;
  const danisanBasiIndirim = danisanBasiUcret * (iskontoOrani / 100);
  const iskontoSonrasiTutar = (danisanBasiUcret - danisanBasiIndirim) * diyetisyen.aktifDanisanSayisi;

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
          className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Yeni Ödeme Oluştur</h2>
            <button onClick={onClose} className="text-dark-text-secondary hover:text-dark-text">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Diyetisyen Bilgileri */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Diyetisyen Bilgileri</h3>
              <div className="bg-dark-card-hover rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-dark-text-secondary">Ad Soyad:</span>
                  <span className="font-semibold">{diyetisyen.adSoyad}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-text-secondary">Üye No:</span>
                  <span className="font-semibold">{diyetisyen.uyeNumarasi}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-text-secondary">Danışan Sayısı:</span>
                  <span className="font-semibold">{diyetisyen.aktifDanisanSayisi}</span>
                </div>
              </div>
            </div>

            {/* Ödeme Detayları */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Ödeme Detayları</h3>
              <div className="bg-dark-card-hover rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-dark-text-secondary">Danışan Başı Ücret:</span>
                  <span className="font-semibold">{diyetisyen.danisanBasiUcret} ₺</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-text-secondary">İskonto (%{iskontoOrani}):</span>
                  <span className="font-semibold">-{iskontoTutari.toFixed(2)} ₺</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-text-secondary">İskonto Sonrası Tutar:</span>
                  <span className="font-semibold">{iskontoSonrasiTutar.toFixed(2)} ₺</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-text-secondary">KDV (%{paymentKdvOrani}):</span>
                  <span className="font-semibold">{(iskontoSonrasiTutar * paymentKdvOrani / 100).toFixed(2)} ₺</span>
                </div>
                <div className="flex justify-between text-lg pt-2 border-t border-dark-card">
                  <span className="font-bold">Toplam:</span>
                  <span className="font-bold text-accent-green">{toplamTutar.toFixed(2)} ₺</span>
                </div>
              </div>
            </div>

            {/* Banka Havalesi Bilgileri */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Banka Havalesi Bilgileri</h3>
              <div className="space-y-4">
                <div>
                  <label className="label">IBAN</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={ayarlar.bankaHesapBilgileri.iban}
                      readOnly
                      className="input flex-1"
                    />
                    <button
                      onClick={() => copyToClipboard(ayarlar.bankaHesapBilgileri.iban, 'iban')}
                      className="btn-secondary flex items-center gap-2"
                    >
                      {copied.iban ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label">Alıcı Adı</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={ayarlar.bankaHesapBilgileri.aliciAdi}
                      readOnly
                      className="input flex-1"
                    />
                    <button
                      onClick={() => copyToClipboard(ayarlar.bankaHesapBilgileri.aliciAdi, 'aciklama')}
                      className="btn-secondary flex items-center gap-2"
                    >
                      {copied.aciklama ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label">Açıklama (Kopyalanabilir)</label>
                  <div className="flex gap-2">
                    <textarea
                      value={aciklama}
                      readOnly
                      rows={2}
                      className="input flex-1 resize-none"
                    />
                    <button
                      onClick={() => copyToClipboard(aciklama, 'aciklama')}
                      className="btn-secondary flex items-center gap-2"
                    >
                      {copied.aciklama ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Butonlar */}
            <div className="flex gap-4 pt-4">
              <button onClick={onClose} className="btn-secondary flex-1">
                İptal
              </button>
              <button
                onClick={handleCreatePayment}
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? 'Oluşturuluyor...' : 'Ödeme Oluştur'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


