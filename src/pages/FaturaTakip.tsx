import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Calendar, AlertCircle, RefreshCw, Clock } from 'lucide-react';
import { faturaService, diyetisyenService } from '@/services/firebase/firestore';
import { createFaturalarForAllDiyetisyenler } from '@/services/fatura/faturaOlusturmaService';
import { Fatura } from '@/types/fatura';
import { Diyetisyen } from '@/types/diyetisyen';
import { useToast } from '@/context/ToastContext';
import { getAyTarihleri } from '@/services/utils/faturaUtils';

interface DiyetisyenFaturaDurumu {
  diyetisyen: Diyetisyen;
  faturalar: Map<string, Fatura | null>; // Key: "yil-ay", Value: Fatura veya null
  eksikFaturalar: Array<{ yil: number; ay: number }>;
}

const ayIsimleri = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

export default function FaturaTakip() {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [diyetisyenler, setDiyetisyenler] = useState<Diyetisyen[]>([]);
  const [faturalar, setFaturalar] = useState<Fatura[]>([]);
  const [faturaDurumlari, setFaturaDurumlari] = useState<DiyetisyenFaturaDurumu[]>([]);
  const [creatingFatura, setCreatingFatura] = useState(false);
  const [filterAktif, setFilterAktif] = useState(true);

  useEffect(() => {
    loadData();
  }, [filterAktif]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [diyetisyenlerData, faturalarData] = await Promise.all([
        diyetisyenService.getAll(),
        faturaService.getAll(),
      ]);

      // Filtreleme
      let filteredDiyetisyenler = diyetisyenlerData;
      if (filterAktif) {
        filteredDiyetisyenler = filteredDiyetisyenler.filter(
          d => d.aktiflikDurumu === 'aktif' && d.onayDurumu === 'onaylandi'
        );
      }

      setDiyetisyenler(filteredDiyetisyenler);
      setFaturalar(faturalarData);

      // Fatura durumlarını hesapla
      calculateFaturaDurumlari(filteredDiyetisyenler, faturalarData);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      showError('Veri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const calculateFaturaDurumlari = (diyetisyenler: Diyetisyen[], faturalar: Fatura[]) => {
    const durumlar: DiyetisyenFaturaDurumu[] = [];

    // Son 12 ayı kontrol et
    const now = new Date();
    const kontrolEdilecekAylar: Array<{ yil: number; ay: number }> = [];
    
    for (let i = 11; i >= 0; i--) {
      const tarih = new Date(now.getFullYear(), now.getMonth() - i, 1);
      kontrolEdilecekAylar.push({
        yil: tarih.getFullYear(),
        ay: tarih.getMonth() + 1,
      });
    }

    diyetisyenler.forEach(diyetisyen => {
      const faturalarMap = new Map<string, Fatura | null>();
      const eksikFaturalar: Array<{ yil: number; ay: number }> = [];

      kontrolEdilecekAylar.forEach(({ yil, ay }) => {
        const key = `${yil}-${ay}`;
        
        // Bu diyetisyen için bu ayın faturası var mı?
        const fatura = faturalar.find(
          f => f.diyetisyenId === diyetisyen.id && 
               f.faturaDonemi.yil === yil && 
               f.faturaDonemi.ay === ay
        );

        if (fatura) {
          faturalarMap.set(key, fatura);
        } else {
          // Deneme süresi kontrolü
          let faturaOlusturulabilir = true;
          
          if (diyetisyen.denemeSuresi?.aktif && diyetisyen.denemeSuresi.bitisTarihi) {
            const denemeBitis = diyetisyen.denemeSuresi.bitisTarihi.toDate();
            const { bitis: ayBitis } = getAyTarihleri(yil, ay);
            
            // Deneme süresi ayın sonundan sonra bitiyorsa fatura oluşturulmaz
            if (denemeBitis > ayBitis) {
              faturaOlusturulabilir = false;
            }
          }

          // Oluşturulma tarihi kontrolü
          if (diyetisyen.olusturmaTarihi) {
            const olusturmaTarihi = diyetisyen.olusturmaTarihi.toDate();
            const { baslangic: ayBaslangic } = getAyTarihleri(yil, ay);
            
            // Diyetisyen bu aydan önce kayıt olmuşsa fatura oluşturulabilir
            if (olusturmaTarihi > ayBaslangic) {
              faturaOlusturulabilir = false;
            }
          }

          if (faturaOlusturulabilir) {
            faturalarMap.set(key, null);
            eksikFaturalar.push({ yil, ay });
          }
        }
      });

      durumlar.push({
        diyetisyen,
        faturalar: faturalarMap,
        eksikFaturalar,
      });
    });

    // Eksik faturası olanları önce göster
    durumlar.sort((a, b) => b.eksikFaturalar.length - a.eksikFaturalar.length);

    setFaturaDurumlari(durumlar);
  };

  const handleCreateAllFaturalar = async () => {
    if (!confirm('Tüm diyetisyenler için önceki ayın faturalarını oluşturmak istediğinize emin misiniz?')) {
      return;
    }

    try {
      setCreatingFatura(true);
      const sayi = await createFaturalarForAllDiyetisyenler();
      showSuccess(`${sayi} adet fatura başarıyla oluşturuldu`);
      await loadData();
    } catch (error: any) {
      console.error('Fatura oluşturma hatası:', error);
      showError(error.message || 'Faturalar oluşturulurken bir hata oluştu');
    } finally {
      setCreatingFatura(false);
    }
  };

  const getFaturaDurumIcon = (fatura: Fatura | null) => {
    if (!fatura) {
      return <XCircle className="text-accent-red" size={18} />;
    }

    if (fatura.faturaDurumu === 'odendi') {
      return <CheckCircle className="text-accent-green" size={18} />;
    }

    if (fatura.faturaDurumu === 'gecikmis') {
      return <AlertCircle className="text-accent-red" size={18} />;
    }

    return <Clock className="text-yellow-500" size={18} />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-green"></div>
      </div>
    );
  }

  // Son 12 ay listesi
  const son12Ay: Array<{ yil: number; ay: number; ayAdi: string }> = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const tarih = new Date(now.getFullYear(), now.getMonth() - i, 1);
    son12Ay.push({
      yil: tarih.getFullYear(),
      ay: tarih.getMonth() + 1,
      ayAdi: ayIsimleri[tarih.getMonth()],
    });
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <h1 className="text-3xl font-bold">Fatura Takip Sistemi</h1>
        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filterAktif}
              onChange={(e) => setFilterAktif(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Sadece Aktif Diyetisyenler</span>
          </label>
          <button
            onClick={handleCreateAllFaturalar}
            disabled={creatingFatura}
            className="px-4 py-2 bg-accent-green text-black rounded-lg hover:bg-accent-green/90 
                     disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RefreshCw size={18} className={creatingFatura ? 'animate-spin' : ''} />
            Önceki Ay Faturalarını Oluştur
          </button>
        </div>
      </motion.div>

      {/* Özet Bilgiler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-text-secondary text-sm mb-1">Toplam Diyetisyen</p>
              <p className="text-3xl font-bold">{diyetisyenler.length}</p>
            </div>
            <Calendar className="text-accent-blue" size={24} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-text-secondary text-sm mb-1">Eksik Fatura Sayısı</p>
              <p className="text-3xl font-bold text-accent-red">
                {faturaDurumlari.reduce((toplam, d) => toplam + d.eksikFaturalar.length, 0)}
              </p>
            </div>
            <AlertCircle className="text-accent-red" size={24} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-text-secondary text-sm mb-1">Toplam Fatura</p>
              <p className="text-3xl font-bold text-accent-green">
                {faturalar.length}
              </p>
            </div>
            <CheckCircle className="text-accent-green" size={24} />
          </div>
        </motion.div>
      </div>

      {/* Fatura Durum Tablosu */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card"
      >
        <h2 className="text-xl font-bold mb-4">Diyetisyen Fatura Durumları</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left p-4 sticky left-0 bg-dark-card z-10">Diyetisyen</th>
                {son12Ay.map(({ yil, ay, ayAdi }) => (
                  <th key={`${yil}-${ay}`} className="text-center p-2 min-w-[80px]">
                    <div className="flex flex-col">
                      <span className="text-xs">{ayAdi}</span>
                      <span className="text-xs text-dark-text-secondary">{yil}</span>
                    </div>
                  </th>
                ))}
                <th className="text-center p-4">Eksik</th>
              </tr>
            </thead>
            <tbody>
              {faturaDurumlari.length === 0 ? (
                <tr>
                  <td colSpan={14} className="text-center p-8 text-dark-text-secondary">
                    Diyetisyen bulunamadı
                  </td>
                </tr>
              ) : (
                faturaDurumlari.map((durum) => (
                  <tr key={durum.diyetisyen.id} className="border-b border-dark-border hover:bg-dark-card-hover">
                    <td className="p-4 sticky left-0 bg-dark-card z-10">
                      <div>
                        <p className="font-semibold">{durum.diyetisyen.adSoyad}</p>
                        <p className="text-sm text-dark-text-secondary">{durum.diyetisyen.uyeNumarasi}</p>
                      </div>
                    </td>
                    {son12Ay.map(({ yil, ay }) => {
                      const key = `${yil}-${ay}`;
                      const fatura = durum.faturalar.get(key) ?? null;
                      return (
                        <td key={key} className="p-2 text-center">
                          {getFaturaDurumIcon(fatura)}
                        </td>
                      );
                    })}
                    <td className="p-4 text-center">
                      {durum.eksikFaturalar.length > 0 && (
                        <span className="badge badge-danger">{durum.eksikFaturalar.length}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Açıklama */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card bg-blue-500 bg-opacity-10 border border-blue-500 border-opacity-30"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="text-blue-500 mt-1" size={20} />
          <div>
            <h3 className="font-semibold mb-2">Açıklama</h3>
            <ul className="text-sm text-dark-text-secondary space-y-1">
              <li>• <span className="text-accent-green">Yeşil ✓</span>: Fatura oluşturulmuş ve ödenmiş</li>
              <li>• <span className="text-yellow-500">Sarı ⏰</span>: Fatura oluşturulmuş, ödeme bekleniyor</li>
              <li>• <span className="text-accent-red">Kırmızı ✗</span>: Fatura oluşturulmamış (eksik)</li>
              <li>• Son 12 ayın fatura durumu gösterilmektedir</li>
              <li>• Deneme süresi devam eden diyetisyenler için fatura oluşturulmaz</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
