import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import { faturaService } from '@/services/firebase/firestore';
import { Fatura } from '@/types/fatura';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { formatDate } from '@/services/utils/dateUtils';
import { getPaketBilgisi } from '@/services/utils/paketUtils';

export default function DiyetisyenFaturalar() {
  const { user } = useAuth();
  const { showError } = useToast();
  const [faturalar, setFaturalar] = useState<Fatura[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      loadFaturalar();
    }
  }, [user]);

  const loadFaturalar = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const data = await faturaService.getByDiyetisyenId(user.uid);
      setFaturalar(data);
    } catch (error) {
      console.error('Faturalar yüklenirken hata:', error);
      showError('Faturalar yüklenirken bir hata oluştu');
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

  const ayIsimleri = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  // Özet istatistikler
  const toplamFatura = faturalar.length;
  const odendiFatura = faturalar.filter((f) => f.faturaDurumu === 'odendi').length;
  const beklemedeFatura = faturalar.filter((f) => f.faturaDurumu === 'beklemede').length;
  const toplamTutar = faturalar
    .filter((f) => f.faturaDurumu === 'odendi')
    .reduce((sum, f) => sum + f.toplamTutar, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Faturalarım</h1>

      {/* Özet İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-sm text-dark-text-secondary">Toplam Fatura</div>
          <div className="text-2xl font-bold">{toplamFatura}</div>
        </div>
        <div className="card">
          <div className="text-sm text-dark-text-secondary">Bekleyen</div>
          <div className="text-2xl font-bold text-yellow-500">{beklemedeFatura}</div>
        </div>
        <div className="card">
          <div className="text-sm text-dark-text-secondary">Ödenen</div>
          <div className="text-2xl font-bold text-green-500">{odendiFatura}</div>
        </div>
        <div className="card">
          <div className="text-sm text-dark-text-secondary">Toplam Ödenen</div>
          <div className="text-2xl font-bold text-accent-green">{toplamTutar.toFixed(2)} ₺</div>
        </div>
      </div>

      {/* Fatura Listesi */}
      <div className="space-y-4">
        {faturalar.map((fatura, index) => {
          const paketBilgisi = getPaketBilgisi(fatura.paketTipi);
          const isGecikmis = fatura.faturaDurumu === 'beklemede' && 
            new Date() > fatura.sonOdemeTarihi.toDate();

          return (
            <motion.div
              key={fatura.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-bold">
                        {ayIsimleri[fatura.faturaDonemi.ay - 1]} {fatura.faturaDonemi.yil} Faturası
                      </h3>
                      <p className="text-sm text-dark-text-secondary">
                        Fatura No: {fatura.id}
                      </p>
                    </div>
                    {/* Oransal Hesaplama Badge */}
                    {fatura.oransalHesaplama?.aktif && (
                      <span className="badge badge-info text-xs">
                        Oransal Hesaplama
                      </span>
                    )}
                    <span
                      className={`badge ${
                        fatura.faturaDurumu === 'odendi'
                          ? 'badge-success'
                          : fatura.faturaDurumu === 'beklemede'
                          ? isGecikmis
                          ? 'badge-danger'
                          : 'badge-warning'
                          : fatura.faturaDurumu === 'gecikmis'
                          ? 'badge-danger'
                          : 'badge-secondary'
                      }`}
                    >
                      {fatura.faturaDurumu === 'odendi' ? (
                        <>
                          <CheckCircle size={14} className="inline mr-1" />
                          Ödendi
                        </>
                      ) : fatura.faturaDurumu === 'beklemede' ? (
                        isGecikmis ? (
                          <>
                            <Clock size={14} className="inline mr-1" />
                            Gecikmiş
                          </>
                        ) : (
                          <>
                            <Clock size={14} className="inline mr-1" />
                            Beklemede
                          </>
                        )
                      ) : fatura.faturaDurumu === 'gecikmis' ? (
                        <>
                          <XCircle size={14} className="inline mr-1" />
                          Gecikmiş
                        </>
                      ) : (
                        <>
                          <XCircle size={14} className="inline mr-1" />
                          İptal
                        </>
                      )}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 text-sm">
                    <div>
                      <span className="text-dark-text-secondary">Paket:</span>
                      <p className="font-semibold">{paketBilgisi.ad}</p>
                    </div>
                    <div>
                      <span className="text-dark-text-secondary">Danışan:</span>
                      <p className="font-semibold">{fatura.danisanSayisi} kişi</p>
                    </div>
                    <div>
                      <span className="text-dark-text-secondary">Birim Fiyat:</span>
                      <p className="font-semibold">{fatura.danisanBasiUcret} ₺</p>
                    </div>
                    <div>
                      <span className="text-dark-text-secondary">Tutar:</span>
                      <p className="font-semibold">{fatura.tutar.toFixed(2)} ₺</p>
                    </div>
                    <div>
                      <span className="text-dark-text-secondary">Toplam:</span>
                      <p className="font-semibold text-accent-green">{fatura.toplamTutar.toFixed(2)} ₺</p>
                    </div>
                  </div>

                  {/* İskonto Bilgisi */}
                  {fatura.iskontoOrani && fatura.iskontoOrani > 0 && fatura.iskontoTutari && fatura.iskontoTutari > 0 && (
                    <div className="mt-4 p-3 bg-yellow-500 bg-opacity-10 rounded-lg border border-yellow-500 border-opacity-20">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-yellow-500">İskonto Uygulandı</span>
                      </div>
                      <div className="text-sm text-dark-text-secondary space-y-1">
                        <p>
                          <span className="font-semibold">İskonto Oranı:</span> %{fatura.iskontoOrani.toFixed(2)}
                        </p>
                        <p>
                          <span className="font-semibold">İskonto Tutarı:</span> {fatura.iskontoTutari.toFixed(2)} ₺
                        </p>
                        <p className="text-xs mt-2">
                          İskonto sonrası tutar: {fatura.tutar.toFixed(2)} ₺
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-2 text-sm">
                    <span className="text-dark-text-secondary">Oluşturulma: </span>
                    <span className="font-semibold">{formatDate(fatura.olusturmaTarihi)}</span>
                    <span className="text-dark-text-secondary ml-4">Son Ödeme: </span>
                    <span className={`font-semibold ${isGecikmis ? 'text-red-500' : ''}`}>
                      {formatDate(fatura.sonOdemeTarihi)}
                    </span>
                    {fatura.odemeTarihi && (
                      <>
                        <span className="text-dark-text-secondary ml-4">Ödeme: </span>
                        <span className="font-semibold text-green-500">
                          {formatDate(fatura.odemeTarihi)}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Oransal Hesaplama Bilgisi */}
                  {fatura.oransalHesaplama?.aktif && (
                    <div className="mt-4 p-4 bg-blue-500 bg-opacity-10 rounded-lg border border-blue-500 border-opacity-20">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-blue-500">Oransal Faturalandırma</span>
                      </div>
                      <div className="text-sm text-dark-text-secondary space-y-1">
                        <p>
                          <span className="font-semibold">{fatura.oransalHesaplama.aktifGunSayisi} gün</span> aktif olduğunuz için oransal faturalandırma yapılmıştır.
                        </p>
                        <p className="text-xs mt-2">
                          İlk Aktif Diyet Planı: {formatDate(fatura.oransalHesaplama.ilkAktifDiyetPlaniTarihi)}
                        </p>
                        <p className="text-xs">
                          Aktif Gün: {fatura.oransalHesaplama.aktifGunSayisi} / {fatura.oransalHesaplama.ayinToplamGunu} gün
                        </p>
                        <p className="text-xs">
                          Normal Tutar: {fatura.oransalHesaplama.normalTutar.toFixed(2)} ₺ → 
                          <span className="font-semibold text-accent-green"> Oransal Tutar: {fatura.oransalHesaplama.oransalTutar.toFixed(2)} ₺</span>
                        </p>
                        <p className="text-xs text-dark-text-tertiary mt-1">
                          Hesaplama: {fatura.oransalHesaplama.normalTutar.toFixed(2)} / {fatura.oransalHesaplama.ayinToplamGunu} × {fatura.oransalHesaplama.aktifGunSayisi} = {fatura.oransalHesaplama.oransalTutar.toFixed(2)} ₺
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Banka Havalesi Bilgileri */}
                  {fatura.bankaHavalesi && fatura.faturaDurumu === 'beklemede' && (
                    <div className="mt-4 p-4 bg-dark-surface rounded-lg">
                      <h4 className="font-semibold mb-2">Banka Havalesi Bilgileri</h4>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="text-dark-text-secondary">IBAN: </span>
                          <span className="font-mono">{fatura.bankaHavalesi.iban}</span>
                        </p>
                        <p>
                          <span className="text-dark-text-secondary">Alıcı: </span>
                          <span>{fatura.bankaHavalesi.aliciAdi}</span>
                        </p>
                        <p>
                          <span className="text-dark-text-secondary">Açıklama: </span>
                          <span>{fatura.bankaHavalesi.aciklama}</span>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Danışan Detayları */}
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-semibold text-accent-green hover:text-accent-green/80">
                      Danışan Detayları ({fatura.danisanDetaylari.length})
                    </summary>
                    <div className="mt-2 space-y-2">
                      {fatura.danisanDetaylari.map((danisan) => (
                        <div key={danisan.danisanId} className="text-sm bg-dark-surface p-2 rounded">
                          <div className="flex justify-between">
                            <span className="font-semibold">{danisan.danisanAdi}</span>
                            <span className="text-dark-text-secondary">
                              {danisan.planSayisi} plan - {formatDate(danisan.planOlusturmaTarihi)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {faturalar.length === 0 && (
        <div className="card text-center py-12">
          <FileText size={48} className="mx-auto mb-4 text-dark-text-secondary" />
          <p className="text-dark-text-secondary text-lg">
            Henüz fatura kaydı bulunmuyor
          </p>
        </div>
      )}
    </div>
  );
}
