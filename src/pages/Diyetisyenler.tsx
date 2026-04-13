import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Plus } from 'lucide-react';
import { diyetisyenService } from '@/services/firebase/firestore';
import { Diyetisyen, OdemeDurumu, AktiflikDurumu } from '@/types/diyetisyen';
import { formatDate, isDatePast } from '@/services/utils/dateUtils';
import { mobileAppService } from '@/services/firebase/mobileAppService';

export default function Diyetisyenler() {
  const [diyetisyenler, setDiyetisyenler] = useState<Diyetisyen[]>([]);
  const [filteredDiyetisyenler, setFilteredDiyetisyenler] = useState<Diyetisyen[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [odemeFilter, setOdemeFilter] = useState<OdemeDurumu | 'all'>('all');
  const [aktiflikFilter, setAktiflikFilter] = useState<AktiflikDurumu | 'all'>('all');

  useEffect(() => {
    loadDiyetisyenler();
  }, []);

  useEffect(() => {
    filterDiyetisyenler();
  }, [diyetisyenler, searchTerm, odemeFilter, aktiflikFilter]);

  const loadDiyetisyenler = async () => {
    try {
      const data = await diyetisyenService.getAll();
      
      // Mobil uygulamadan kayıt olan diyetisyenler için diyet planlarını çekerek benzersiz danışan sayısını hesapla
      const now = new Date();
      const baslangicTarihi = new Date(now.getFullYear(), now.getMonth() - 11, 1); // Son 12 ay
      const bitisTarihi = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999); // Bu ayın sonu
      
      // Mobil kayıtlı diyetisyenleri filtrele
      const mobilKayitliDiyetisyenler = data.filter(d => d.mobilUygulamadanKayit || d.kayitYeri === 'mobil');
      
      // Batch processing - paralel istekleri sınırla
      const batchSize = 5; // Cache sayesinde daha fazla paralel istek yapabiliriz
      const batches = [];
      for (let i = 0; i < mobilKayitliDiyetisyenler.length; i += batchSize) {
        batches.push(mobilKayitliDiyetisyenler.slice(i, i + batchSize));
      }
      
      // Her batch'i sırayla işle
      for (const batch of batches) {
        await Promise.all(
          batch.map(async (diyetisyen) => {
            try {
              const mobileUserId = diyetisyen.mobilUygulamaId || diyetisyen.id;
              if (mobileUserId) {
                // Son 12 ay için tüm diyet planlarını çek (cache'den gelebilir)
                const planlar = await mobileAppService.getDiyetPlanlariByAy(
                  mobileUserId,
                  baslangicTarihi,
                  bitisTarihi
                );
                
                // Deneme süresi kontrolü
                let filtreliPlanlar = planlar;
                if (diyetisyen.denemeSuresi?.aktif && diyetisyen.denemeSuresi.bitisTarihi) {
                  const denemeBitis = diyetisyen.denemeSuresi.bitisTarihi.toDate();
                  const denemeSuresiBitti = denemeBitis < now;
                  
                  // Sadece deneme süresi henüz bitmemişse filtre uygula
                  if (!denemeSuresiBitti) {
                    filtreliPlanlar = planlar.filter(p => p.olusturmaTarihi > denemeBitis);
                  }
                }
                
                // Benzersiz danışan sayısı (her danışan için 1 kez)
                const benzersizDanisanlar = new Set(filtreliPlanlar.map(p => p.danisanId));
                const danisanSayisi = benzersizDanisanlar.size;
                
                diyetisyen.aktifDanisanSayisi = danisanSayisi;
              }
            } catch (error) {
              console.warn(`[Diyetisyenler] ${diyetisyen.adSoyad} için mobil uygulamadan diyet planları alınamadı:`, error);
            }
          })
        );
      }
      
      const updatedData = data;
      
      setDiyetisyenler(updatedData);
    } catch (error) {
      console.error('Diyetisyenler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDiyetisyenler = () => {
    let filtered = [...diyetisyenler];

    // Arama filtresi
    if (searchTerm) {
      filtered = filtered.filter(
        (d) =>
          d.adSoyad.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.uyeNumarasi.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ödeme durumu filtresi
    if (odemeFilter !== 'all') {
      filtered = filtered.filter((d) => d.odemeDurumu === odemeFilter);
    }

    // Aktiflik durumu filtresi
    if (aktiflikFilter !== 'all') {
      filtered = filtered.filter((d) => d.aktiflikDurumu === aktiflikFilter);
    }

    setFilteredDiyetisyenler(filtered);
  };

  const getStatusBadge = (diyetisyen: Diyetisyen) => {
    if (diyetisyen.odemeDurumu === 'aktif' && diyetisyen.aktiflikDurumu === 'aktif') {
      return <span className="badge badge-success">Aktif</span>;
    }
    if (diyetisyen.odemeDurumu === 'suresiDolmus' || 
        (diyetisyen.birSonrakiOdemeTarihi && isDatePast(diyetisyen.birSonrakiOdemeTarihi))) {
      return <span className="badge badge-danger">Süresi Dolmuş</span>;
    }
    if (diyetisyen.odemeDurumu === 'beklemede') {
      return <span className="badge badge-warning">Beklemede</span>;
    }
    if (diyetisyen.denemeSuresi?.aktif) {
      return <span className="badge badge-info">Deneme Süresi</span>;
    }
    return <span className="badge badge-danger">Pasif</span>;
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">Diyetisyenler</h1>
        <Link to="/admin/diyetisyenler/yeni" className="btn-primary flex items-center gap-2 w-fit">
          <Plus size={20} />
          Yeni Diyetisyen Ekle
        </Link>
      </div>

      {/* Filtreler ve Arama */}
      <div className="card space-y-4">
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
          
          <div className="flex gap-2">
            <select
              value={odemeFilter}
              onChange={(e) => setOdemeFilter(e.target.value as OdemeDurumu | 'all')}
              className="input min-w-[200px]"
            >
              <option value="all">Tüm Ödeme Durumları</option>
              <option value="aktif">Aktif</option>
              <option value="beklemede">Beklemede</option>
              <option value="suresiDolmus">Süresi Dolmuş</option>
              <option value="deneme">Deneme</option>
            </select>
            
            <select
              value={aktiflikFilter}
              onChange={(e) => setAktiflikFilter(e.target.value as AktiflikDurumu | 'all')}
              className="input min-w-[200px]"
            >
              <option value="all">Tüm Aktiflik Durumları</option>
              <option value="aktif">Aktif</option>
              <option value="pasif">Pasif</option>
              <option value="askiyaAlindi">Askıya Alındı</option>
            </select>
          </div>
        </div>
      </div>

      {/* Diyetisyen Listesi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDiyetisyenler.map((diyetisyen, index) => {
          // ID'yi garantile - önce id, sonra uyeNumarasi, sonra email
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
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1">{diyetisyen.adSoyad}</h3>
                  <p className="text-sm text-dark-text-secondary">{diyetisyen.email}</p>
                </div>
                <div className="ml-4">
                  {getStatusBadge(diyetisyen)}
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-dark-text-secondary">Üye No:</span>
                  <span className="font-semibold text-right">{diyetisyen.uyeNumarasi}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-text-secondary">Danışan Sayısı:</span>
                  <span className="font-semibold text-right">{diyetisyen.aktifDanisanSayisi}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-text-secondary">Danışan Başı Ücret:</span>
                  <span className="font-semibold text-right">{diyetisyen.danisanBasiUcret} ₺</span>
                </div>
                {diyetisyen.birSonrakiOdemeTarihi && (
                  <div className="flex justify-between">
                    <span className="text-dark-text-secondary">Sonraki Ödeme:</span>
                    <span className="font-semibold text-right">
                      {formatDate(diyetisyen.birSonrakiOdemeTarihi)}
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
            {searchTerm || odemeFilter !== 'all' || aktiflikFilter !== 'all'
              ? 'Arama kriterlerinize uygun diyetisyen bulunamadı'
              : 'Henüz diyetisyen kaydı bulunmuyor'}
          </p>
        </div>
      )}
    </div>
  );
}


