import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, CheckCircle, XCircle, Clock } from 'lucide-react';
import { odemeService, aktiviteLogService, diyetisyenService, eslesmeService } from '@/services/firebase/firestore';
import { mesajService } from '@/services/firebase/mesajService';
import { Odeme } from '@/types/payment';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import ConfirmModal from '@/components/common/ConfirmModal';
import { formatDate } from '@/services/utils/dateUtils';
import { Timestamp } from 'firebase/firestore';

export default function Odemeler() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [odemeler, setOdemeler] = useState<Odeme[]>([]);
  const [filteredOdemeler, setFilteredOdemeler] = useState<Odeme[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'beklemede' | 'onaylandi' | 'iptal'>('all');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedOdeme, setSelectedOdeme] = useState<Odeme | null>(null);

  useEffect(() => {
    loadOdemeler();
  }, []);

  useEffect(() => {
    filterOdemeler();
  }, [odemeler, searchTerm, statusFilter]);

  const loadOdemeler = async () => {
    try {
      const data = await odemeService.getAll();
      setOdemeler(data);
    } catch (error) {
      console.error('Ödemeler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOdemeler = () => {
    let filtered = [...odemeler];

    if (searchTerm) {
      filtered = filtered.filter(
        (o) =>
          o.diyetisyenAdSoyad.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.diyetisyenEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.uyeNumarasi.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((o) => o.odemeDurumu === statusFilter);
    }

    setFilteredOdemeler(filtered);
  };

  const handleApprovePayment = async (odeme: Odeme) => {
    if (!user) return;

    try {
      await odemeService.update(odeme.id!, {
        odemeDurumu: 'onaylandi',
        onayTarihi: Timestamp.now(),
        onaylayanAdmin: user.uid,
        bankaHavalesi: odeme.bankaHavalesi
          ? {
              ...odeme.bankaHavalesi,
              onayTarihi: Timestamp.now(),
            }
          : undefined,
      });

      // Diyetisyen durumunu güncelle
      // Paket hakkını hesapla (ödeme yapılan danışan sayısı)
      const paketHakki = odeme.danisanSayisi || 0;
      
      await diyetisyenService.update(odeme.diyetisyenId, {
        odemeDurumu: 'aktif',
        aktiflikDurumu: 'aktif',
        apiErisimDurumu: 'aktif',
        paketHakki: paketHakki,
        sonOdemeTarihi: Timestamp.now(),
        birSonrakiOdemeTarihi: odeme.donemBitis,
      });

      // Bekleyen eşleşmeleri aktifleştir
      const aktiflestirilenSayi = await eslesmeService.activatePending(
        odeme.diyetisyenId,
        paketHakki
      );

      // Diyetisyene teşekkür mesajı gönder
      try {
        await mesajService.sendMessage(
          odeme.diyetisyenId,
          user.uid,
          'admin',
          user.adSoyad || 'Admin',
          `Teşekkür ederiz ödemeniz için. Ödemeniz onaylandı ve hesabınız aktif edildi.`,
          user.uid
        );
      } catch (error) {
        console.error('Mesaj gönderme hatası:', error);
        // Mesaj gönderme hatası ödeme onayını engellemez
      }

      await aktiviteLogService.log(
        user.uid,
        'Ödeme Onaylandı',
        `${odeme.diyetisyenAdSoyad} için ödeme onaylandı. ${aktiflestirilenSayi} bekleyen eşleşme aktifleştirildi.`,
        odeme.diyetisyenId
      );

      await loadOdemeler();
      
      showSuccess(`${odeme.diyetisyenAdSoyad} için ödeme onaylandı. Diyetisyene teşekkür mesajı gönderildi.`);
    } catch (error) {
      console.error('Ödeme onaylama hatası:', error);
      showError('Ödeme onaylanırken bir hata oluştu');
    }
  };

  const handleCancelPayment = (odeme: Odeme) => {
    setSelectedOdeme(odeme);
    setCancelModalOpen(true);
  };

  const confirmCancelPayment = async () => {
    if (!user || !selectedOdeme) return;

    try {
      await odemeService.update(selectedOdeme.id!, {
        odemeDurumu: 'iptal',
      });

      await aktiviteLogService.log(
        user.uid,
        'Ödeme İptal Edildi',
        `${selectedOdeme.diyetisyenAdSoyad} için ödeme iptal edildi`,
        selectedOdeme.diyetisyenId
      );

      await loadOdemeler();
      showSuccess('Ödeme başarıyla iptal edildi');
    } catch (error) {
      console.error('Ödeme iptal hatası:', error);
      showError('Ödeme iptal edilirken bir hata oluştu');
    } finally {
      setCancelModalOpen(false);
      setSelectedOdeme(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-green"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Ödemeler</h1>

      {/* Filtreler */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-text-secondary" size={20} />
            <input
              type="text"
              placeholder="Diyetisyen adı, email veya üye numarası ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="input"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="beklemede">Beklemede</option>
            <option value="onaylandi">Onaylandı</option>
            <option value="iptal">İptal</option>
          </select>
        </div>
      </div>

      {/* Ödeme Listesi */}
      <div className="space-y-4">
        {filteredOdemeler.map((odeme, index) => (
          <motion.div
            key={odeme.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="card"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-bold">{odeme.diyetisyenAdSoyad}</h3>
                    <p className="text-sm text-dark-text-secondary">{odeme.diyetisyenEmail}</p>
                    <p className="text-sm text-dark-text-secondary">Üye No: {odeme.uyeNumarasi}</p>
                  </div>
                  <span
                    className={`badge ${
                      odeme.odemeDurumu === 'onaylandi'
                        ? 'badge-success'
                        : odeme.odemeDurumu === 'beklemede'
                        ? 'badge-warning'
                        : 'badge-danger'
                    }`}
                  >
                    {odeme.odemeDurumu === 'onaylandi' ? (
                      <>
                        <CheckCircle size={14} className="inline mr-1" />
                        Onaylandı
                      </>
                    ) : odeme.odemeDurumu === 'beklemede' ? (
                      <>
                        <Clock size={14} className="inline mr-1" />
                        Beklemede
                      </>
                    ) : (
                      <>
                        <XCircle size={14} className="inline mr-1" />
                        İptal
                      </>
                    )}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                  <div>
                    <span className="text-dark-text-secondary">Tutar:</span>
                    <p className="font-semibold">{odeme.tutar.toFixed(2)} ₺</p>
                  </div>
                  <div>
                    <span className="text-dark-text-secondary">KDV:</span>
                    <p className="font-semibold">{(odeme.toplamTutar - odeme.tutar).toFixed(2)} ₺</p>
                  </div>
                  <div>
                    <span className="text-dark-text-secondary">Toplam:</span>
                    <p className="font-semibold text-accent-green">{odeme.toplamTutar.toFixed(2)} ₺</p>
                  </div>
                  <div>
                    <span className="text-dark-text-secondary">Danışan Sayısı:</span>
                    <p className="font-semibold">{odeme.danisanSayisi}</p>
                  </div>
                </div>

                {odeme.donemBaslangic && odeme.donemBitis && (
                  <div className="mt-2 text-sm">
                    <span className="text-dark-text-secondary">Dönem: </span>
                    <span className="font-semibold">
                      {formatDate(odeme.donemBaslangic)} - {formatDate(odeme.donemBitis)}
                    </span>
                  </div>
                )}

                <div className="mt-2 text-sm">
                  <span className="text-dark-text-secondary">Oluşturulma: </span>
                  <span className="font-semibold">{formatDate(odeme.olusturmaTarihi)}</span>
                </div>
              </div>

              {odeme.odemeDurumu === 'beklemede' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprovePayment(odeme)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <CheckCircle size={18} />
                    Onayla
                  </button>
                  <button
                    onClick={() => handleCancelPayment(odeme)}
                    className="btn-danger flex items-center gap-2"
                  >
                    <XCircle size={18} />
                    İptal
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {filteredOdemeler.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-dark-text-secondary text-lg">
            {searchTerm || statusFilter !== 'all'
              ? 'Arama kriterlerinize uygun ödeme bulunamadı'
              : 'Henüz ödeme kaydı bulunmuyor'}
          </p>
        </div>
      )}

      <ConfirmModal
        isOpen={cancelModalOpen}
        onClose={() => {
          setCancelModalOpen(false);
          setSelectedOdeme(null);
        }}
        onConfirm={confirmCancelPayment}
        title="Ödemeyi İptal Et"
        message={`${selectedOdeme?.diyetisyenAdSoyad} için ödemeyi iptal etmek istediğinizden emin misiniz?`}
        confirmText="İptal Et"
        cancelText="Vazgeç"
        type="danger"
      />
    </div>
  );
}

