import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, CreditCard, AlertCircle, CheckCircle, UserCheck, FileText, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { diyetisyenService, faturaService, evrakService, odemeService } from '@/services/firebase/firestore';
import { mobileAppService } from '@/services/firebase/mobileAppService';
import { Fatura } from '@/types/fatura';
import { Odeme } from '@/types/payment';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    toplamDiyetisyen: 0,
    aktifDiyetisyen: 0,
    toplamDanisan: 0,
    bekleyenFatura: 0,
    gecikmisFatura: 0,
    bekleyenEvrak: 0,
    bekleyenOdeme: 0,
  });
  const [recentFaturalar, setRecentFaturalar] = useState<Fatura[]>([]);
  const [recentOdemeler, setRecentOdemeler] = useState<Odeme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [diyetisyenler, faturalar, evraklar, odemeler] = await Promise.all([
        diyetisyenService.getAll(),
        faturaService.getAll(),
        evrakService.getAll(),
        odemeService.getAll(),
      ]);

      const aktifDiyetisyen = diyetisyenler.filter(
        (d) => d.aktiflikDurumu === 'aktif'
      ).length;

      const bekleyenFatura = faturalar.filter((f) => f.faturaDurumu === 'beklemede').length;
      const gecikmisFatura = faturalar.filter((f) => f.faturaDurumu === 'gecikmis').length;
      const bekleyenEvrak = evraklar.filter((e) => e.durum === 'beklemede').length;
      const bekleyenOdeme = odemeler.filter((o) => o.odemeDurumu === 'beklemede').length;

      // Mobil uygulamadan diyet planlarını çekerek benzersiz danışan sayısını hesapla
      let toplamDanisan = 0;
      
      // Sadece mobil uygulamadan kayıt olan diyetisyenler için diyet planlarını çek
      const mobilKayitliDiyetisyenler = diyetisyenler.filter(d => d.mobilUygulamadanKayit);
      
      if (mobilKayitliDiyetisyenler.length > 0) {
        try {
          // Son 12 ay için tüm diyet planlarını çek ve benzersiz danışan sayısını hesapla
          const now = new Date();
          const baslangicTarihi = new Date(now.getFullYear(), now.getMonth() - 11, 1); // Son 12 ay
          const bitisTarihi = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999); // Bu ayın sonu
          
          // Paralel istekleri sınırla (batch processing)
          const batchSize = 3; // Diyet planları çekmek daha ağır olduğu için batch size'ı küçült
          const batches = [];
          for (let i = 0; i < mobilKayitliDiyetisyenler.length; i += batchSize) {
            batches.push(mobilKayitliDiyetisyenler.slice(i, i + batchSize));
          }
          
          const danisanSayilari: number[] = [];
          
          for (const batch of batches) {
            const batchPromises = batch.map(async (diyetisyen) => {
              try {
                const mobileUserId = diyetisyen.mobilUygulamaId || diyetisyen.id;
                if (mobileUserId) {
                  // Son 12 ay içindeki tüm diyet planlarını çek
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
                  
                  return danisanSayisi;
                }
              } catch (error) {
                console.warn(`[Dashboard] ${diyetisyen.adSoyad} için mobil uygulamadan diyet planları alınamadı:`, error);
              }
              // Hata durumunda web panel değerini kullan
              return diyetisyen.aktifDanisanSayisi || 0;
            });
            
            const batchResults = await Promise.all(batchPromises);
            danisanSayilari.push(...batchResults);
          }
          
          // Web panel'den kayıt olan diyetisyenler için değerleri ekle
          const webKayitliDiyetisyenler = diyetisyenler.filter(d => !d.mobilUygulamadanKayit);
          const webDanisanSayilari = webKayitliDiyetisyenler.map(d => d.aktifDanisanSayisi || 0);
          
          toplamDanisan = [...danisanSayilari, ...webDanisanSayilari].reduce((toplam, sayi) => toplam + sayi, 0);
          
        } catch (error) {
          console.warn('[Dashboard] Mobil uygulamadan danışan sayıları alınamadı, web panel değerleri kullanılıyor:', error);
          // Hata durumunda web panel değerlerini kullan
          toplamDanisan = diyetisyenler.reduce((toplam, d) => toplam + (d.aktifDanisanSayisi || 0), 0);
        }
      } else {
        // Mobil kayıtlı diyetisyen yoksa web panel değerlerini kullan
        toplamDanisan = diyetisyenler.reduce((toplam, d) => toplam + (d.aktifDanisanSayisi || 0), 0);
      }

      setStats({
        toplamDiyetisyen: diyetisyenler.length,
        aktifDiyetisyen,
        toplamDanisan,
        bekleyenFatura,
        gecikmisFatura,
        bekleyenEvrak,
        bekleyenOdeme,
      });

      setRecentFaturalar(faturalar.slice(0, 5));
      setRecentOdemeler(odemeler.filter((o) => o.odemeDurumu === 'beklemede').slice(0, 5));
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-green"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Toplam Diyetisyen',
      value: stats.toplamDiyetisyen,
      icon: Users,
      color: 'accent-blue',
      onClick: () => navigate('/admin/diyetisyenler'),
    },
    {
      title: 'Aktif Diyetisyen',
      value: stats.aktifDiyetisyen,
      icon: CheckCircle,
      color: 'accent-green',
      onClick: () => navigate('/admin/diyetisyenler?durum=aktif'),
    },
    {
      title: 'Toplam Danışan',
      value: stats.toplamDanisan,
      icon: UserCheck,
      color: 'purple-500',
      onClick: () => navigate('/admin/diyetisyenler'),
    },
    {
      title: 'Bekleyen Fatura',
      value: stats.bekleyenFatura,
      icon: CreditCard,
      color: 'yellow-500',
      onClick: () => navigate('/admin/faturalar?durum=beklemede'),
    },
    {
      title: 'Gecikmiş Fatura',
      value: stats.gecikmisFatura,
      icon: AlertCircle,
      color: 'accent-red',
      onClick: () => navigate('/admin/diyetisyenler?durum=suresiDolmus'),
    },
    {
      title: 'Onay Bekleyen Evrak',
      value: stats.bekleyenEvrak,
      icon: FileText,
      color: 'orange-500',
      onClick: () => navigate('/admin/evrak-onay?durum=beklemede'),
    },
    {
      title: 'Bekleyen Ödemeler',
      value: stats.bekleyenOdeme,
      icon: Clock,
      color: 'blue-500',
      onClick: () => navigate('/admin/odemeler?durum=beklemede'),
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </motion.div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses: Record<string, { bg: string; text: string }> = {
            'accent-blue': { bg: 'bg-accent-blue bg-opacity-20', text: 'text-accent-blue' },
            'accent-green': { bg: 'bg-accent-green bg-opacity-20', text: 'text-accent-green' },
            'yellow-500': { bg: 'bg-yellow-500 bg-opacity-20', text: 'text-yellow-500' },
            'accent-red': { bg: 'bg-accent-red bg-opacity-20', text: 'text-accent-red' },
            'purple-500': { bg: 'bg-purple-500 bg-opacity-20', text: 'text-purple-500' },
            'orange-500': { bg: 'bg-orange-500 bg-opacity-20', text: 'text-orange-500' },
            'blue-500': { bg: 'bg-blue-500 bg-opacity-20', text: 'text-blue-500' },
          };
          const colors = colorClasses[stat.color] || colorClasses['accent-blue'];
          
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={stat.onClick}
              className="card cursor-pointer hover:border-accent-green transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-text-secondary text-sm mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${colors.bg}`}>
                  <Icon className={colors.text} size={24} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Bekleyen Ödemeler */}
      {recentOdemeler.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Bekleyen Ödemeler</h2>
            <button
              onClick={() => navigate('/admin/odemeler?durum=beklemede')}
              className="text-sm text-accent-green hover:underline"
            >
              Tümünü Gör
            </button>
          </div>
          <div className="space-y-3">
            {recentOdemeler.map((odeme) => {
              return (
                <div
                  key={odeme.id}
                  onClick={() => navigate(`/admin/odemeler?durum=beklemede`)}
                  className="flex items-center justify-between p-4 bg-dark-card-hover rounded-lg cursor-pointer hover:bg-dark-card-hover/80 transition-colors"
                >
                  <div>
                    <p className="font-semibold">{odeme.diyetisyenAdSoyad}</p>
                    <p className="text-sm text-dark-text-secondary">
                      {odeme.uyeNumarasi} • {odeme.odemeYontemi === 'bankaHavalesi' ? 'Banka Havalesi' : 'Kredi Kartı'}
                    </p>
                    {odeme.olusturmaTarihi && (
                      <p className="text-xs text-dark-text-secondary mt-1">
                        {odeme.olusturmaTarihi.toDate().toLocaleDateString('tr-TR')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{odeme.toplamTutar.toFixed(2)} ₺</p>
                    <span className="badge badge-warning">Beklemede</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Son Faturalar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card"
      >
        <h2 className="text-xl font-bold mb-4">Son Faturalar</h2>
        {recentFaturalar.length === 0 ? (
          <p className="text-dark-text-secondary text-center py-8">
            Henüz fatura kaydı bulunmuyor
          </p>
        ) : (
          <div className="space-y-3">
            {recentFaturalar.map((fatura) => {
              const ayIsimleri = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
              return (
                <div
                  key={fatura.id}
                  className="flex items-center justify-between p-4 bg-dark-card-hover rounded-lg"
                >
                  <div>
                    <p className="font-semibold">{fatura.diyetisyenAdSoyad}</p>
                    <p className="text-sm text-dark-text-secondary">
                      {ayIsimleri[fatura.faturaDonemi.ay - 1]} {fatura.faturaDonemi.yil}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{fatura.toplamTutar.toFixed(2)} ₺</p>
                    <span
                      className={`badge ${
                        fatura.faturaDurumu === 'odendi'
                          ? 'badge-success'
                          : fatura.faturaDurumu === 'beklemede'
                          ? 'badge-warning'
                          : fatura.faturaDurumu === 'gecikmis'
                          ? 'badge-danger'
                          : 'badge-secondary'
                      }`}
                    >
                      {fatura.faturaDurumu === 'odendi'
                        ? 'Ödendi'
                        : fatura.faturaDurumu === 'beklemede'
                        ? 'Beklemede'
                        : fatura.faturaDurumu === 'gecikmis'
                        ? 'Gecikmiş'
                        : 'İptal'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}

