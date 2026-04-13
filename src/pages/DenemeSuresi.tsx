import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Search, Clock, Plus, X } from 'lucide-react';
import { diyetisyenService, ayarlarService } from '@/services/firebase/firestore';
import { Diyetisyen } from '@/types/diyetisyen';
import { formatDate, isDatePast } from '@/services/utils/dateUtils';
import { Timestamp } from 'firebase/firestore';
import { addDays } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { aktiviteLogService } from '@/services/firebase/firestore';

export default function DenemeSuresi() {
  const { user } = useAuth();
  const { showError, showWarning } = useToast();
  const [diyetisyenler, setDiyetisyenler] = useState<Diyetisyen[]>([]);
  const [filteredDiyetisyenler, setFilteredDiyetisyenler] = useState<Diyetisyen[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDiyetisyen, setSelectedDiyetisyen] = useState<Diyetisyen | null>(null);
  const [gunSayisi, setGunSayisi] = useState<7 | 15 | 30>(15);
  const [creating, setCreating] = useState(false);
  const [sistemAyarlari, setSistemAyarlari] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterDiyetisyenler();
  }, [diyetisyenler, searchTerm, filter]);

  const loadData = async () => {
    try {
      const [diyetisyenData, ayarlar] = await Promise.all([
        diyetisyenService.getAll(),
        ayarlarService.get(),
      ]);
      setDiyetisyenler(diyetisyenData);
      setSistemAyarlari(ayarlar);
      if (ayarlar?.varsayilanDenemeSuresiGunSayisi) {
        setGunSayisi(ayarlar.varsayilanDenemeSuresiGunSayisi);
      }
    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDiyetisyenler = () => {
    let filtered = diyetisyenler.filter((d) => d.denemeSuresi?.aktif);

    if (searchTerm) {
      filtered = filtered.filter(
        (d) =>
          d.adSoyad.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.uyeNumarasi.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filter === 'active') {
      filtered = filtered.filter(
        (d) => d.denemeSuresi?.bitisTarihi && !isDatePast(d.denemeSuresi.bitisTarihi)
      );
    } else if (filter === 'expired') {
      filtered = filtered.filter(
        (d) => d.denemeSuresi?.bitisTarihi && isDatePast(d.denemeSuresi.bitisTarihi)
      );
    }

    setFilteredDiyetisyenler(filtered);
  };

  const handleCreateTrial = async () => {
    if (!selectedDiyetisyen || !user) return;

    try {
      setCreating(true);
      
      const now = new Date();
      const bitisTarihi = addDays(now, gunSayisi);

      await diyetisyenService.update(selectedDiyetisyen.id!, {
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
        `${selectedDiyetisyen.adSoyad} için ${gunSayisi} günlük deneme süresi başlatıldı`,
        selectedDiyetisyen.id
      );

      await loadData();
      setShowCreateModal(false);
      setSelectedDiyetisyen(null);
    } catch (error) {
      console.error('Deneme süresi başlatma hatası:', error);
      showError('Deneme süresi başlatılırken bir hata oluştu');
    } finally {
      setCreating(false);
    }
  };

  const openCreateModal = () => {
    // Onaylanmış ama deneme süresi olmayan diyetisyenleri göster
    const onaylanmisDiyetisyenler = diyetisyenler.filter(
      d => (d.onayDurumu === 'onaylandi' || !d.onayDurumu) && !d.denemeSuresi?.aktif
    );
    
    if (onaylanmisDiyetisyenler.length === 0) {
      showWarning('Deneme süresi başlatılabilecek onaylanmış diyetisyen bulunamadı');
      return;
    }
    
    setShowCreateModal(true);
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Deneme Süresi Yönetimi</h1>
        <div className="flex gap-2">
          <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
            <Plus size={20} />
            Yeni Deneme Süresi Başlat
          </button>
          <Link to="/admin/diyetisyenler" className="btn-secondary">
            Diyetisyenler
          </Link>
        </div>
      </div>

      {/* Sistem Ayarları Bilgisi */}
      {sistemAyarlari && (
        <div className="card bg-accent-blue bg-opacity-10 border border-accent-blue border-opacity-30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-accent-blue mb-1">Sistem Ayarları</h3>
              <p className="text-sm text-dark-text-secondary">
                Varsayılan Deneme Süresi: <span className="font-semibold">{sistemAyarlari.varsayilanDenemeSuresiGunSayisi} gün</span>
                {' • '}
                Otomatik Deneme Süresi: <span className="font-semibold">{sistemAyarlari.otomatikDenemeSuresiAktif ? 'Aktif' : 'Pasif'}</span>
              </p>
            </div>
            <Link to="/admin/ayarlar" className="btn-secondary text-sm">
              Ayarları Düzenle
            </Link>
          </div>
        </div>
      )}

      {/* Filtreler */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-text-secondary" size={20} />
            <input
              type="text"
              placeholder="İsim, email veya üye numarası ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="input min-w-[200px]"
          >
            <option value="all">Tümü</option>
            <option value="active">Aktif Deneme Süreleri</option>
            <option value="expired">Süresi Dolmuş</option>
          </select>
        </div>
      </div>

      {/* Deneme Süresi Listesi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDiyetisyenler.map((diyetisyen, index) => {
          const isExpired = diyetisyen.denemeSuresi?.bitisTarihi && 
                           isDatePast(diyetisyen.denemeSuresi.bitisTarihi);
          const diyetisyenId = diyetisyen.id || diyetisyen.uyeNumarasi || diyetisyen.email || `unknown-${index}`;
          
          return (
            <motion.div
              key={diyetisyenId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={`/admin/diyetisyenler/${diyetisyenId}`}
                className="card block hover:border-accent-green transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold mb-1">{diyetisyen.adSoyad}</h3>
                    <p className="text-sm text-dark-text-secondary">{diyetisyen.email}</p>
                  </div>
                  <span className={`badge ${isExpired ? 'badge-danger' : 'badge-info'}`}>
                    {isExpired ? 'Süresi Dolmuş' : 'Aktif'}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-dark-text-secondary" />
                    <span className="text-dark-text-secondary">Gün Sayısı:</span>
                    <span className="font-semibold">{diyetisyen.denemeSuresi?.gunSayisi || 0} gün</span>
                  </div>
                  
                  {diyetisyen.denemeSuresi?.baslangicTarihi && (
                    <div className="flex justify-between">
                      <span className="text-dark-text-secondary">Başlangıç:</span>
                      <span className="font-semibold">
                        {formatDate(diyetisyen.denemeSuresi.baslangicTarihi)}
                      </span>
                    </div>
                  )}
                  
                  {diyetisyen.denemeSuresi?.bitisTarihi && (
                    <div className="flex justify-between">
                      <span className="text-dark-text-secondary">Bitiş:</span>
                      <span className={`font-semibold ${isExpired ? 'text-accent-red' : ''}`}>
                        {formatDate(diyetisyen.denemeSuresi.bitisTarihi)}
                        {isExpired && ' (Doldu)'}
                      </span>
                    </div>
                  )}
                  
                  {!isExpired && diyetisyen.denemeSuresi?.bitisTarihi && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-dark-card-hover">
                      <Clock size={14} className="text-dark-text-secondary" />
                      <span className="text-xs text-dark-text-secondary">
                        {Math.ceil(
                          (diyetisyen.denemeSuresi.bitisTarihi.toDate().getTime() - Date.now()) / 
                          (1000 * 60 * 60 * 24)
                        )} gün kaldı
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {filteredDiyetisyenler.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-dark-text-secondary text-lg">
            {searchTerm || filter !== 'all'
              ? 'Arama kriterlerinize uygun deneme süresi bulunamadı'
              : 'Henüz aktif deneme süresi bulunmuyor'}
          </p>
        </div>
      )}

      {/* Yeni Deneme Süresi Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="card max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Yeni Deneme Süresi Başlat</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-dark-text-secondary hover:text-dark-text">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="label">Diyetisyen Seç</label>
                  <select
                    onChange={(e) => {
                      const selected = diyetisyenler.find(d => d.id === e.target.value);
                      setSelectedDiyetisyen(selected || null);
                    }}
                    className="input"
                  >
                    <option value="">Diyetisyen seçin...</option>
                    {diyetisyenler
                      .filter(d => (d.onayDurumu === 'onaylandi' || !d.onayDurumu) && !d.denemeSuresi?.aktif)
                      .map(d => (
                        <option key={d.id} value={d.id}>
                          {d.adSoyad} ({d.email})
                        </option>
                      ))}
                  </select>
                </div>

                {selectedDiyetisyen && (
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
                )}

                <div className="bg-accent-blue bg-opacity-10 border border-accent-blue border-opacity-30 rounded-lg p-4">
                  <p className="text-sm text-dark-text-secondary">
                    Deneme süresi başlatıldığında diyetisyen aktif hale gelecek ve API erişimi sağlanacaktır.
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1">
                    İptal
                  </button>
                  <button
                    onClick={handleCreateTrial}
                    disabled={creating || !selectedDiyetisyen}
                    className="btn-primary flex-1"
                  >
                    {creating ? 'Başlatılıyor...' : 'Deneme Süresini Başlat'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
