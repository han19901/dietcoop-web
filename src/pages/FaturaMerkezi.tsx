import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Users, CheckCircle, XCircle, Clock, RefreshCw, Eye, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { faturaService, diyetisyenService } from '@/services/firebase/firestore';
import { mobileAppService } from '@/services/firebase/mobileAppService';
import { Fatura } from '@/types/fatura';
import { Diyetisyen } from '@/types/diyetisyen';
import { useToast } from '@/context/ToastContext';
import { getAyTarihleri } from '@/services/utils/faturaUtils';

interface AylikDanisanBilgisi {
  yil: number;
  ay: number;
  ayAdi: string;
  danisanSayisi: number;
  fatura: Fatura | null;
  faturaVarMi: boolean;
}

interface DiyetisyenFaturaBilgisi {
  diyetisyen: Diyetisyen;
  aylikBilgiler: AylikDanisanBilgisi[];
  toplamFatura: number;
  toplamDanisan: number;
}

const ayIsimleri = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

export default function FaturaMerkezi() {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(true);
  const [diyetisyenler, setDiyetisyenler] = useState<Diyetisyen[]>([]);
  const [faturaBilgileri, setFaturaBilgileri] = useState<DiyetisyenFaturaBilgisi[]>([]);
  const [selectedDiyetisyen, setSelectedDiyetisyen] = useState<string | 'all'>('all');
  const [filterAktif, setFilterAktif] = useState(true);
  const [refreshing, setRefreshing] = useState<Set<string>>(new Set());
  const [selectedDiyetisyenDetay, setSelectedDiyetisyenDetay] = useState<DiyetisyenFaturaBilgisi | null>(null);
  const [showDiyetisyenModal, setShowDiyetisyenModal] = useState(false);

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

      // Fatura bilgilerini hesapla
      await calculateFaturaBilgileri(filteredDiyetisyenler, faturalarData);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      showError('Veri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const calculateFaturaBilgileri = async (
    diyetisyenler: Diyetisyen[],
    faturalar: Fatura[]
  ) => {
    const now = new Date();
    const bilgiler: DiyetisyenFaturaBilgisi[] = [];

    // Son 12 ay listesi (tüm veriler için)
    const son12Ay: Array<{ yil: number; ay: number; ayAdi: string }> = [];
    for (let i = 11; i >= 0; i--) {
      const tarih = new Date(now.getFullYear(), now.getMonth() - i, 1);
      son12Ay.push({
        yil: tarih.getFullYear(),
        ay: tarih.getMonth() + 1,
        ayAdi: ayIsimleri[tarih.getMonth()],
      });
    }

    // Son 3 ay listesi (toplam hesaplama için)
    const son3AyToplam: Array<{ yil: number; ay: number }> = [];
    for (let i = 2; i >= 0; i--) {
      const tarih = new Date(now.getFullYear(), now.getMonth() - i, 1);
      son3AyToplam.push({
        yil: tarih.getFullYear(),
        ay: tarih.getMonth() + 1,
      });
    }

    for (const diyetisyen of diyetisyenler) {
      const aylikBilgiler: AylikDanisanBilgisi[] = [];
      let toplamFatura = 0;
      let toplamDanisan = 0;

      for (const { yil, ay, ayAdi } of son12Ay) {
        // Bu ay için fatura var mı?
        const fatura = faturalar.find(
          f => f.diyetisyenId === diyetisyen.id &&
               f.faturaDonemi.yil === yil &&
               f.faturaDonemi.ay === ay
        );

        let danisanSayisi = 0;

        if (fatura) {
          // Fatura varsa, faturadan danışan sayısını al
          danisanSayisi = fatura.danisanSayisi || 0;
          // Sadece son 3 ay için toplam hesapla
          const isSon3Ay = son3AyToplam.some(a => a.yil === yil && a.ay === ay);
          if (isSon3Ay) {
            toplamFatura += fatura.toplamTutar || 0;
            toplamDanisan += danisanSayisi;
          }
        } else {
          // Fatura yoksa, mobil uygulamadan çek (sadece mevcut ay ve gelecek aylar için)
          const { baslangic, bitis } = getAyTarihleri(yil, ay);
          const ayBitis = new Date(bitis);
          ayBitis.setHours(23, 59, 59, 999);

          // Sadece mevcut ay ve gelecek aylar için mobil uygulamadan çek
          if (ayBitis >= now) {
            try {
              const planlar = await mobileAppService.getDiyetPlanlariByAy(
                diyetisyen.mobilUygulamaId || diyetisyen.id!,
                baslangic,
                bitis
              );

              // Deneme süresi kontrolü
              // Sadece aktif deneme süresi varsa VE deneme süresi henüz bitmemişse filtre uygula
              let filtreliPlanlar = planlar;
              const now = new Date();
              
              if (diyetisyen.denemeSuresi?.aktif && diyetisyen.denemeSuresi.bitisTarihi) {
                const denemeBitis = diyetisyen.denemeSuresi.bitisTarihi.toDate();
                const denemeSuresiBitti = denemeBitis < now;
                
                // Sadece deneme süresi henüz bitmemişse filtre uygula
                if (!denemeSuresiBitti) {
                  // Deneme süresi içindeki planları filtrele (deneme süresi bitiş tarihinden önce oluşturulan planları çıkar)
                  filtreliPlanlar = planlar.filter(p => p.olusturmaTarihi > denemeBitis);
                }
              }

              // Benzersiz danışan sayısı (her danışan için 1 kez)
              const benzersizDanisanlar = new Set(filtreliPlanlar.map(p => p.danisanId));
              danisanSayisi = benzersizDanisanlar.size;
              
              // Sadece son 3 ay için toplam hesapla (fatura yoksa bile)
              const isSon3Ay = son3AyToplam.some(a => a.yil === yil && a.ay === ay);
              if (isSon3Ay) {
                toplamDanisan += danisanSayisi;
              }
            } catch (error) {
              console.error(`${diyetisyen.adSoyad} için ${ayAdi} ${yil} danışan sayısı alınamadı:`, error);
              danisanSayisi = 0;
            }
          }
        }

        aylikBilgiler.push({
          yil,
          ay,
          ayAdi,
          danisanSayisi,
          fatura: fatura || null,
          faturaVarMi: !!fatura,
        });
      }


      bilgiler.push({
        diyetisyen,
        aylikBilgiler,
        toplamFatura,
        toplamDanisan,
      });
    }

    // Eksik fatura sayısına göre sırala
    bilgiler.sort((a, b) => {
      const aEksik = a.aylikBilgiler.filter(ay => !ay.faturaVarMi && ay.danisanSayisi > 0).length;
      const bEksik = b.aylikBilgiler.filter(ay => !ay.faturaVarMi && ay.danisanSayisi > 0).length;
      return bEksik - aEksik;
    });

    setFaturaBilgileri(bilgiler);
  };

  const refreshDiyetisyenDanisanSayisi = async (diyetisyenId: string, yil: number, ay: number) => {
    try {
      setRefreshing(prev => new Set(prev).add(`${diyetisyenId}-${yil}-${ay}`));
      
      const diyetisyen = diyetisyenler.find(d => d.id === diyetisyenId);
      if (!diyetisyen) return;

      const { baslangic, bitis } = getAyTarihleri(yil, ay);
      const planlar = await mobileAppService.getDiyetPlanlariByAy(
        diyetisyen.mobilUygulamaId || diyetisyenId,
        baslangic,
        bitis
      );

      // Deneme süresi kontrolü
      // Sadece aktif deneme süresi varsa VE deneme süresi henüz bitmemişse filtre uygula
      let filtreliPlanlar = planlar;
      const now = new Date();
      
      if (diyetisyen.denemeSuresi?.aktif && diyetisyen.denemeSuresi.bitisTarihi) {
        const denemeBitis = diyetisyen.denemeSuresi.bitisTarihi.toDate();
        const denemeSuresiBitti = denemeBitis < now;
        
        // Sadece deneme süresi henüz bitmemişse filtre uygula
        if (!denemeSuresiBitti) {
          // Deneme süresi içindeki planları filtrele (deneme süresi bitiş tarihinden önce oluşturulan planları çıkar)
          filtreliPlanlar = planlar.filter(p => p.olusturmaTarihi > denemeBitis);
        }
      }

      const benzersizDanisanlar = new Set(filtreliPlanlar.map(p => p.danisanId));
      const danisanSayisi = benzersizDanisanlar.size;

      // Güncelle
      setFaturaBilgileri(prev => prev.map(bilgi => {
        if (bilgi.diyetisyen.id === diyetisyenId) {
          const updatedAylik = bilgi.aylikBilgiler.map(ayBilgi => {
            if (ayBilgi.yil === yil && ayBilgi.ay === ay) {
              return { ...ayBilgi, danisanSayisi };
            }
            return ayBilgi;
          });
          return { ...bilgi, aylikBilgiler: updatedAylik };
        }
        return bilgi;
      }));

      showSuccess(`${ayIsimleri[ay - 1]} ${yil} için danışan sayısı güncellendi: ${danisanSayisi}`);
    } catch (error) {
      console.error('Danışan sayısı güncelleme hatası:', error);
      showError('Danışan sayısı güncellenirken bir hata oluştu');
    } finally {
      setRefreshing(prev => {
        const newSet = new Set(prev);
        newSet.delete(`${diyetisyenId}-${yil}-${ay}`);
        return newSet;
      });
    }
  };

  const getFaturaDurumIcon = (ayBilgi: AylikDanisanBilgisi) => {
    if (ayBilgi.faturaVarMi) {
      if (ayBilgi.fatura?.faturaDurumu === 'odendi') {
        return <CheckCircle className="text-accent-green" size={18} />;
      }
      if (ayBilgi.fatura?.faturaDurumu === 'gecikmis') {
        return <XCircle className="text-accent-red" size={18} />;
      }
      return <Clock className="text-yellow-500" size={18} />;
    }
    if (ayBilgi.danisanSayisi > 0) {
      return <XCircle className="text-accent-red" size={18} />; // Eksik fatura
    }
    return <span className="text-dark-text-secondary">-</span>; // Danışan yok
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-green"></div>
      </div>
    );
  }

  // Filtreleme
  let filteredBilgiler = faturaBilgileri;
  if (selectedDiyetisyen !== 'all') {
    filteredBilgiler = filteredBilgiler.filter(b => b.diyetisyen.id === selectedDiyetisyen);
  }

  // Son 3 ay listesi (tablo için)
  const now = new Date();
  const son3Ay: Array<{ yil: number; ay: number; ayAdi: string }> = [];
  for (let i = 2; i >= 0; i--) {
    const tarih = new Date(now.getFullYear(), now.getMonth() - i, 1);
    son3Ay.push({
      yil: tarih.getFullYear(),
      ay: tarih.getMonth() + 1,
      ayAdi: ayIsimleri[tarih.getMonth()],
    });
  }

  // Son 12 ay listesi (modal için)
  const son12Ay: Array<{ yil: number; ay: number; ayAdi: string }> = [];
  for (let i = 11; i >= 0; i--) {
    const tarih = new Date(now.getFullYear(), now.getMonth() - i, 1);
    son12Ay.push({
      yil: tarih.getFullYear(),
      ay: tarih.getMonth() + 1,
      ayAdi: ayIsimleri[tarih.getMonth()],
    });
  }

  const handleDiyetisyenClick = (bilgi: DiyetisyenFaturaBilgisi) => {
    setSelectedDiyetisyenDetay(bilgi);
    setShowDiyetisyenModal(true);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <h1 className="text-3xl font-bold">Fatura Merkezi</h1>
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
          <select
            value={selectedDiyetisyen}
            onChange={(e) => setSelectedDiyetisyen(e.target.value as string | 'all')}
            className="px-4 py-2 bg-dark-card border border-dark-border rounded-lg"
          >
            <option value="all">Tüm Diyetisyenler</option>
            {diyetisyenler.map(d => (
              <option key={d.id} value={d.id}>{d.adSoyad}</option>
            ))}
          </select>
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
              <p className="text-3xl font-bold">{filteredBilgiler.length}</p>
            </div>
            <Users className="text-accent-blue" size={24} />
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
              <p className="text-dark-text-secondary text-sm mb-1">Toplam Fatura</p>
              <p className="text-3xl font-bold text-accent-green">
                {filteredBilgiler.reduce((toplam, b) => toplam + b.toplamFatura, 0).toLocaleString('tr-TR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })} ₺
              </p>
            </div>
            <FileText className="text-accent-green" size={24} />
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
              <p className="text-dark-text-secondary text-sm mb-1">Toplam Danışan</p>
              <p className="text-3xl font-bold text-purple-500">
                {filteredBilgiler.reduce((toplam, b) => toplam + b.toplamDanisan, 0)}
              </p>
            </div>
            <Users className="text-purple-500" size={24} />
          </div>
        </motion.div>
      </div>

      {/* Fatura Tablosu */}
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
                {son3Ay.map(({ yil, ay, ayAdi }) => (
                  <th key={`${yil}-${ay}`} className="text-center p-2 min-w-[100px]">
                    <div className="flex flex-col">
                      <span className="text-xs">{ayAdi}</span>
                      <span className="text-xs text-dark-text-secondary">{yil}</span>
                    </div>
                  </th>
                ))}
                <th className="text-center p-4">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {filteredBilgiler.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-dark-text-secondary">
                      Diyetisyen bulunamadı
                    </td>
                  </tr>
              ) : (
                filteredBilgiler.map((bilgi) => (
                  <tr key={bilgi.diyetisyen.id} className="border-b border-dark-border hover:bg-dark-card-hover">
                    <td className="p-4 sticky left-0 bg-dark-card z-10">
                      <div>
                        <button
                          onClick={() => handleDiyetisyenClick(bilgi)}
                          className="font-semibold text-left hover:text-accent-green transition-colors cursor-pointer"
                          title="12 aylık fatura detaylarını görüntüle"
                        >
                          {bilgi.diyetisyen.adSoyad}
                        </button>
                        <p className="text-sm text-dark-text-secondary">{bilgi.diyetisyen.uyeNumarasi}</p>
                        <p className="text-xs text-dark-text-secondary mt-1">
                          {bilgi.diyetisyen.email}
                        </p>
                      </div>
                    </td>
                    {son3Ay.map(({ yil, ay }) => {
                      const ayBilgi = bilgi.aylikBilgiler.find(a => a.yil === yil && a.ay === ay);
                      if (!ayBilgi) return <td key={`${yil}-${ay}`} className="p-2 text-center">-</td>;

                      const isRefreshing = refreshing.has(`${bilgi.diyetisyen.id}-${yil}-${ay}`);
                      const isMevcutAy = yil === now.getFullYear() && ay === now.getMonth() + 1;

                      return (
                        <td key={`${yil}-${ay}`} className="p-2 text-center">
                          <div className="flex flex-col items-center gap-1">
                            {getFaturaDurumIcon(ayBilgi)}
                            <div className="flex items-center gap-1">
                              <span className={`text-sm font-semibold ${ayBilgi.danisanSayisi > 0 ? 'text-accent-green' : 'text-dark-text-secondary'}`}>
                                {ayBilgi.danisanSayisi}
                              </span>
                              {!ayBilgi.faturaVarMi && (isMevcutAy || ayBilgi.danisanSayisi > 0) && (
                                <button
                                  onClick={() => refreshDiyetisyenDanisanSayisi(bilgi.diyetisyen.id!, yil, ay)}
                                  disabled={isRefreshing}
                                  className="p-1 hover:bg-dark-card-hover rounded transition-colors"
                                  title="Danışan sayısını yenile"
                                >
                                  <RefreshCw 
                                    size={12} 
                                    className={isRefreshing ? 'animate-spin text-accent-green' : 'text-dark-text-secondary'} 
                                  />
                                </button>
                              )}
                            </div>
                            {ayBilgi.fatura && (
                              <button
                                onClick={() => navigate(`/admin/faturalar?diyetisyenId=${bilgi.diyetisyen.id}&yil=${yil}&ay=${ay}`)}
                                className="text-xs text-accent-blue hover:underline flex items-center gap-1"
                                title="Fatura detayını görüntüle"
                              >
                                <Eye size={12} />
                                {ayBilgi.fatura.toplamTutar.toLocaleString('tr-TR', {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0
                                })} ₺
                              </button>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-semibold text-accent-green">
                          {bilgi.toplamFatura.toLocaleString('tr-TR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })} ₺
                        </span>
                        <span className="text-sm text-dark-text-secondary">
                          {bilgi.toplamDanisan} danışan
                        </span>
                      </div>
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
          <FileText className="text-blue-500 mt-1" size={20} />
          <div>
            <h3 className="font-semibold mb-2">Açıklama</h3>
            <ul className="text-sm text-dark-text-secondary space-y-1">
              <li>• <span className="text-accent-green">Yeşil ✓</span>: Fatura oluşturulmuş ve ödenmiş</li>
              <li>• <span className="text-yellow-500">Sarı ⏰</span>: Fatura oluşturulmuş, ödeme bekleniyor</li>
              <li>• <span className="text-accent-red">Kırmızı ✗</span>: Fatura oluşturulmamış (eksik) veya danışan var</li>
              <li>• <span className="text-accent-green">Yeşil sayı</span>: O ay için danışan sayısı</li>
              <li>• <span className="text-accent-green font-semibold">Diyetisyen adına tıklayarak</span> son 12 aylık fatura detaylarını görüntüleyebilirsiniz</li>
              <li>• Her danışan için 1 diyet planı ücreti alınır (birden fazla plan olsa bile)</li>
              <li>• Danışanına diyet planı yapmadıysa ücretlendirilmez</li>
              <li>• Mevcut ay için danışan sayısı mobil uygulamadan anlık çekilir</li>
              <li>• <span className="text-accent-blue">Mavi buton</span> ile fatura detayını görüntüleyebilirsiniz</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Diyetisyen 12 Aylık Fatura Detay Modal */}
      <AnimatePresence>
        {showDiyetisyenModal && selectedDiyetisyenDetay && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDiyetisyenModal(false)}
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="card max-w-6xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedDiyetisyenDetay.diyetisyen.adSoyad}</h2>
                    <p className="text-sm text-dark-text-secondary mt-1">
                      {selectedDiyetisyenDetay.diyetisyen.uyeNumarasi} • {selectedDiyetisyenDetay.diyetisyen.email}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDiyetisyenModal(false)}
                    className="p-2 hover:bg-dark-card-hover rounded-lg transition-colors"
                  >
                    <X size={24} className="text-dark-text-secondary" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="card">
                    <p className="text-sm text-dark-text-secondary mb-1">Toplam Fatura</p>
                    <p className="text-2xl font-bold text-accent-green">
                      {selectedDiyetisyenDetay.toplamFatura.toLocaleString('tr-TR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })} ₺
                    </p>
                  </div>
                  <div className="card">
                    <p className="text-sm text-dark-text-secondary mb-1">Toplam Danışan</p>
                    <p className="text-2xl font-bold text-purple-500">
                      {selectedDiyetisyenDetay.toplamDanisan}
                    </p>
                  </div>
                  <div className="card">
                    <p className="text-sm text-dark-text-secondary mb-1">Fatura Sayısı</p>
                    <p className="text-2xl font-bold text-blue-500">
                      {selectedDiyetisyenDetay.aylikBilgiler.filter(a => a.faturaVarMi).length}
                    </p>
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-4">Son 12 Aylık Fatura Detayları</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-dark-border">
                        <th className="text-left p-4">Yıl</th>
                        <th className="text-left p-4">Ay</th>
                        <th className="text-center p-4">Durum</th>
                        <th className="text-right p-4">Danışan Sayısı</th>
                        <th className="text-right p-4">Fatura Tutarı</th>
                        <th className="text-center p-4">İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {son12Ay.map(({ yil, ay }) => {
                        const ayBilgi = selectedDiyetisyenDetay.aylikBilgiler.find(
                          a => a.yil === yil && a.ay === ay
                        );
                        if (!ayBilgi) return null;

                        return (
                          <tr key={`${yil}-${ay}`} className="border-b border-dark-border hover:bg-dark-card-hover">
                            <td className="p-4">{yil}</td>
                            <td className="p-4">{ayBilgi.ayAdi}</td>
                            <td className="p-4 text-center">
                              {getFaturaDurumIcon(ayBilgi)}
                            </td>
                            <td className="p-4 text-right">
                              <span className={ayBilgi.danisanSayisi > 0 ? 'text-accent-green font-semibold' : 'text-dark-text-secondary'}>
                                {ayBilgi.danisanSayisi}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              {ayBilgi.fatura ? (
                                <span className="font-semibold">
                                  {ayBilgi.fatura.toplamTutar.toLocaleString('tr-TR', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                  })} ₺
                                </span>
                              ) : (
                                <span className="text-dark-text-secondary">-</span>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              {ayBilgi.fatura && (
                                <button
                                  onClick={() => {
                                    setShowDiyetisyenModal(false);
                                    navigate(`/admin/faturalar?diyetisyenId=${selectedDiyetisyenDetay.diyetisyen.id}&yil=${yil}&ay=${ay}`);
                                  }}
                                  className="text-accent-blue hover:underline flex items-center gap-1 mx-auto"
                                  title="Fatura detayını görüntüle"
                                >
                                  <Eye size={16} />
                                  Detay
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
