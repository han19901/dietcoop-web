import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, CheckCircle, XCircle, Clock, Download, Eye } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { evrakService, aktiviteLogService } from '@/services/firebase/firestore';
import { Evrak, EvrakDurumu, EvrakTipi } from '@/types/evrak';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import ConfirmModal from '@/components/common/ConfirmModal';
import { formatDate } from '@/services/utils/dateUtils';
import { Timestamp } from 'firebase/firestore';
import { sendEvrakReddedildiBildirimi } from '@/services/utils/bildirimUtils';

const EVRAK_TIPLERI: Record<EvrakTipi, string> = {
  mezuniyetBelgesi: 'Mezuniyet Belgesi',
  tcKimlik: 'TC Kimlik',
  vergiLevhası: 'Vergi Levhası',
};

export default function EvrakOnay() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [searchParams] = useSearchParams();
  const [evraklar, setEvraklar] = useState<Evrak[]>([]);
  const [filteredEvraklar, setFilteredEvraklar] = useState<Evrak[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | EvrakDurumu>(
    (searchParams.get('durum') as EvrakDurumu) || 'all'
  );
  const [evrakTipiFilter, setEvrakTipiFilter] = useState<'all' | EvrakTipi>('all');
  const [selectedEvrak, setSelectedEvrak] = useState<Evrak | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'approve' | 'reject'>('approve');
  const [redSebebi, setRedSebebi] = useState('');

  useEffect(() => {
    loadEvraklar();
  }, []);

  useEffect(() => {
    filterEvraklar();
  }, [evraklar, searchTerm, statusFilter, evrakTipiFilter]);

  const loadEvraklar = async () => {
    try {
      const data = await evrakService.getAll();
      setEvraklar(data);
    } catch (error) {
      console.error('Evraklar yüklenirken hata:', error);
      showError('Evraklar yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const filterEvraklar = () => {
    let filtered = [...evraklar];

    if (searchTerm) {
      filtered = filtered.filter(
        (e) =>
          e.diyetisyenAdSoyad.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.diyetisyenEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((e) => e.durum === statusFilter);
    }

    if (evrakTipiFilter !== 'all') {
      filtered = filtered.filter((e) => e.evrakTipi === evrakTipiFilter);
    }

    setFilteredEvraklar(filtered);
  };

  const handleApproveEvrak = async (evrak: Evrak) => {
    if (!user) return;

    try {
      // redSebebi'yi silmek için deleteField kullanılabilir, ama şimdilik sadece güncelleme yapıyoruz
      const updateData: Partial<Evrak> = {
        durum: 'onaylandi' as EvrakDurumu,
        onayTarihi: Timestamp.now(),
        onaylayanAdminId: user.uid,
        onaylayanAdminAd: user.adSoyad || user.email || 'Admin',
      };
      await evrakService.update(evrak.id!, updateData);

      await aktiviteLogService.log(
        user.uid,
        'Evrak Onaylandı',
        `${evrak.diyetisyenAdSoyad} için ${EVRAK_TIPLERI[evrak.evrakTipi]} onaylandı.`,
        evrak.diyetisyenId
      );

      await loadEvraklar();
      showSuccess(`${evrak.diyetisyenAdSoyad} için ${EVRAK_TIPLERI[evrak.evrakTipi]} başarıyla onaylandı.`);
    } catch (error) {
      console.error('Evrak onaylama hatası:', error);
      showError('Evrak onaylanırken bir hata oluştu.');
    } finally {
      setConfirmModalOpen(false);
      setSelectedEvrak(null);
      setRedSebebi('');
    }
  };

  const handleRejectEvrak = async (evrak: Evrak) => {
    if (!user || !redSebebi.trim()) {
      showError('Red sebebi belirtilmelidir');
      return;
    }

    try {
      await evrakService.update(evrak.id!, {
        durum: 'reddedildi' as EvrakDurumu,
        redSebebi: redSebebi.trim(),
        onayTarihi: Timestamp.now(),
        onaylayanAdminId: user.uid,
        onaylayanAdminAd: user.adSoyad || user.email || 'Admin',
      });

      // Bildirim gönder
      try {
        const updatedEvrak = { ...evrak, durum: 'reddedildi' as EvrakDurumu, redSebebi: redSebebi.trim() };
        await sendEvrakReddedildiBildirimi(updatedEvrak, redSebebi.trim());
      } catch (error) {
        console.error('Bildirim gönderme hatası:', error);
      }

      await aktiviteLogService.log(
        user.uid,
        'Evrak Reddedildi',
        `${evrak.diyetisyenAdSoyad} için ${EVRAK_TIPLERI[evrak.evrakTipi]} reddedildi. Sebep: ${redSebebi}`,
        evrak.diyetisyenId
      );

      await loadEvraklar();
      showSuccess(`${evrak.diyetisyenAdSoyad} için ${EVRAK_TIPLERI[evrak.evrakTipi]} reddedildi.`);
    } catch (error) {
      console.error('Evrak reddetme hatası:', error);
      showError('Evrak reddedilirken bir hata oluştu.');
    } finally {
      setConfirmModalOpen(false);
      setSelectedEvrak(null);
      setRedSebebi('');
    }
  };

  const openConfirmModal = (evrak: Evrak, type: 'approve' | 'reject') => {
    setSelectedEvrak(evrak);
    setModalType(type);
    setConfirmModalOpen(true);
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
      <h1 className="text-3xl font-bold">Evrak Onay</h1>

      {/* Filtreler */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-text-secondary" size={20} />
            <input
              type="text"
              placeholder="Diyetisyen adı veya email ile ara..."
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
            <option value="reddedildi">Reddedildi</option>
          </select>

          <select
            value={evrakTipiFilter}
            onChange={(e) => setEvrakTipiFilter(e.target.value as any)}
            className="input"
          >
            <option value="all">Tüm Evrak Tipleri</option>
            <option value="mezuniyetBelgesi">Mezuniyet Belgesi</option>
            <option value="tcKimlik">TC Kimlik</option>
            <option value="vergiLevhası">Vergi Levhası</option>
          </select>
        </div>
      </div>

      {/* Evrak Listesi */}
      <div className="space-y-4">
        {filteredEvraklar.map((evrak, index) => (
          <motion.div
            key={evrak.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="card"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-bold">{evrak.diyetisyenAdSoyad}</h3>
                    <p className="text-sm text-dark-text-secondary">{evrak.diyetisyenEmail}</p>
                    <p className="text-sm text-dark-text-secondary mt-1">
                      Evrak Tipi: <span className="font-semibold">{EVRAK_TIPLERI[evrak.evrakTipi]}</span>
                    </p>
                  </div>
                  <span
                    className={`badge ${
                      evrak.durum === 'onaylandi'
                        ? 'badge-success'
                        : evrak.durum === 'beklemede'
                        ? 'badge-warning'
                        : 'badge-danger'
                    }`}
                  >
                    {evrak.durum === 'onaylandi' ? (
                      <>
                        <CheckCircle size={14} className="inline mr-1" />
                        Onaylandı
                      </>
                    ) : evrak.durum === 'beklemede' ? (
                      <>
                        <Clock size={14} className="inline mr-1" />
                        Beklemede
                      </>
                    ) : (
                      <>
                        <XCircle size={14} className="inline mr-1" />
                        Reddedildi
                      </>
                    )}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                  <div>
                    <span className="text-dark-text-secondary">Dosya Adı:</span>
                    <p className="font-semibold">{evrak.dosyaAdi}</p>
                  </div>
                  <div>
                    <span className="text-dark-text-secondary">Format:</span>
                    <p className="font-semibold">{evrak.dosyaFormat.toUpperCase()}</p>
                  </div>
                  <div>
                    <span className="text-dark-text-secondary">Boyut:</span>
                    <p className="font-semibold">{(evrak.dosyaBoyutu / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <div>
                    <span className="text-dark-text-secondary">Yüklenme Tarihi:</span>
                    <p className="font-semibold">{formatDate(evrak.yuklemeTarihi)}</p>
                  </div>
                </div>

                {evrak.redSebebi && (
                  <div className="mt-4 p-3 bg-accent-red bg-opacity-10 border border-accent-red border-opacity-30 rounded-lg">
                    <p className="text-sm text-accent-red font-semibold mb-1">Red Sebebi:</p>
                    <p className="text-sm text-dark-text">{evrak.redSebebi}</p>
                  </div>
                )}

                {evrak.onayTarihi && (
                  <div className="mt-2 text-sm">
                    <span className="text-dark-text-secondary">Onay Tarihi: </span>
                    <span className="font-semibold">{formatDate(evrak.onayTarihi)}</span>
                    {evrak.onaylayanAdminAd && (
                      <span className="text-dark-text-secondary ml-2">
                        (Onaylayan: {evrak.onaylayanAdminAd})
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <a
                  href={evrak.dosyaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex items-center gap-2"
                >
                  <Eye size={18} />
                  Görüntüle
                </a>
                <a
                  href={evrak.dosyaUrl}
                  download
                  className="btn-secondary flex items-center gap-2"
                >
                  <Download size={18} />
                  İndir
                </a>
                {evrak.durum === 'beklemede' && (
                  <>
                    <button
                      onClick={() => openConfirmModal(evrak, 'approve')}
                      className="btn-primary flex items-center gap-2"
                    >
                      <CheckCircle size={18} />
                      Onayla
                    </button>
                    <button
                      onClick={() => openConfirmModal(evrak, 'reject')}
                      className="btn-danger flex items-center gap-2"
                    >
                      <XCircle size={18} />
                      Reddet
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredEvraklar.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-dark-text-secondary text-lg">
            {searchTerm || statusFilter !== 'all' || evrakTipiFilter !== 'all'
              ? 'Arama kriterlerinize uygun evrak bulunamadı'
              : 'Henüz evrak kaydı bulunmuyor'}
          </p>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => {
          setConfirmModalOpen(false);
          setSelectedEvrak(null);
          setRedSebebi('');
        }}
        onConfirm={() => {
          if (selectedEvrak && modalType === 'approve') {
            handleApproveEvrak(selectedEvrak);
          } else if (selectedEvrak && modalType === 'reject') {
            handleRejectEvrak(selectedEvrak);
          }
        }}
        title={modalType === 'approve' ? 'Evrakı Onayla' : 'Evrakı Reddet'}
        message={
          modalType === 'approve'
            ? `${selectedEvrak?.diyetisyenAdSoyad} için ${selectedEvrak ? EVRAK_TIPLERI[selectedEvrak.evrakTipi] : ''} evrakını onaylamak istediğinizden emin misiniz?`
            : `${selectedEvrak?.diyetisyenAdSoyad} için ${selectedEvrak ? EVRAK_TIPLERI[selectedEvrak.evrakTipi] : ''} evrakını reddetmek istediğinizden emin misiniz? Red sebebi belirtilmelidir.`
        }
        confirmText={modalType === 'approve' ? 'Onayla' : 'Reddet'}
        cancelText="Vazgeç"
        type={modalType === 'approve' ? 'info' : 'danger'}
      >
        {modalType === 'reject' && (
          <div className="mt-4">
            <label className="label">Red Sebebi *</label>
            <textarea
              value={redSebebi}
              onChange={(e) => setRedSebebi(e.target.value)}
              className="input"
              placeholder="Evrakın neden reddedildiğini belirtiniz..."
              rows={3}
            />
          </div>
        )}
      </ConfirmModal>
    </div>
  );
}
