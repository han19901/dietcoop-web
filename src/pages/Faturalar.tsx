import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import { faturaService, aktiviteLogService, diyetisyenService } from '@/services/firebase/firestore';
import { mesajService } from '@/services/firebase/mesajService';
import { Fatura } from '@/types/fatura';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import ConfirmModal from '@/components/common/ConfirmModal';
import { formatDate } from '@/services/utils/dateUtils';
import { Timestamp } from 'firebase/firestore';
import { createFaturalarForAllDiyetisyenler } from '@/services/fatura/faturaOlusturmaService';
import { sendOdemeOnaylandiBildirimi } from '@/services/utils/bildirimUtils';
import { getPaketBilgisiByDanisanSayisi } from '@/services/utils/paketUtils';

export default function Faturalar() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [faturalar, setFaturalar] = useState<Fatura[]>([]);
  const [filteredFaturalar, setFilteredFaturalar] = useState<Fatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'beklemede' | 'odendi' | 'gecikmis' | 'iptal'>('all');
  const [ayFilter, setAyFilter] = useState<string>('all');
  const [yilFilter, setYilFilter] = useState<string>('all');
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [selectedFatura, setSelectedFatura] = useState<Fatura | null>(null);
  const [creatingFatura, setCreatingFatura] = useState(false);

  useEffect(() => {
    loadFaturalar();
  }, []);

  useEffect(() => {
    filterFaturalar();
  }, [faturalar, searchTerm, statusFilter, ayFilter, yilFilter]);

  const loadFaturalar = async () => {
    try {
      setLoading(true);
      const data = await faturaService.getAll();
      setFaturalar(data);
    } catch (error) {
      console.error('Faturalar yüklenirken hata:', error);
      showError('Faturalar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const filterFaturalar = () => {
    let filtered = [...faturalar];

    if (searchTerm) {
      filtered = filtered.filter(
        (f) =>
          f.diyetisyenAdSoyad.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.diyetisyenEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.uyeNumarasi.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((f) => f.faturaDurumu === statusFilter);
    }

    if (ayFilter !== 'all') {
      filtered = filtered.filter((f) => f.faturaDonemi.ay === parseInt(ayFilter));
    }

    if (yilFilter !== 'all') {
      filtered = filtered.filter((f) => f.faturaDonemi.yil === parseInt(yilFilter));
    }

    setFilteredFaturalar(filtered);
  };

  const handleApproveFatura = async (fatura: Fatura) => {
    if (!user) return;

    try {
      await faturaService.update(fatura.id!, {
        faturaDurumu: 'odendi',
        odemeTarihi: Timestamp.now(),
        onayTarihi: Timestamp.now(),
        onaylayanAdmin: user.uid,
        bankaHavalesi: fatura.bankaHavalesi
          ? {
              ...fatura.bankaHavalesi,
              onayTarihi: Timestamp.now(),
            }
          : undefined,
      });

      // Diyetisyen durumunu güncelle
      await diyetisyenService.update(fatura.diyetisyenId, {
        odemeDurumu: 'aktif',
        aktiflikDurumu: 'aktif',
        apiErisimDurumu: 'aktif',
        sonOdemeTarihi: Timestamp.now(),
      });

      // Bildirim gönder
      try {
        const updatedFatura = { ...fatura, faturaDurumu: 'odendi' as any, odemeTarihi: Timestamp.now() };
        await sendOdemeOnaylandiBildirimi(updatedFatura);
      } catch (error) {
        console.error('Bildirim gönderme hatası:', error);
      }

      // Diyetisyene teşekkür mesajı gönder
      try {
        await mesajService.sendMessage(
          fatura.diyetisyenId,
          user.uid,
          'admin',
          user.adSoyad || 'Admin',
          `Teşekkür ederiz. ${fatura.faturaDonemi.ay}/${fatura.faturaDonemi.yil} dönemi faturanız ödenmiş olarak işaretlendi.`,
          user.uid
        );
      } catch (error) {
        console.error('Mesaj gönderme hatası:', error);
      }

      await aktiviteLogService.log(
        user.uid,
        'Fatura Onaylandı',
        `${fatura.diyetisyenAdSoyad} için ${fatura.faturaDonemi.ay}/${fatura.faturaDonemi.yil} faturası onaylandı`,
        fatura.diyetisyenId
      );

      await loadFaturalar();
      showSuccess(`${fatura.diyetisyenAdSoyad} için fatura onaylandı`);
      setApproveModalOpen(false);
      setSelectedFatura(null);
    } catch (error) {
      console.error('Fatura onaylama hatası:', error);
      showError('Fatura onaylanırken bir hata oluştu');
    }
  };

  const handleCreateFaturalar = async () => {
    if (!user) return;

    try {
      setCreatingFatura(true);
      const sayi = await createFaturalarForAllDiyetisyenler();
      await aktiviteLogService.log(
        user.uid,
        'Toplu Fatura Oluşturma',
        `${sayi} adet fatura oluşturuldu`,
        undefined
      );
      await loadFaturalar();
      showSuccess(`${sayi} adet fatura oluşturuldu`);
    } catch (error: any) {
      console.error('Fatura oluşturma hatası:', error);
      showError(error.message || 'Faturalar oluşturulurken bir hata oluştu');
    } finally {
      setCreatingFatura(false);
    }
  };

  // Gecikmiş faturaları kontrol et ve güncelle
  useEffect(() => {
    const checkGecikmisFaturalar = async () => {
      const now = new Date();
      for (const fatura of faturalar) {
        if (fatura.faturaDurumu === 'beklemede') {
          const sonOdemeTarihi = fatura.sonOdemeTarihi.toDate();
          if (now > sonOdemeTarihi) {
            // 5 gün geçmiş, gecikmiş olarak işaretle
            await faturaService.update(fatura.id!, {
              faturaDurumu: 'gecikmis',
            });

            // Diyetisyeni pasifleştir
            await diyetisyenService.update(fatura.diyetisyenId, {
              aktiflikDurumu: 'pasif',
              apiErisimDurumu: 'kisitli',
              kisitlamaNedeni: 'Fatura ödemesi gecikti',
            });
          }
        }
      }
    };

    if (faturalar.length > 0) {
      checkGecikmisFaturalar();
    }
  }, [faturalar]);

  // Ay ve yıl filtreleri için seçenekler
  const ayIsimleri = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const mevcutYil = new Date().getFullYear();
  const yillar = Array.from({ length: 3 }, (_, i) => mevcutYil - i);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-green"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Faturalar</h1>
        <button
          onClick={handleCreateFaturalar}
          disabled={creatingFatura}
          className="btn-primary flex items-center gap-2"
        >
          <FileText size={18} />
          {creatingFatura ? 'Oluşturuluyor...' : 'Tüm Diyetisyenler İçin Fatura Oluştur'}
        </button>
      </div>

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
            <option value="odendi">Ödendi</option>
            <option value="gecikmis">Gecikmiş</option>
            <option value="iptal">İptal</option>
          </select>

          <select
            value={yilFilter}
            onChange={(e) => setYilFilter(e.target.value)}
            className="input"
          >
            <option value="all">Tüm Yıllar</option>
            {yillar.map((yil) => (
              <option key={yil} value={yil.toString()}>
                {yil}
              </option>
            ))}
          </select>

          <select
            value={ayFilter}
            onChange={(e) => setAyFilter(e.target.value)}
            className="input"
          >
            <option value="all">Tüm Aylar</option>
            {ayIsimleri.map((ay, index) => (
              <option key={index} value={(index + 1).toString()}>
                {ay}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Özet İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-sm text-dark-text-secondary">Toplam Fatura</div>
          <div className="text-2xl font-bold">{faturalar.length}</div>
        </div>
        <div className="card">
          <div className="text-sm text-dark-text-secondary">Bekleyen</div>
          <div className="text-2xl font-bold text-yellow-500">
            {faturalar.filter((f) => f.faturaDurumu === 'beklemede').length}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-dark-text-secondary">Ödenen</div>
          <div className="text-2xl font-bold text-green-500">
            {faturalar.filter((f) => f.faturaDurumu === 'odendi').length}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-dark-text-secondary">Toplam Tutar</div>
          <div className="text-2xl font-bold text-accent-green">
            {faturalar
              .filter((f) => f.faturaDurumu === 'odendi')
              .reduce((sum, f) => sum + f.toplamTutar, 0)
              .toFixed(2)} ₺
          </div>
        </div>
      </div>

      {/* Fatura Listesi */}
      <div className="space-y-4">
        {filteredFaturalar.map((fatura, index) => {
          const paketBilgisi = getPaketBilgisiByDanisanSayisi(fatura.danisanSayisi);
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
                      <h3 className="text-lg font-bold">{fatura.diyetisyenAdSoyad}</h3>
                      <p className="text-sm text-dark-text-secondary">{fatura.diyetisyenEmail}</p>
                      <p className="text-sm text-dark-text-secondary">Üye No: {fatura.uyeNumarasi}</p>
                    </div>
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
                      <span className="text-dark-text-secondary">Dönem:</span>
                      <p className="font-semibold">
                        {ayIsimleri[fatura.faturaDonemi.ay - 1]} {fatura.faturaDonemi.yil}
                      </p>
                    </div>
                    <div>
                      <span className="text-dark-text-secondary">Paket:</span>
                      <p className="font-semibold">{paketBilgisi.ad}</p>
                    </div>
                    <div>
                      <span className="text-dark-text-secondary">Danışan:</span>
                      <p className="font-semibold">{fatura.danisanSayisi} kişi</p>
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

                  {/* Oransal Hesaplama Bilgisi */}
                  {fatura.oransalHesaplama?.aktif && (
                    <div className="mt-4 p-3 bg-blue-500 bg-opacity-10 rounded-lg border border-blue-500 border-opacity-20">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-blue-500">Oransal Hesaplama</span>
                        <span className="badge badge-info text-xs">Aktif</span>
                      </div>
                      <div className="text-sm text-dark-text-secondary space-y-1">
                        <p>
                          <span className="font-semibold">{fatura.oransalHesaplama.aktifGunSayisi} gün</span> aktif olduğu için oransal faturalandırma yapılmıştır.
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

                  {/* Fatura Bilgileri (Vergi/TC Kimlik) */}
                  {fatura.faturaBilgileri && (
                    <div className="mt-4 p-3 bg-dark-surface rounded-lg">
                      <div className="text-sm font-semibold mb-2">Fatura Bilgileri</div>
                      <div className="text-xs text-dark-text-secondary space-y-1">
                        {fatura.faturaBilgileri.vergiNumarasi ? (
                          <>
                            <p><span className="font-semibold">Vergi No:</span> {fatura.faturaBilgileri.vergiNumarasi}</p>
                            {fatura.faturaBilgileri.vergiDairesi && (
                              <p><span className="font-semibold">Vergi Dairesi:</span> {fatura.faturaBilgileri.vergiDairesi}</p>
                            )}
                            {fatura.faturaBilgileri.adres && (
                              <p><span className="font-semibold">Adres:</span> {fatura.faturaBilgileri.adres}</p>
                            )}
                            {fatura.faturaBilgileri.sehir && (
                              <p><span className="font-semibold">Şehir:</span> {fatura.faturaBilgileri.sehir}</p>
                            )}
                            {fatura.faturaBilgileri.postaKodu && (
                              <p><span className="font-semibold">Posta Kodu:</span> {fatura.faturaBilgileri.postaKodu}</p>
                            )}
                          </>
                        ) : (
                          <p><span className="font-semibold">TC Kimlik No:</span> {fatura.faturaBilgileri.tcKimlikNo}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-2 text-sm">
                    <span className="text-dark-text-secondary">Oluşturulma: </span>
                    <span className="font-semibold">{formatDate(fatura.olusturmaTarihi)}</span>
                    <span className="text-dark-text-secondary ml-4">Son Ödeme: </span>
                    <span className="font-semibold">{formatDate(fatura.sonOdemeTarihi)}</span>
                  </div>

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

                {fatura.faturaDurumu === 'beklemede' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedFatura(fatura);
                        setApproveModalOpen(true);
                      }}
                      className="btn-primary flex items-center gap-2"
                    >
                      <CheckCircle size={18} />
                      Tahsilat Onayla
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredFaturalar.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-dark-text-secondary text-lg">
            {searchTerm || statusFilter !== 'all' || ayFilter !== 'all' || yilFilter !== 'all'
              ? 'Arama kriterlerinize uygun fatura bulunamadı'
              : 'Henüz fatura kaydı bulunmuyor'}
          </p>
        </div>
      )}

      <ConfirmModal
        isOpen={approveModalOpen}
        onClose={() => {
          setApproveModalOpen(false);
          setSelectedFatura(null);
        }}
        onConfirm={() => selectedFatura && handleApproveFatura(selectedFatura)}
        title="Fatura Tahsilatını Onayla"
        message={`${selectedFatura?.diyetisyenAdSoyad} için ${selectedFatura?.faturaDonemi.ay}/${selectedFatura?.faturaDonemi.yil} dönemi faturasının tahsilatını onaylamak istediğinizden emin misiniz?`}
        confirmText="Onayla"
        cancelText="İptal"
        type="info"
      />
    </div>
  );
}
