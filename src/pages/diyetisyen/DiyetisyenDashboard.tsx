import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  CreditCard,
  AlertCircle,
  UserCheck,
  Clock
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { diyetisyenService, faturaService } from '@/services/firebase/firestore';
import { Diyetisyen } from '@/types/diyetisyen';
import { Fatura } from '@/types/fatura';
import { getPaketBilgisiByDanisanSayisi } from '@/services/utils/paketUtils';
import { formatDate } from '@/services/utils/dateUtils';
import { mobileAppService } from '@/services/firebase/mobileAppService';
import { useBildirimKontrol } from '@/hooks/useBildirimKontrol';

export default function DiyetisyenDashboard() {
  const { user } = useAuth();
  const [diyetisyen, setDiyetisyen] = useState<Diyetisyen | null>(null);
  const [recentFaturalar, setRecentFaturalar] = useState<Fatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [aktifDanisanSayisi, setAktifDanisanSayisi] = useState(0);
  
  // Bildirim kontrolü
  useBildirimKontrol();

  useEffect(() => {
    if (user?.uid) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user?.uid) return;
    
    try {
      // Diyetisyen bilgilerini yükle
      const diyetisyenData = await diyetisyenService.getByUserId(user.uid);
      
      if (!diyetisyenData) {
        setLoading(false);
        return;
      }

      setDiyetisyen(diyetisyenData);

      // Mobil uygulamadan diyet planlarını çekerek benzersiz danışan sayısını hesapla
      if (diyetisyenData.mobilUygulamadanKayit || diyetisyenData.kayitYeri === 'mobil') {
        try {
          const mobileUserId = diyetisyenData.mobilUygulamaId || diyetisyenData.id || user.uid;
          
          // Son 12 ay için tüm diyet planlarını çek ve benzersiz danışan sayısını hesapla
          const now = new Date();
          const baslangicTarihi = new Date(now.getFullYear(), now.getMonth() - 11, 1); // Son 12 ay
          const bitisTarihi = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999); // Bu ayın sonu
          
          const planlar = await mobileAppService.getDiyetPlanlariByAy(
            mobileUserId,
            baslangicTarihi,
            bitisTarihi
          );
          
          // Deneme süresi kontrolü
          let filtreliPlanlar = planlar;
          if (diyetisyenData.denemeSuresi?.aktif && diyetisyenData.denemeSuresi.bitisTarihi) {
            const denemeBitis = diyetisyenData.denemeSuresi.bitisTarihi.toDate();
            const denemeSuresiBitti = denemeBitis < now;
            
            // Sadece deneme süresi henüz bitmemişse filtre uygula
            if (!denemeSuresiBitti) {
              filtreliPlanlar = planlar.filter(p => p.olusturmaTarihi > denemeBitis);
            }
          }
          
          // Benzersiz danışan sayısı (her danışan için 1 kez)
          const benzersizDanisanlar = new Set(filtreliPlanlar.map(p => p.danisanId));
          const danisanSayisi = benzersizDanisanlar.size;
          
          setAktifDanisanSayisi(danisanSayisi);
        } catch (error) {
          console.warn('Mobil uygulamadan diyet planları alınamadı:', error);
          setAktifDanisanSayisi(diyetisyenData.aktifDanisanSayisi || 0);
        }
      } else {
        // Web panel'den kayıt olan diyetisyenler için web panel değerini kullan
        setAktifDanisanSayisi(diyetisyenData.aktifDanisanSayisi || 0);
      }

      // Fatura geçmişini yükle
      const faturalar = await faturaService.getByDiyetisyenId(diyetisyenData.id!);
      setRecentFaturalar(faturalar.slice(0, 5));
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

  if (!diyetisyen) {
    return (
      <div className="card text-center py-12">
        <p className="text-dark-text-secondary text-lg">Diyetisyen bilgileri bulunamadı</p>
      </div>
    );
  }

  const isTrialActive = diyetisyen.denemeSuresi?.aktif;
  const kayitYeri = diyetisyen.kayitYeri || (diyetisyen.mobilUygulamadanKayit ? 'mobil' : 'web');
  const beklemedeFatura = recentFaturalar.find(f => f.faturaDurumu === 'beklemede' || f.faturaDurumu === 'gecikmis') || null;

  const statCards = [
    {
      title: 'Aktif Danışan',
      value: aktifDanisanSayisi,
      icon: UserCheck,
      color: 'accent-green',
    },
    {
      title: 'Pasif Danışan',
      value: 0, // Pasif danışan sayısı şu an kullanılmıyor
      icon: Users,
      color: 'accent-blue',
    },
    {
      title: 'Ödeme Durumu',
      value: diyetisyen.odemeDurumu === 'aktif' ? 'Aktif' : 
             diyetisyen.odemeDurumu === 'deneme' ? 'Deneme' :
             diyetisyen.odemeDurumu === 'beklemede' ? 'Beklemede' : 'Süresi Dolmuş',
      icon: CreditCard,
      color: diyetisyen.odemeDurumu === 'aktif' ? 'accent-green' : 
             diyetisyen.odemeDurumu === 'deneme' ? 'yellow-500' : 'accent-red',
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold">Hoş Geldiniz, {diyetisyen.adSoyad}</h1>
          <p className="text-dark-text-secondary mt-1">Üye No: {diyetisyen.uyeNumarasi}</p>
        </div>
      </motion.div>

      {/* Fatura Uyarısı */}
      {beklemedeFatura && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card bg-accent-red bg-opacity-20 border-accent-red border-opacity-30"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="text-accent-red" size={24} />
            <div>
              <h3 className="font-bold text-accent-red">
                {beklemedeFatura.faturaDurumu === 'gecikmis' ? 'Fatura Gecikmiş' : 'Bekleyen Fatura'}
              </h3>
              <p className="text-sm text-dark-text-secondary">
                {beklemedeFatura.faturaDonemi.ay}/{beklemedeFatura.faturaDonemi.yil} dönemi faturanız 
                {beklemedeFatura.faturaDurumu === 'gecikmis' ? ' gecikmiş durumda.' : ' bekliyor.'} 
                Lütfen faturalar sayfasından ödeme işleminizi tamamlayın.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Deneme Süresi Bilgisi */}
      {isTrialActive && diyetisyen.denemeSuresi && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card bg-yellow-500 bg-opacity-20 border-yellow-500 border-opacity-30"
        >
          <div className="flex items-center gap-3">
            <Clock className="text-yellow-500" size={24} />
            <div className="flex-1">
              <h3 className="font-bold text-yellow-500">Deneme Süresi Aktif</h3>
              <p className="text-sm text-dark-text-secondary">
                {diyetisyen.denemeSuresi.gunSayisi} günlük deneme süreniz devam ediyor.
                {diyetisyen.denemeSuresi.bitisTarihi && (
                  <span className="ml-2">
                    Bitiş: {formatDate(diyetisyen.denemeSuresi.bitisTarihi)}
                  </span>
                )}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses: Record<string, { bg: string; text: string }> = {
            'accent-blue': { bg: 'bg-accent-blue bg-opacity-20', text: 'text-accent-blue' },
            'accent-green': { bg: 'bg-accent-green bg-opacity-20', text: 'text-accent-green' },
            'yellow-500': { bg: 'bg-yellow-500 bg-opacity-20', text: 'text-yellow-500' },
            'accent-red': { bg: 'bg-accent-red bg-opacity-20', text: 'text-accent-red' },
            'purple-500': { bg: 'bg-purple-500 bg-opacity-20', text: 'text-purple-500' },
          };
          const colors = colorClasses[stat.color] || colorClasses['accent-blue'];
          
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="card"
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Genel Bilgiler */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <h2 className="text-xl font-bold mb-4">Genel Bilgiler</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-dark-text-secondary">E-posta:</span>
              <span className="font-semibold">{diyetisyen.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-text-secondary">Telefon:</span>
              <span className="font-semibold">{diyetisyen.telefon || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-text-secondary">Üyelik Tarihi:</span>
              <span className="font-semibold">{formatDate(diyetisyen.olusturmaTarihi)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-text-secondary">Kayıt Yeri:</span>
              <span className="font-semibold">
                {kayitYeri === 'mobil' ? 'Mobil Uygulama' : 'Web Panel'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-text-secondary">Aktiflik Durumu:</span>
              <span className={`badge ${
                diyetisyen.aktiflikDurumu === 'aktif' ? 'badge-success' :
                diyetisyen.aktiflikDurumu === 'pasif' ? 'badge-danger' :
                'badge-warning'
              }`}>
                {diyetisyen.aktiflikDurumu === 'aktif' ? 'Aktif' :
                 diyetisyen.aktiflikDurumu === 'pasif' ? 'Pasif' :
                 'Askıya Alındı'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Ödeme Bilgileri */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <h2 className="text-xl font-bold mb-4">Ödeme Bilgileri</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-dark-text-secondary">Danışan Başı Ücret:</span>
              <span className="font-semibold">{diyetisyen.danisanBasiUcret} ₺</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-text-secondary">İskonto Oranı:</span>
              <span className="font-semibold">%{diyetisyen.iskontoOrani}</span>
            </div>
            {(() => {
              const sonFatura = recentFaturalar
                .filter(f => f.faturaDurumu === 'odendi')
                .sort((a, b) => b.olusturmaTarihi.toMillis() - a.olusturmaTarihi.toMillis())[0];
              return sonFatura && (
                <div className="flex justify-between">
                  <span className="text-dark-text-secondary">Son Ödenen Fatura:</span>
                  <span className="font-semibold">
                    {sonFatura.faturaDonemi.ay}/{sonFatura.faturaDonemi.yil}
                  </span>
                </div>
              );
            })()}
            {beklemedeFatura && (
              <div className="flex justify-between">
                <span className="text-dark-text-secondary">Bekleyen Fatura:</span>
                <span className={`font-semibold ${beklemedeFatura.faturaDurumu === 'gecikmis' ? 'text-accent-red' : 'text-yellow-500'}`}>
                  {beklemedeFatura.faturaDonemi.ay}/{beklemedeFatura.faturaDonemi.yil} - {beklemedeFatura.toplamTutar.toFixed(2)} ₺
                  {beklemedeFatura.faturaDurumu === 'gecikmis' && ' (Gecikmiş)'}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Son Faturalar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
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
              const paketBilgisi = getPaketBilgisiByDanisanSayisi(fatura.danisanSayisi);
              return (
                <div
                  key={fatura.id}
                  className="flex items-center justify-between p-4 bg-dark-card-hover rounded-lg"
                >
                  <div>
                    <p className="font-semibold">
                      {ayIsimleri[fatura.faturaDonemi.ay - 1]} {fatura.faturaDonemi.yil}
                    </p>
                    <p className="text-sm text-dark-text-secondary">
                      {paketBilgisi.ad} - {fatura.danisanSayisi} danışan
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

