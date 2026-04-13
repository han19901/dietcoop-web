import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckCircle, XCircle, Clock, Download } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { evrakService } from '@/services/firebase/firestore';
import { evrakStorageService } from '@/services/firebase/evrakStorageService';
import { Evrak, EvrakTipi, EvrakDurumu } from '@/types/evrak';
import { diyetisyenService } from '@/services/firebase/firestore';
import { Diyetisyen } from '@/types/diyetisyen';
import { formatDate } from '@/services/utils/dateUtils';
import { Timestamp } from 'firebase/firestore';

const EVRAK_TIPLERI: Array<{ tip: EvrakTipi; ad: string; zorunlu: boolean; aciklama: string }> = [
  { tip: 'mezuniyetBelgesi', ad: 'Mezuniyet Belgesi', zorunlu: true, aciklama: 'Üniversite mezuniyet belgenizi yükleyiniz' },
  { tip: 'tcKimlik', ad: 'TC Kimlik', zorunlu: true, aciklama: 'TC Kimlik belgenizi yükleyiniz' },
  { tip: 'vergiLevhası', ad: 'Vergi Levhası', zorunlu: false, aciklama: 'Vergi levhanızı yükleyiniz (Opsiyonel)' },
];

export default function DiyetisyenEvraklar() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [diyetisyen, setDiyetisyen] = useState<Diyetisyen | null>(null);
  const [evraklar, setEvraklar] = useState<Evrak[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<EvrakTipi | null>(null);

  useEffect(() => {
    if (user?.uid) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user?.uid) return;

    try {
      const [diyetisyenData, evraklarData] = await Promise.all([
        diyetisyenService.getByUserId(user.uid),
        evrakService.getByDiyetisyenId(user.uid),
      ]);

      setDiyetisyen(diyetisyenData);
      setEvraklar(evraklarData);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      showError('Evraklar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (evrakTipi: EvrakTipi, file: File) => {
    if (!user?.uid || !diyetisyen) return;

    // Dosya formatı kontrolü
    const dosyaAdi = file.name.toLowerCase();
    if (!dosyaAdi.endsWith('.pdf') && !dosyaAdi.endsWith('.jpg') && !dosyaAdi.endsWith('.jpeg')) {
      showError('Sadece JPEG, JPG ve PDF formatları desteklenmektedir');
      return;
    }

    setUploading(evrakTipi);

    try {
      // Dosyayı storage'a yükle
      const dosyaBilgileri = await evrakStorageService.uploadEvrak(file, user.uid, evrakTipi);

      // Mevcut evrak var mı kontrol et
      const mevcutEvrak = await evrakService.evrakVarMi(user.uid, evrakTipi);

      if (mevcutEvrak) {
        // Eski dosyayı sil
        try {
          await evrakStorageService.deleteEvrak(mevcutEvrak.dosyaUrl);
        } catch (error) {
          console.error('Eski dosya silinirken hata:', error);
        }

        // Mevcut evrakı güncelle
        await evrakService.update(mevcutEvrak.id!, {
          dosyaUrl: dosyaBilgileri.dosyaUrl,
          dosyaAdi: dosyaBilgileri.dosyaAdi,
          dosyaFormat: dosyaBilgileri.dosyaFormat,
          dosyaBoyutu: dosyaBilgileri.dosyaBoyutu,
          durum: 'beklemede' as EvrakDurumu,
          yuklemeTarihi: Timestamp.now(),
        });
      } else {
        // Yeni evrak oluştur
        await evrakService.create({
          diyetisyenId: user.uid,
          diyetisyenAdSoyad: diyetisyen.adSoyad,
          diyetisyenEmail: diyetisyen.email,
          evrakTipi,
          dosyaAdi: dosyaBilgileri.dosyaAdi,
          dosyaUrl: dosyaBilgileri.dosyaUrl,
          dosyaFormat: dosyaBilgileri.dosyaFormat,
          dosyaBoyutu: dosyaBilgileri.dosyaBoyutu,
          durum: 'beklemede' as EvrakDurumu,
          yuklemeTarihi: Timestamp.now(),
          sonGuncelleme: Timestamp.now(),
        });
      }

      await loadData();
      showSuccess(`${EVRAK_TIPLERI.find(e => e.tip === evrakTipi)?.ad} başarıyla yüklendi`);
    } catch (error: any) {
      console.error('Evrak yükleme hatası:', error);
      showError(error.message || 'Evrak yüklenirken bir hata oluştu');
    } finally {
      setUploading(null);
    }
  };

  const getEvrakDurumu = (evrakTipi: EvrakTipi): Evrak | null => {
    return evraklar.find(e => e.evrakTipi === evrakTipi) || null;
  };

  const getDurumBadge = (durum: EvrakDurumu, redSebebi?: string) => {
    switch (durum) {
      case 'onaylandi':
        return (
          <span className="badge badge-success flex items-center gap-1">
            <CheckCircle size={14} />
            Onaylandı
          </span>
        );
      case 'reddedildi':
        return (
          <div className="flex flex-col gap-1">
            <span className="badge badge-danger flex items-center gap-1">
              <XCircle size={14} />
              Reddedildi
            </span>
            {redSebebi && (
              <p className="text-sm text-accent-red mt-1">{redSebebi}</p>
            )}
          </div>
        );
      case 'beklemede':
        return (
          <span className="badge badge-warning flex items-center gap-1">
            <Clock size={14} />
            Beklemede
          </span>
        );
      default:
        return null;
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

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold">Evraklarım</h1>
        <p className="text-dark-text-secondary mt-2">
          Gerekli evrakları yükleyiniz. Evraklarınız admin tarafından onaylandıktan sonra aktif olacaktır.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {EVRAK_TIPLERI.map((evrakTipi, index) => {
          const mevcutEvrak = getEvrakDurumu(evrakTipi.tip);
          const isUploading = uploading === evrakTipi.tip;

          return (
            <motion.div
              key={evrakTipi.tip}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <FileText size={24} />
                    {evrakTipi.ad}
                    {evrakTipi.zorunlu && (
                      <span className="text-accent-red text-sm">*</span>
                    )}
                  </h3>
                  <p className="text-sm text-dark-text-secondary mt-1">{evrakTipi.aciklama}</p>
                </div>
                {mevcutEvrak && getDurumBadge(mevcutEvrak.durum, mevcutEvrak.redSebebi)}
              </div>

              {mevcutEvrak && (
                <div className="mb-4 p-3 bg-dark-card-hover rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-dark-text-secondary">Yüklenme Tarihi:</span>
                    <span className="text-sm font-semibold">{formatDate(mevcutEvrak.yuklemeTarihi)}</span>
                  </div>
                  {mevcutEvrak.onayTarihi && (
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-dark-text-secondary">Onay Tarihi:</span>
                      <span className="text-sm font-semibold">{formatDate(mevcutEvrak.onayTarihi)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-dark-text-secondary">Dosya:</span>
                    <a
                      href={mevcutEvrak.dosyaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-accent-green hover:underline flex items-center gap-1"
                    >
                      <Download size={14} />
                      {mevcutEvrak.dosyaAdi}
                    </a>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="label">
                  {mevcutEvrak ? 'Evrakı Güncelle' : 'Evrak Yükle'}
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(evrakTipi.tip, file);
                    }
                  }}
                  disabled={isUploading}
                  className="input"
                />
                {isUploading && (
                  <p className="text-sm text-dark-text-secondary">Yükleniyor...</p>
                )}
                <p className="text-xs text-dark-text-secondary">
                  Desteklenen formatlar: PDF, JPEG, JPG (Maksimum 10MB)
                </p>
              </div>

              {mevcutEvrak?.durum === 'reddedildi' && (
                <div className="mt-4 p-3 bg-accent-red bg-opacity-10 border border-accent-red border-opacity-30 rounded-lg">
                  <p className="text-sm text-accent-red font-semibold mb-1">Red Sebebi:</p>
                  <p className="text-sm text-dark-text">{mevcutEvrak.redSebebi || 'Belirtilmemiş'}</p>
                  <p className="text-xs text-dark-text-secondary mt-2">
                    Lütfen evrakı düzeltip tekrar yükleyiniz.
                  </p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
